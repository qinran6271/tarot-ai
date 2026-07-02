import Sidebar from "@/components/Sidebar";
import type { ReactNode } from "react";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}