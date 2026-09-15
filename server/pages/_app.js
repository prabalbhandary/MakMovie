import Aside from "@/components/Aside";
import Header from "@/components/Header";
import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import { useState, useCallback, useLayoutEffect } from "react";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useLayoutEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(true);
    }
  }, []);
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((v) => !v);
  }, []);
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <SessionProvider session={session}>
      <div className={`app ${sidebarOpen ? "app--sidebar-open" : ""}`}>
        <Aside open={sidebarOpen} onClose={closeSidebar} />
        {sidebarOpen ? (
          <div className="sidebarbackdrop" onClick={closeSidebar} />
        ) : null}
        <div className="container">
          <Header onSidebarToggle={toggleSidebar} />
        </div>
        <main>
          <Component {...pageProps} />
        </main>
      </div>
    </SessionProvider>
  );
}