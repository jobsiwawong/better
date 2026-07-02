import { AppSidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { CommandPalette } from "@/components/app-shell/command-palette";
import { QuickAdd } from "@/components/app-shell/quick-add";
import { UndoManager } from "@/components/app-shell/undo-manager";
import { ManageLabelsDialog } from "@/components/app-shell/manage-labels-dialog";
import { getTodayBadgeCount } from "@/lib/queries/digest";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const badgeCount = await getTodayBadgeCount();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar badgeCount={badgeCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette />
      <QuickAdd />
      <UndoManager />
      <ManageLabelsDialog />
    </div>
  );
}
