"use client";

import { LogOut, Plus, Search } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ExportMenu } from "@/components/app-shell/export-menu";
import { ChangePasscodeDialog } from "@/components/app-shell/change-passcode-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Topbar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border px-6">
      <div className="text-sm text-muted-foreground">
        {new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      </div>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
        className="flex h-9 w-full max-w-sm items-center gap-2 rounded-full border border-border bg-muted/60 px-3.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search tasks &amp; notes…</span>
        <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Quick add"
              onClick={() => window.dispatchEvent(new CustomEvent("open-quick-add"))}
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Quick add (⌘N)</TooltipContent>
        </Tooltip>
        <ExportMenu />
        <ChangePasscodeDialog />
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label="Log out"
              >
                <LogOut className="size-4" />
              </Button>
            </form>
          </TooltipTrigger>
          <TooltipContent>Log out</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
