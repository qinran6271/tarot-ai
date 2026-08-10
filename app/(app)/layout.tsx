import Sidebar from "@/components/Sidebar";
import ReadingStorageProvider from "@/components/reading/ReadingStorageProvider";
import type { ReactNode } from "react";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ReadingStorageProvider>
      <Sidebar />
      {children}
    </ReadingStorageProvider>
  );
}
