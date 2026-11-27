import { Suspense } from "react";
import DemoStrip from "@/components/demo-strip";

// Wraps every /admin page, including the login page. Only the demo strip lives here;
// each page still checks its own login with requireAdmin.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <DemoStrip />
      </Suspense>
      {children}
    </>
  );
}
