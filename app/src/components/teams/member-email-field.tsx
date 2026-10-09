import { Check, Search } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/types';

interface MemberEmailFieldProps {
  registration: UseFormRegisterReturn<'memberEmail'>;
  users: User[];
  value: string;
  error?: string;
  readOnly: boolean;
  onChange: (value: string) => void;
  onSelect: (user: User) => void;
}

export function MemberEmailField({
  registration,
  users,
  value,
  error,
  readOnly,
  onChange,
  onSelect,
}: MemberEmailFieldProps) {
  const normalizedValue = value.trim().toLowerCase();
  const matches = normalizedValue
    ? users
        .filter(user => `${user.email} ${user.name}`.toLowerCase().includes(normalizedValue))
        .slice(0, 5)
    : [];
  const exactMatch = users.some(user => user.email.toLowerCase() === normalizedValue);

  return (
    <div className="space-y-2">
      <Label htmlFor="member-email">
        {readOnly ? 'Founding member' : 'Initial member email (optional)'}
      </Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          {...registration}
          id="member-email"
          type="email"
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'member-email-error' : 'member-email-help'}
          readOnly={readOnly}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Search by member email"
          className="pl-9"
        />
        {exactMatch && (
          <Check
            aria-label="Member selected"
            className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-emerald-600"
          />
        )}
      </div>

      {!readOnly && matches.length > 0 && !exactMatch && (
        <div
          id="member-email-options"
          role="listbox"
          aria-label="Matching members"
          className="overflow-hidden rounded-lg border bg-popover shadow-sm"
        >
          {matches.map(user => (
            <button
              key={user.id}
              type="button"
              role="option"
              aria-selected="false"
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              onClick={() => onSelect(user)}
            >
              <span className="font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </button>
          ))}
        </div>
      )}

      {error ? (
        <p id="member-email-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p id="member-email-help" className="text-xs text-muted-foreground">
          {readOnly
            ? 'You will be added automatically as the team founder.'
            : 'Search for a participant to add alongside your admin account.'}
        </p>
      )}
    </div>
  );
}
