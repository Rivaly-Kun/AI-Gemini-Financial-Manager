import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "./utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

type DialogProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
};

export function Dialog({ open = false, onOpenChange, children }: DialogProps) {
  const contextValue = useMemo(
    () => ({ open, setOpen: (next: boolean) => onOpenChange?.(next) }),
    [open, onOpenChange],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
}

type DialogTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export function DialogTrigger({
  asChild,
  children,
  ...props
}: DialogTriggerProps) {
  const context = useContext(DialogContext);
  if (!context) return null;

  const handleClick = () => context.setOpen(true);

  if (asChild && children && typeof children === "object") {
    const child = children as ReactNode & { props?: { onClick?: () => void } };
    return (
      <span
        onClick={() => {
          child?.props?.onClick?.();
          handleClick();
        }}
      >
        {children}
      </span>
    );
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const context = useContext(DialogContext);
  if (!context?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl",
          className,
        )}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => context.setOpen(false)}
            className="rounded-full px-2 py-1 text-sm text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

export function DialogTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-slate-900", className)}>
      {children}
    </h2>
  );
}
