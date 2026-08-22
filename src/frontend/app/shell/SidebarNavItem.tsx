import type { NavItem } from "./navConfig";

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
      className="flex items-center gap-2.5 px-3 py-[7px] rounded-[8px] w-full text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
      style={{
        background: active ? "rgba(232,185,60,0.14)" : "transparent",
        borderLeft: active ? "2px solid #e8b93c" : "2px solid transparent",
      }}
      aria-current={active ? "page" : undefined}
    >
      <item.Icon
        size={15}
        strokeWidth={1.6}
        color={active ? "#e8b93c" : "rgba(250,238,203,0.65)"}
      />
      <span
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: 13,
          color: active ? "#faeecb" : "rgba(250,238,203,0.65)",
          letterSpacing: -0.15,
          fontVariationSettings: '"wdth" 100',
        }}
      >
        {item.label}
      </span>
    </button>
  );
}
