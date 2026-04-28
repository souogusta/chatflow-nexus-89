import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} subtitle={subtitle} />
        <main className="flex-1 px-6 lg:px-8 py-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
