"use client";

export function ServiceChecks({ options, selected, name = "service_keys[]" }: { options: { value: string; label: string }[]; selected: string[]; name?: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Services</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((o) => (
          <label key={o.value} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-graphite/15 bg-white/40 px-3 text-sm has-checked:border-copper has-checked:bg-copper/5">
            <input type="checkbox" name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="size-4 accent-copper" />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
