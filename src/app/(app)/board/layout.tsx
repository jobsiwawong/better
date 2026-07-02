"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/board", label: "Kanban", exact: true },
  { href: "/board/list", label: "List" },
  { href: "/board/calendar", label: "Calendar" },
  { href: "/board/records", label: "Records" },
];

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-6 pt-4">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-t-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                active && "border-b-2 border-primary text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
