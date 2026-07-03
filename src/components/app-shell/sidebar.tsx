"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  KanbanSquare,
  NotebookText,
  Receipt,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/", label: "Today", icon: Sparkles, exact: true },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/notes", label: "Notes", icon: NotebookText },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/digest", label: "Weekly digest", icon: CalendarDays },
];

const STORAGE_KEY = "better:sidebar-collapsed";
let collapsedListeners: Array<() => void> = [];

function subscribeCollapsed(callback: () => void) {
  collapsedListeners.push(callback);
  return () => {
    collapsedListeners = collapsedListeners.filter((l) => l !== callback);
  };
}
function getCollapsedSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}
function getCollapsedServerSnapshot() {
  return false;
}
function setStoredCollapsed(value: boolean) {
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  collapsedListeners.forEach((l) => l());
}

export function AppSidebar({ badgeCount = 0 }: { badgeCount?: number }) {
  const pathname = usePathname();
  const collapsed = React.useSyncExternalStore(
    subscribeCollapsed,
    getCollapsedSnapshot,
    getCollapsedServerSnapshot
  );

  const toggle = () => {
    setStoredCollapsed(!collapsed);
  };

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center gap-2 px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          B
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-sidebar-foreground">
            Better
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent text-sidebar-accent-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.href === "/" && badgeCount > 0 && (
                <span
                  className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white",
                    collapsed && "absolute right-1.5 top-1.5"
                  )}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Button
          variant="ghost"
          size="icon"
          className="w-full justify-center rounded-xl text-sidebar-foreground/60"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
