// Layout page

import { MainLayout } from "@rever/common";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
