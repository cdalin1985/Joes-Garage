"use client";

import { IconTrash } from "@/components/icons";

/**
 * Wraps a bound server action in a form with a confirmation prompt.
 */
export function DeleteButton({
  action,
  label = "Delete",
  confirmText = "Are you sure? This cannot be undone.",
  className = "btn-danger",
  iconOnly = false,
}: {
  action: () => void | Promise<void>;
  label?: string;
  confirmText?: string;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button type="submit" className={className} title={label}>
        <IconTrash className="h-4 w-4" />
        {!iconOnly && label}
      </button>
    </form>
  );
}
