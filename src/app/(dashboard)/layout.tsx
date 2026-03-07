import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/30">
      <Header />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
