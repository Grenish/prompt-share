import Navbar from "@/components/navbar";
import { ToastHandler } from "@/components/toast-handler";
import { Suspense } from "react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
      <Navbar />
      <Suspense>
        <ToastHandler />
      </Suspense>
      {children}
    </main>
  );
}
