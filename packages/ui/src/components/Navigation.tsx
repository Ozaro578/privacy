import type { ComponentType, ReactNode } from "react";
import { cx } from "../cx";

export interface NavLinkProps {
  href: string;
  className?: string;
  "aria-current"?: "page" | undefined;
  "aria-label"?: string;
  children: ReactNode;
}

/** Standard-Link; apps/web übergibt z. B. next/link, apps/mobile einen Expo-Router-Link. */
export const DefaultLink: ComponentType<NavLinkProps> = ({ href, className, children, ...rest }) => (
  <a href={href} className={className} {...rest}>
    {children}
  </a>
);

export interface NavItem {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
  /** Zähler, z. B. ungelesene Nachrichten; wird sichtbar und als Screenreader-Text ausgegeben. */
  badge?: number;
  badgeLabel?: string;
}

export interface BottomTabBarProps {
  items: NavItem[];
  label: string;
  linkComponent?: ComponentType<NavLinkProps>;
  className?: string;
}

/** Mobile Tab-Leiste (Heute, Lernen, Fahren, Finanzen, Profil). Alle Ziele mindestens 44 px. */
export function BottomTabBar({ items, label, linkComponent: Link = DefaultLink, className }: BottomTabBarProps) {
  return (
    <nav aria-label={label} className={cx("fixed inset-x-0 bottom-0 z-(--klar-z-sticky) border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]", className)}>
      <ul className="flex items-stretch justify-around">
        {items.map((item) => (
          <li key={item.href} className="flex-1">
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cx(
                "relative flex min-h-touch flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs font-medium",
                "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
                item.active ? "text-primary" : "text-fg-secondary hover:text-fg"
              )}
            >
              {item.icon && <span aria-hidden="true" className="relative">{item.icon}{item.badge ? <span aria-hidden="true" className="absolute -end-2 -top-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-on-primary">{item.badge > 99 ? "99+" : item.badge}</span> : null}</span>}
              <span>{item.label}</span>
              {item.badge ? <span className="sr-only">{item.badgeLabel ?? `${item.badge} neu`}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface SidebarNavProps {
  groups: NavGroup[];
  label: string;
  /** Kopfbereich, z. B. Logo und Fahrschulname. */
  header?: ReactNode;
  /** Fußbereich, z. B. Nutzerkonto, Rechtsstand. */
  footer?: ReactNode;
  linkComponent?: ComponentType<NavLinkProps>;
  className?: string;
}

/** Seitennavigation für Büro, Admin, Owner und Plattform-Admin. */
export function SidebarNav({ groups, label, header, footer, linkComponent: Link = DefaultLink, className }: SidebarNavProps) {
  return (
    <nav aria-label={label} className={cx("flex h-full w-64 flex-col border-e border-line bg-surface", className)}>
      {header && <div className="border-b border-line-subtle p-4">{header}</div>}
      <div className="flex-1 overflow-y-auto p-3">
        {groups.map((group, gi) => (
          <div key={gi} className={cx(gi > 0 && "mt-4")}>
            {group.label && <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">{group.label}</p>}
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cx(
                      "flex min-h-touch items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-120 motion-reduce:transition-none",
                      "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus",
                      item.active ? "bg-secondary text-primary" : "text-fg-secondary hover:bg-muted hover:text-fg"
                    )}
                  >
                    {item.icon && <span aria-hidden="true" className="shrink-0">{item.icon}</span>}
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-danger-surface px-2 py-0.5 text-xs font-semibold text-danger-text">
                        <span aria-hidden="true">{item.badge}</span>
                        <span className="sr-only">{item.badgeLabel ?? `${item.badge} neu`}</span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {footer && <div className="border-t border-line-subtle p-4 text-xs text-fg-muted">{footer}</div>}
    </nav>
  );
}
