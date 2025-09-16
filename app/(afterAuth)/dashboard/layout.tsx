import { cookies } from "next/headers";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarCookie ? sidebarCookie === "true" : true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main>{children}</main>
      <Toaster position="top-right" richColors closeButton/>
    </SidebarProvider>
  );
}
