import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "./utils";

type SelectProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

type SelectTriggerProps = { children?: ReactNode };
type SelectValueProps = { placeholder?: string };
type SelectContentProps = { children?: ReactNode };
type SelectItemProps = { value: string; children?: ReactNode };

export function Select({
  value,
  onValueChange,
  children,
  className,
}: SelectProps) {
  let placeholder = "Select an option";
  const options: Array<{ value: string; label: ReactNode }> = [];

  Children.forEach(children, (child) => {
    if (!isValidElement<SelectTriggerProps | SelectContentProps>(child)) return;

    if (child.type === SelectTrigger) {
      const triggerChildren = child.props.children;
      Children.forEach(triggerChildren, (triggerChild) => {
        if (!isValidElement<SelectValueProps>(triggerChild)) return;
        if (
          triggerChild.type === SelectValue &&
          triggerChild.props.placeholder
        ) {
          placeholder = triggerChild.props.placeholder;
        }
      });
    }

    if (child.type === SelectContent) {
      Children.forEach(child.props.children, (item) => {
        if (!isValidElement<SelectItemProps>(item)) return;
        if (item.type === SelectItem) {
          options.push({ value: item.props.value, label: item.props.children });
        }
      });
    }
  });

  return (
    <select
      className={cn(
        "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
        className,
      )}
      value={value ?? ""}
      onChange={(event) => onValueChange?.(event.target.value)}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="sr-only">{placeholder}</span>;
}

export function SelectContent({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function SelectItem({
  children,
}: {
  children?: ReactNode;
  value: string;
}) {
  return <>{children}</>;
}
