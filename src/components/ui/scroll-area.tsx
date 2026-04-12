import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./utils";

export const ScrollArea = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-y-auto", className)} {...props} />
));

ScrollArea.displayName = "ScrollArea";
