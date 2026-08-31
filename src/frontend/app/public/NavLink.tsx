import type { MouseEventHandler } from 'react';

export function NavLink({
  label,
  href,
  active,
  onClick,
}: {
  label: string;
  href: string;
  active?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className="relative flex flex-col items-start pb-[3px] text-[13px] leading-none tracking-[-0.15px] whitespace-nowrap transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8b93c] rounded-sm"
      style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: active ? '#ffffff' : '#faeecb',
        opacity: active ? 1 : 0.78,
      }}
    >
      {label}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: '#e8b93c' }}
          aria-hidden="true"
        />
      )}
    </a>
  );
}
