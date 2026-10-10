'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { Role } from '@/types';

interface UserRoleSelectProps {
  value: Role;
  disabled?: boolean;
  onChange: (role: Role) => void;
}

export function UserRoleSelect({ value, disabled = false, onChange }: UserRoleSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={next => next && onChange(next as Role)}
    >
      <SelectTrigger className="w-36" aria-label="Access role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="participant">Participant</SelectItem>
        <SelectItem value="admin">Administrator</SelectItem>
      </SelectContent>
    </Select>
  );
}
