"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { APP_NAME, useSettings } from "@/lib/data";
import { IBill, IBox, IChart, IDownload, IHome, ILayers, ILogout, IMenu, IPlus, ISettings, ITag, IUsers, IWallet } from "./icons";

const AuthCtx = createContext<User | null>(null);
export const useUser = () => useContext(AuthCtx);

const NAV = [
  { href: "/", label: "Dashboard", icon: IHome },
  { href: "/new-bill", label: "New Bill", icon: IPlus },
  { href: "/bills", label: "Bills", icon: IBill },
  { href: "/customers", label: "Customers", icon: IUsers },
  { href: "/products", label: "Products", icon: IBox },
  { href: "/categories", label: "Categories", icon: ITag },
  { href: "/payments", label: "Payments", icon: IWallet },
  { href: "/stock", label: "Stock", icon: ILayers },
  { href: "/reports", label: "Reports", icon: IChart },
  { href: "/settings", label: "Settings", icon: ISettings },
];
const MOBILE = [
  { href: "/", label: "Home", icon: IHome },
  { href: "/bills", label: "Bills", icon: IBill },
  { href: "/new-bill", label: "New", icon: IPlus, main: true },
  { href: "/customers", label: "Parties", icon: IUsers },
  { href: "/more", label: "More", icon: IMenu },
];

function isActive(path: string, href: string) {
  const p = path.replace(/\/$/, "") || "/";
  if (href === "/") return p === "/";
  if (href === "/bills") return p === "/bills" || p === "/bill";
  if (href === "/customers") return p === "/customers" || p === "/customer";
  if (href === "/more") return ["/more", "/products", "/categories", "/payments", "/stock", "/reports", "/settings"].includes(p);
  return p === href;
}

/* ---------- PWA install ---------- */
type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((f) => f());
  });
}
export function useInstall() {
  const [, force] = useState(0);
  const [standalone, setStandalone] = useState(true);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    listeners.add(f);
    setStandalone(window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    return () => { listeners.delete(f); };
  }, []);
  const canPrompt = !!deferred;
  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      deferred = null;
      force((x) => x + 1);
    } else if (ios) {
      alert("To install: tap the Share button in Safari, then 'Add to Home Screen'.");
    } else {
      alert("To install: open the browser menu (⋮) and choose 'Install app' or 'Add to Home screen'.");
    }
  };
  return { show: !standalone, canPrompt, install };
}

export function InstallButton({ className = "" }: { className?: string }) {
  const { show, install } = useInstall();
  if (!show) return null;
  return (
    <button onClick={install} className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/5 ${className}`}>
      <IDownload width={18} height={18} /> Install App
    </button>
  );
}

function Watermark() {
  return (
    <div className="watermark" aria-hidden>
      <span>Brighton Solution • DEMO</span>
    </div>
  );
}

function Protect() {
  useEffect(() => {
    const ctx = (e: MouseEvent) => e.preventDefault();
    const key = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "K"].includes(k)) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(k)) ||
        (e.ctrlKey && k === "U")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("contextmenu", ctx);
    document.addEventListener("keydown", key, true);
    if ("serviceWorker" in navigator && location.hostname !== "localhost") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      document.removeEventListener("contextmenu", ctx);
      document.removeEventListener("keydown", key, true);
    };
  }, []);
  return null;
}

export function AppMark({ size = 36 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded bg-accent font-display font-bold text-white">
      <span style={{ fontSize: size * 0.5 }}>₹</span>
    </div>
  );
}

function Brand() {
  const s = useSettings();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <AppMark />
      <div className="min-w-0">
        <div className="font-display text-base font-bold leading-tight text-slate-900">{APP_NAME}</div>
        <div className="truncate text-[11px] text-slate-400">{s.name}</div>
      </div>
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const path = usePathname() || "/";
  const router = useRouter();
  const isLogin = path.startsWith("/login");

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setReady(true); }), []);
  useEffect(() => {
    if (!ready) return;
    if (!user && !isLogin) router.replace("/login");
    if (user && isLogin) router.replace("/");
  }, [ready, user, isLogin, router]);

  if (isLogin) {
    return (
      <>
        <Protect />
        <Watermark />
        {children}
      </>
    );
  }

  if (!ready || !user) {
    return (
      <>
        <Protect />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
        </div>
      </>
    );
  }

  return (
    <AuthCtx.Provider value={user}>
      <Protect />
      <Watermark />
      <div className="md:flex">
        {/* Desktop sidebar */}
        <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-slate-200/80 bg-white px-3 py-5 md:flex">
          <div className="px-2 pb-6"><Brand /></div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {NAV.map((n) => {
              const a = isActive(path, n.href);
              const I = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition ${
                    a ? "bg-accent/10 text-accent" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <I width={18} height={18} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <InstallButton className="mt-2 w-full" />
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            <ILogout width={18} height={18} /> Logout
          </button>
          <div className="px-3 pt-3 text-[10px] text-slate-300">Brighton Solution • DEMO</div>
        </aside>

        {/* Mobile top bar */}
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden" style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
          <Brand />
          <MobileInstall />
        </header>

        <main className="print-main mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="no-print safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-5">
            {MOBILE.map((n) => {
              const a = isActive(path, n.href);
              const I = n.icon;
              if (n.main)
                return (
                  <Link key={n.href} href={n.href} className="flex flex-col items-center justify-center py-1.5" aria-label="New bill">
                    <span className="flex h-11 w-11 items-center justify-center rounded bg-accent text-white shadow-md shadow-accent/30">
                      <I width={22} height={22} />
                    </span>
                  </Link>
                );
              return (
                <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${a ? "text-accent" : "text-slate-400"}`}>
                  <I width={21} height={21} />
                  {n.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </AuthCtx.Provider>
  );
}

function MobileInstall() {
  const { show, install } = useInstall();
  if (!show) return null;
  return (
    <button onClick={install} className="flex h-8 shrink-0 items-center gap-1 rounded bg-accent/10 px-2.5 text-xs font-semibold text-accent">
      <IDownload width={14} height={14} /> Install
    </button>
  );
}
