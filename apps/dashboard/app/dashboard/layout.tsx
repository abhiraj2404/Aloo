import { Sidebar, Header } from "@/components/layout";
import { TooltipProvider } from "@repo/ui/components/tooltip";
import { DashboardProvider } from "@/lib/dashboard-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-gray-50">
          <Sidebar />
          <div className="ml-16 flex flex-col h-screen">
            <Header />
            <main className="flex-1 p-4 overflow-hidden">{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </DashboardProvider>
  );
}
