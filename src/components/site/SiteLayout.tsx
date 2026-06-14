import { Outlet } from "react-router-dom";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

/** Marketing/legal shell: nav + page + footer. */
export function SiteLayout() {
  return (
    <div className="grain min-h-[100dvh] bg-background">
      <SiteNav />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
