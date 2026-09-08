import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-[background-color,color,border-color,transform] duration-300 ease-premium disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        copper: "bg-copper text-ivory hover:bg-copper-dark",
        ivory: "bg-ivory text-obsidian hover:bg-stone",
        obsidian: "bg-obsidian text-ivory hover:bg-graphite",
        outlineLight: "border border-ivory/35 text-ivory hover:border-ivory hover:bg-ivory/8",
        outlineDark: "border border-graphite/30 text-graphite hover:border-graphite hover:bg-graphite/5",
        ghost: "text-current hover:opacity-70",
        link: "rounded-none px-0 py-0 h-auto underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-10 px-5 text-sm",
        md: "h-12 px-6 text-[0.9375rem]",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "copper", size: "md" },
  },
);

type CommonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
  arrow?: boolean;
  children: React.ReactNode;
};

type ButtonProps = CommonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;
type LinkButtonProps = CommonProps & { href: string; external?: boolean };

export function Button({ className, variant, size, arrow, children, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
      {arrow ? <Arrow /> : null}
    </button>
  );
}

export function LinkButton({ className, variant, size, arrow, children, href, external }: LinkButtonProps) {
  const cls = cn(buttonVariants({ variant, size }), className);
  if (external) {
    return (
      <a className={cls} href={href} target="_blank" rel="noreferrer">
        {children}
        {arrow ? <Arrow /> : null}
      </a>
    );
  }
  return (
    <Link className={cls} href={href}>
      {children}
      {arrow ? <Arrow /> : null}
    </Link>
  );
}

function Arrow() {
  return (
    <ArrowUpRight
      className="size-4 transition-transform duration-300 ease-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      aria-hidden
    />
  );
}

export { buttonVariants };
