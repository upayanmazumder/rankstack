'use client';

import { SlidersHorizontal } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { SubmissionStatusFilter } from './submission-history-data';

export interface ContestFilterOption {
  id: string;
  title: string;
}

interface SubmissionFiltersProps {
  contests: ContestFilterOption[];
  contestId: string;
  status: SubmissionStatusFilter;
  onContestChange: (contestId: string) => void;
  onStatusChange: (status: SubmissionStatusFilter) => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: SubmissionStatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'correct' },
  { label: 'Rejected', value: 'incorrect' },
  { label: 'Partial', value: 'partial' },
];

export function SubmissionFilters({
  contests,
  contestId,
  status,
  onContestChange,
  onStatusChange,
}: SubmissionFiltersProps) {
  const contestItems = [
    { label: 'All contests', value: 'all' },
    ...contests.map(contest => ({ label: contest.title, value: contest.id })),
  ];

  return (
    <div className="grid gap-4 border-b bg-muted/20 p-4 sm:grid-cols-2 sm:p-5">
      <div className="space-y-2">
        <label
          htmlFor="submission-contest-filter"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          Contest
        </label>
        <Select
          items={contestItems}
          value={contestId}
          onValueChange={value => value && onContestChange(value)}
        >
          <SelectTrigger id="submission-contest-filter" aria-label="Filter by contest">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contestItems.map(item => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="submission-status-filter" className="text-sm font-medium">
          Evaluation status
        </label>
        <Select
          items={STATUS_OPTIONS}
          value={status}
          onValueChange={value => value && onStatusChange(value)}
        >
          <SelectTrigger id="submission-status-filter" aria-label="Filter by evaluation status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
