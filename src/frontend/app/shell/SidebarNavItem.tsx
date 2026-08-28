import type { NavItem } from './navConfig';

export function SidebarNavItem({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center px-2 py-[7px] rounded-[8px] w-full text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)] xl:justify-start xl:gap-2.5 xl:px-3"
      style={{
        background: active ? 'var(--sidebar-accent)' : 'transparent',
        borderLeft: active ? '2px solid var(--sidebar-primary)' : '2px solid transparent',
      }}
      aria-current={active ? 'page' : undefined}
      aria-label={item.label}
      title={item.label}
    >
      <item.Icon size={15} strokeWidth={1.6} color={active ? 'var(--sidebar-primary)' : 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)'} />
      <span
        className="hidden xl:inline"
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: 13,
          color: active ? 'var(--sidebar-foreground)' : 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)',
          letterSpacing: -0.15,
          fontVariationSettings: '"wdth" 100',
        }}
      >
        {item.label}
      </span>
    </button>
  );
}
