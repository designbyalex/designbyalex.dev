import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Container — token-agnostic layout primitive: centres content with a
 * max-width and the standard horizontal gutter. Colours come from the
 * token layer on whatever it wraps.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-6", className)}
      {...props}
    />
  );
}
