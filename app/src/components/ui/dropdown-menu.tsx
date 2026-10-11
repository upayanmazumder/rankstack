import * as React from 'react';
import { Menu as MenuPrimitive } from '@base-ui/react/menu';

import { cn } from '@/lib/utils';

const DropdownMenu = MenuPrimitive.Root;
const DropdownMenuTrigger = MenuPrimitive.Trigger;

function DropdownMenuPortal({ ...props }: React.ComponentProps<typeof MenuPrimitive.Portal>) {
  return <MenuPrimitive.Portal {...props} />;
}

function mergeClassName<T>(
  className: string | ((state: T) => string | undefined) | undefined,
  staticClassName: string
) {
  if (typeof className === 'function') {
    return (state: T) => cn(staticClassName, className(state));
  }
  return cn(staticClassName, className);
}

function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Popup>) {
  return (
    <DropdownMenuPortal>
      <MenuPrimitive.Positioner>
        <MenuPrimitive.Popup
          className={mergeClassName(
            className,
            'z-50 max-h-[min(24rem,var(--available-height))] min-w-[8rem] overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0'
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </DropdownMenuPortal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item> & { inset?: boolean }) {
  return (
    <MenuPrimitive.Item
      className={cn(
        'relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
