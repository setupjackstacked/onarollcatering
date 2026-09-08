import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Brand logo. Assets live in /public/brand:
 *   logo-copper.png — full lock-up (transparent, copper)
 *   mark-copper.png — compact utensil mark
 *   logo-horizontal.png — mark + wordmark lockup for the header
 * Replace with supplied SVG/PNG without touching components.
 */
export function Logo({
  variant = "full",
  className,
  priority,
}: {
  variant?: "full" | "mark" | "horizontal";
  className?: string;
  priority?: boolean;
}) {
  if (variant === "mark") {
    return (
      <Image
        src="/brand/mark-copper.png"
        alt="On A Roll Catering"
        width={384}
        height={339}
        priority={priority}
        className={cn("h-9 w-auto", className)}
      />
    );
  }
  if (variant === "horizontal") {
    return (
      <Image
        src="/brand/logo-horizontal.png"
        alt="On A Roll Catering"
        width={1172}
        height={320}
        priority={priority}
        className={cn("h-10 w-auto", className)}
      />
    );
  }
  return (
    <Image
      src="/brand/logo-copper.png"
      alt="On A Roll Catering"
      width={788}
      height={678}
      priority={priority}
      className={cn("h-12 w-auto", className)}
    />
  );
}

export function LogoLink({ className, ...props }: React.ComponentProps<typeof Logo>) {
  return (
    <Link href="/" aria-label="On A Roll Catering — home" className={cn("inline-flex shrink-0", className)}>
      <Logo {...props} />
    </Link>
  );
}
