"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import styles from "./layout.module.css";

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
}

const coreLinks: NavItem[] = [
  {
    href: "/dashboard",
    label: "Home",
    shortLabel: "Home",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-8.5Z" />
      </svg>
    ),
  },
  {
    href: "/projects",
    label: "Projects",
    shortLabel: "Projects",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4zM9 6V4h6v2" />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    shortLabel: "Tasks",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9.5 7h9M9.5 12h9M9.5 17h9M5 7h.01M5 12h.01M5 17h.01" />
      </svg>
    ),
  },
  {
    href: "/grocery",
    label: "Grocery",
    shortLabel: "Grocery",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h13l-1.2 10.2A2 2 0 0 1 15.8 20H9.2a2 2 0 0 1-2-1.8L6 8Zm2-3h7l1 3H7l1-3Z" />
      </svg>
    ),
  },
];

const secondaryLinks: NavItem[] = [
  {
    href: "/documents",
    label: "Documents",
    shortLabel: "Docs",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l5 5v13H7V3Zm7 1.5V9h4.5" />
      </svg>
    ),
  },
  {
    href: "/recipes",
    label: "Recipes",
    shortLabel: "Recipes",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10v16H7zM9 8h6M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: "/recs",
    label: "Recs",
    shortLabel: "Recs",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
      </svg>
    ),
  },
];

const mobilePrimaryLinks = [coreLinks[0], coreLinks[3], coreLinks[1]];
const mobileActionLinks = [coreLinks[2], ...secondaryLinks];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
    >
      {item.label}
    </Link>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const mobileActionsRef = useRef<HTMLDivElement>(null);
  const actionsActive = mobileActionLinks.some((item) => isActive(pathname, item.href));

  useEffect(() => {
    setIsActionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!mobileActionsRef.current) {
        return;
      }
      if (!mobileActionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div className={styles.shell}>
      <header className={styles.topNav}>
        <div className={styles.navInner}>
          <Link href="/dashboard" className={styles.logo}>
            holmatrix
          </Link>

          <nav className={styles.desktopNav}>
            {coreLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
            <span className={styles.divider} aria-hidden="true" />
            {secondaryLinks.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            {mobilePrimaryLinks.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.mobileTopLink} ${active ? styles.mobileTopLinkActive : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className={styles.mobileActions} ref={mobileActionsRef}>
              <button
                type="button"
                className={`${styles.mobileActionsButton} ${
                  actionsActive || isActionsOpen ? styles.mobileTopLinkActive : ""
                }`}
                onClick={() => setIsActionsOpen((open) => !open)}
                aria-expanded={isActionsOpen}
                aria-controls="mobile-actions-menu"
              >
                Actions
              </button>

              {isActionsOpen ? (
                <div id="mobile-actions-menu" className={styles.mobileActionsMenu}>
                  {mobileActionLinks.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.mobileActionLink} ${active ? styles.mobileTopLinkActive : ""}`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
