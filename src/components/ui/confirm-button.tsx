'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A submit button (used inside a `<form action={serverAction}>`) that asks for
 * confirmation before the destructive action runs. Cancels the submit if the
 * user declines.
 */
export function ConfirmButton({
  message,
  label = 'Delete',
  size = 'sm',
  variant = 'ghost',
  withIcon = true,
}: {
  message: string;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'ghost' | 'outline' | 'destructive';
  withIcon?: boolean;
}) {
  return (
    <Button
      type="submit"
      size={size}
      variant={variant}
      className="text-destructive hover:text-destructive"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {withIcon && <Trash2 className="h-4 w-4" />} {label}
    </Button>
  );
}
