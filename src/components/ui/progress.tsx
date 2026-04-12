import type { HTMLAttributes } from "react";
import { cn } from "./utils";

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value?: number;
  max?: number;
};

export function Progress({
  value = 0,
  max = 100,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div
      className={cn("h-2 w-full rounded-full bg-slate-200", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
