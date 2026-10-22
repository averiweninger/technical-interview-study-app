"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LogoutButton } from "@/features/auth/logout-button";
import { useDemoPreferences } from "@/features/settings/demo-preferences";

/** A native disclosure keeps links and the logout form in the normal keyboard tab order. */
export function ProfileMenu() {
  const { account } = useDemoPreferences();
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const names = account.displayName.split(/\s+/).filter(Boolean);
  const initials = [names[0], ...(names.length > 1 ? [names.at(-1)] : [])]
    .map((name) => Array.from(name ?? "")[0] ?? "").join("").toUpperCase();

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && menu.current && !menu.current.contains(event.target)) menu.current.open = false;
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return <details ref={menu} className="profile-menu" onKeyDown={(event) => {
    if (event.key === "Escape" && menu.current?.open) {
      event.preventDefault(); menu.current.open = false; trigger.current?.focus();
    }
  }} onBlur={(event) => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }}>
    <summary ref={trigger} role="button" className="avatar account-trigger" aria-label="Account menu" aria-controls="account-options">
      <span aria-hidden="true" data-initials={initials} className="before:content-[attr(data-initials)]" />
    </summary>
    <div id="account-options" className="profile-panel">
      <div className="border-b border-border px-3 py-3">
        <p className="break-words text-sm font-semibold">{account.displayName}</p>
        <p className="mt-1 break-all text-xs text-muted-foreground" title={account.email}>{account.email}</p>
      </div>
      <Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined} className="profile-action" onClick={() => { if (menu.current) menu.current.open = false; }}>Settings</Link>
      <LogoutButton />
    </div>
  </details>;
}
