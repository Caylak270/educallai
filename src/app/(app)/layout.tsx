import { MobileTabbar } from "@/components/shell/mobile-tabbar";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileHeader, WebTopbar } from "@/components/shell/topbars";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <MobileHeader />
        <WebTopbar />
        <main className="w-full flex-1 pb-24 pt-16 lg:pb-10">{children}</main>
      </div>
      <MobileTabbar />
    </div>
  );
}
