'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ── Context ───────────────────────────────────────────────────────────────────

interface NavigationSidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NavigationSidebarContext = React.createContext<NavigationSidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {}
});

function useNavigationSidebar() {
  return React.useContext(NavigationSidebarContext);
}

// ── Root ──────────────────────────────────────────────────────────────────────

interface NavigationSidebarProps extends React.ComponentProps<'aside'> {
  /** Controlled collapsed state. */
  readonly collapsed?: boolean;
  /** Initial collapsed state when uncontrolled. Defaults to `false`. */
  readonly defaultCollapsed?: boolean;
  /** Callback fired when the collapsed state changes. */
  readonly onCollapsedChange?: (collapsed: boolean) => void;
}

function NavigationSidebar({
  className,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  children,
  ...props
}: NavigationSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
  const isControlled = collapsedProp !== undefined;
  const collapsed = isControlled ? collapsedProp : internalCollapsed;

  const setCollapsed = React.useCallback(
    (value: boolean) => {
      if (!isControlled) setInternalCollapsed(value);
      if (value !== collapsed) onCollapsedChange?.(value);
    },
    [isControlled, onCollapsedChange, collapsed]
  );

  const contextValue = React.useMemo(() => ({ collapsed, setCollapsed }), [collapsed, setCollapsed]);

  return (
    <NavigationSidebarContext.Provider value={contextValue}>
      <aside
        aria-label="Main navigation"
        data-slot="navigation-sidebar"
        data-collapsed={collapsed}
        className={cn(
          'border-sidebar-border bg-sidebar flex h-full flex-col border-r transition-[width] duration-300',
          collapsed ? 'w-14' : 'w-60',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </NavigationSidebarContext.Provider>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function NavigationSidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navigation-sidebar-header"
      className={cn('border-sidebar-border flex h-14 shrink-0 items-center border-b px-3', className)}
      {...props}
    />
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

function NavigationSidebarContent({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      data-slot="navigation-sidebar-content"
      className={cn('flex flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto p-2', className)}
      {...props}
    />
  );
}

// ── Group ─────────────────────────────────────────────────────────────────────

const NavigationSidebarGroupContext = React.createContext<string | undefined>(undefined);

function NavigationSidebarGroup({ className, ...props }: React.ComponentProps<'section'>) {
  const labelId = React.useId();
  return (
    <NavigationSidebarGroupContext.Provider value={labelId}>
      <section
        aria-labelledby={labelId}
        data-slot="navigation-sidebar-group"
        className={cn('flex flex-col gap-0.5', className)}
        {...props}
      />
    </NavigationSidebarGroupContext.Provider>
  );
}

function NavigationSidebarGroupLabel({ className, ...props }: React.ComponentProps<'span'>) {
  const { collapsed } = useNavigationSidebar();
  const labelId = React.useContext(NavigationSidebarGroupContext);

  return (
    <span
      id={labelId}
      data-slot="navigation-sidebar-group-label"
      className={cn(
        'text-muted-foreground px-2 pt-3 pb-1 text-xs font-semibold tracking-wider uppercase',
        collapsed && 'sr-only',
        className
      )}
      {...props}
    />
  );
}

// ── Item ──────────────────────────────────────────────────────────────────────

type NavigationSidebarItemBaseProps = Omit<React.ComponentProps<'button'>, 'children'> & {
  /** Icon element rendered before the label. */
  readonly icon?: React.ReactNode;
  /** Visible label and tooltip text when collapsed. */
  readonly label: string;
  /** Whether this item represents the current active route. */
  readonly active?: boolean;
  /** Optional badge rendered at the trailing edge (hidden when collapsed). */
  readonly badge?: React.ReactNode;
  /** Accessible description of the badge value, appended to the tooltip in collapsed mode (e.g. "12 unread notifications"). */
  readonly badgeLabel?: string;
};

type NavigationSidebarItemProps =
  | (NavigationSidebarItemBaseProps & {
      /** `false` (default): renders as `<button>`. Passing children is not allowed. */
      readonly asChild?: false;
      readonly children?: never;
    })
  | (NavigationSidebarItemBaseProps & {
      /** `true`: renders as the provided element (e.g. Next.js `<Link>`). Pass the element as `children`. */
      readonly asChild: true;
      /** The element to render as (e.g. `<Link href="...">`). */
      readonly children: React.ReactElement;
    });

function NavigationSidebarItem({
  className,
  icon,
  label,
  active,
  badge,
  badgeLabel,
  asChild = false,
  children,
  ...props
}: NavigationSidebarItemProps) {
  const { collapsed } = useNavigationSidebar();

  const Comp = asChild ? Slot.Root : 'button';

  const innerContent = (
    <>
      {icon && <span className={cn('shrink-0 [&_svg]:size-[1.125rem]', active && 'text-sidebar-accent-foreground')}>{icon}</span>}
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && badge && <span className="ml-auto">{badge}</span>}
    </>
  );

  const item = (
    <Comp
      data-slot="navigation-sidebar-item"
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
        'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:ring-sidebar-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
        active && 'bg-sidebar-accent text-sidebar-accent-foreground',
        collapsed && 'justify-center px-0',
        className
      )}
      {...props}
    >
      {asChild ? (
        <>
          {children}
          <Slot.Slottable>{innerContent}</Slot.Slottable>
        </>
      ) : (
        innerContent
      )}
    </Comp>
  );

  if (collapsed) {
    const tooltipLabel = badgeLabel ? `${label} (${badgeLabel})` : label;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right">{tooltipLabel}</TooltipContent>
      </Tooltip>
    );
  }

  return item;
}

// ── Separator ─────────────────────────────────────────────────────────────────

function NavigationSidebarSeparator({ className, ...props }: React.ComponentProps<'hr'>) {
  return (
    <hr aria-hidden="true" data-slot="navigation-sidebar-separator" className={cn('border-sidebar-border my-1', className)} {...props} />
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function NavigationSidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="navigation-sidebar-footer"
      className={cn('border-sidebar-border mt-auto flex shrink-0 flex-col gap-1 border-t p-2', className)}
      {...props}
    />
  );
}

// ── Collapse Toggle ───────────────────────────────────────────────────────────

function NavigationSidebarCollapseToggle({ className, ...props }: Omit<React.ComponentProps<typeof Button>, 'children' | 'onClick'>) {
  const { collapsed, setCollapsed } = useNavigationSidebar();

  return (
    <Button
      data-slot="navigation-sidebar-collapse-toggle"
      variant="ghost"
      size="icon-sm"
      className={cn('hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-auto shrink-0', className)}
      onClick={() => setCollapsed(!collapsed)}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      {...props}
    >
      {collapsed ? <ChevronRight /> : <ChevronLeft />}
    </Button>
  );
}

export {
  NavigationSidebar,
  NavigationSidebarHeader,
  NavigationSidebarContent,
  NavigationSidebarGroup,
  NavigationSidebarGroupLabel,
  NavigationSidebarItem,
  NavigationSidebarSeparator,
  NavigationSidebarFooter,
  NavigationSidebarCollapseToggle,
  useNavigationSidebar
};
