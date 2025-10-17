import Navbar from "@/components/navbar";
import type { ReactNode } from "react";

export default function HomeLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main>
      <Navbar />
      {children}
    </main>
  );
}
