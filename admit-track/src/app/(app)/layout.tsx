import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { MainContent } from "@/components/main-content";
import { CommandPalette } from "@/components/command-palette";
import { QuickAddModal } from "@/components/quick-add-modal";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <TopBar />
      <MainContent>{children}</MainContent>
      <CommandPalette />
      <QuickAddModal />
    </>
  );
}
