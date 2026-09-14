#!/usr/bin/env python3
"""
Generates a supabase-js compatible `Database` type from a live Postgres schema.
Stand-in for `supabase gen types` (which needs Docker). Reads connection from
PG* env vars. Covers tables, views, enums and functions in `public`.
"""
import json, subprocess, sys, os

def q(sql):
    out = subprocess.run(["psql", "-At", "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], capture_output=True, text=True, check=True).stdout.strip()
    return json.loads(out) if out else []

PG_TO_TS = {
    "uuid": "string", "text": "string", "character varying": "string", "character": "string", "citext": "string",
    "timestamp with time zone": "string", "timestamp without time zone": "string", "date": "string", "time without time zone": "string",
    "integer": "number", "smallint": "number", "bigint": "number", "real": "number", "double precision": "number",
    "numeric": "string",  # numeric arrives as string via PostgREST — keep money exact
    "boolean": "boolean", "jsonb": "Json", "json": "Json", "bytea": "string",
}

enums = q("""select json_agg(json_build_object('name', t.typname, 'values', (select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid)))
from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname='public' and t.typtype='e'""")
enum_names = {e["name"] for e in enums}

def ts_type(col):
    dt, udt, arr = col["data_type"], col["udt_name"], col["data_type"] == "ARRAY"
    if arr:
        base = udt.lstrip("_")
        inner = f'Database["public"]["Enums"]["{base}"]' if base in enum_names else PG_TO_TS.get({"int4":"integer","int8":"bigint","text":"text","uuid":"uuid","numeric":"numeric","bool":"boolean"}.get(base, base), "unknown")
        return f"{inner}[]"
    if dt == "USER-DEFINED" and udt in enum_names:
        return f'Database["public"]["Enums"]["{udt}"]'
    return PG_TO_TS.get(dt, "unknown")

cols = q("""select json_agg(json_build_object('table', table_name, 'name', column_name, 'data_type', data_type, 'udt_name', udt_name,
  'nullable', is_nullable='YES', 'has_default', column_default is not null, 'is_generated', is_generated='ALWAYS' or identity_generation is not null)
  order by table_name, ordinal_position) from information_schema.columns where table_schema='public'""")
tables = q("select json_agg(json_build_object('name', table_name, 'kind', table_type) order by table_name) from information_schema.tables where table_schema='public'")
fks = q("""select coalesce(json_agg(json_build_object('table', tc.table_name, 'name', tc.constraint_name, 'cols', (select json_agg(kcu.column_name) from information_schema.key_column_usage kcu where kcu.constraint_name=tc.constraint_name),
  'ref_table', ccu.table_name, 'ref_cols', (select json_agg(ccu2.column_name) from information_schema.constraint_column_usage ccu2 where ccu2.constraint_name=tc.constraint_name))), '[]')
  from information_schema.table_constraints tc join information_schema.constraint_column_usage ccu on ccu.constraint_name=tc.constraint_name
  where tc.table_schema='public' and tc.constraint_type='FOREIGN KEY'""")
funcs = q("""select coalesce(json_agg(json_build_object('name', p.proname, 'args', pg_get_function_arguments(p.oid), 'ret', pg_get_function_result(p.oid))), '[]')
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and p.proname not like 'test_%'
  and not exists (select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')
  and pg_get_function_result(p.oid) <> 'trigger'""")

by_table = {}
for c in cols: by_table.setdefault(c["table"], []).append(c)
fk_by_table = {}
for f in fks: fk_by_table.setdefault(f["table"], []).append(f)

def emit_table(t, is_view):
    lines = []
    tcols = by_table.get(t, [])
    lines.append(f"      {t}: {{")
    lines.append("        Row: {")
    for c in tcols:
        lines.append(f'          {c["name"]}: {ts_type(c)}{" | null" if c["nullable"] else ""}')
    lines.append("        }")
    if not is_view:
        lines.append("        Insert: {")
        for c in tcols:
            opt = c["nullable"] or c["has_default"] or c["is_generated"]
            lines.append(f'          {c["name"]}{"?" if opt else ""}: {ts_type(c)}{" | null" if c["nullable"] else ""}')
        lines.append("        }")
        lines.append("        Update: {")
        for c in tcols:
            lines.append(f'          {c["name"]}?: {ts_type(c)}{" | null" if c["nullable"] else ""}')
        lines.append("        }")
    else:
        lines.append("        Insert: never")
        lines.append("        Update: never")
    rels = fk_by_table.get(t, [])
    if rels:
        lines.append("        Relationships: [")
        for r in rels:
            lines.append(f'          {{ foreignKeyName: "{r["name"]}"; columns: {json.dumps(r["cols"])}; isOneToOne: false; referencedRelation: "{r["ref_table"]}"; referencedColumns: {json.dumps(r["ref_cols"])} }},')
        lines.append("        ]")
    else:
        lines.append("        Relationships: []")
    lines.append("      }")
    return lines

def ts_sql_type(s):
    s = s.strip()
    if s.endswith("[]"): return ts_sql_type(s[:-2]) + "[]"
    if s.startswith("public."): s = s[7:]
    if s in enum_names: return f'Database["public"]["Enums"]["{s}"]'
    return {"uuid":"string","text":"string","boolean":"boolean","void":"undefined","jsonb":"Json","integer":"number","int":"number"}.get(s, "unknown")

def emit_func(f):
    args = []
    for part in [a for a in f["args"].split(",") if a.strip()]:
        toks = part.strip().split()
        variadic = toks[0].upper() == "VARIADIC"
        if variadic: toks = toks[1:]
        name = toks[0]; typ = " ".join(t for t in toks[1:] if t.upper() != "DEFAULT" and not t.startswith("'"))
        typ = typ.split(" DEFAULT")[0].split("DEFAULT")[0].strip()
        opt = "DEFAULT" in part.upper()
        args.append(f'{name}{"?" if opt else ""}: {ts_sql_type(typ)}')
    return f'      {f["name"]}: {{ Args: {{ {"; ".join(args)} }}; Returns: {ts_sql_type(f["ret"])} }}'

out = []
out.append("export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]")
out.append("")
out.append("export type Database = {")
out.append("  public: {")
out.append("    Tables: {")
for t in tables:
    if t["kind"] == "BASE TABLE": out += emit_table(t["name"], False)
out.append("    }")
out.append("    Views: {")
for t in tables:
    if t["kind"] == "VIEW": out += emit_table(t["name"], True)
out.append("    }")
out.append("    Functions: {")
seen=set()
for f in funcs:
    if f["name"] in seen: continue
    seen.add(f["name"]); out.append(emit_func(f))
out.append("    }")
out.append("    Enums: {")
for e in enums:
    out.append(f'      {e["name"]}: {" | ".join(json.dumps(v) for v in e["values"])}')
out.append("    }")
out.append("    CompositeTypes: Record<string, never>")
out.append("  }")
out.append("}")
out.append("")
out.append('export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]')
out.append('export type Views<T extends keyof Database["public"]["Views"]> = Database["public"]["Views"][T]["Row"]')
print("\n".join(out))
