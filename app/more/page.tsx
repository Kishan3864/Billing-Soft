"use client";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, PageHead } from "@/components/ui";
import { IBox, IChart, IDownload, ILayers, ILogout, ISettings, ITag, IWallet } from "@/components/icons";
import { useInstall } from "@/components/Shell";

const ITEMS = [
  { href: "/products", label: "Products", sub: "Items, rates & GST", icon: IBox },
  { href: "/categories", label: "Categories", sub: "Add & manage categories", icon: ITag },
  { href: "/payments", label: "Payments", sub: "Receive & pending", icon: IWallet },
  { href: "/stock", label: "Stock", sub: "Add stock, low stock alerts", icon: ILayers },
  { href: "/reports", label: "Reports", sub: "Sales, GST, CSV export", icon: IChart },
  { href: "/settings", label: "Settings", sub: "Business & invoice details", icon: ISettings },
];

export default function More() {
  const { show, install } = useInstall();
  return (
    <div>
      <PageHead title="More" />
      <Card className="divide-y divide-slate-100">
        {ITEMS.map((i) => {
          const I = i.icon;
          return (
            <Link key={i.href} href={i.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent/10 text-accent"><I width={18} height={18} /></span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-900">{i.label}</div>
                <div className="truncate text-xs text-slate-400">{i.sub}</div>
              </div>
            </Link>
          );
        })}
        {show && (
          <button onClick={install} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-accent text-white"><IDownload width={18} height={18} /></span>
            <div>
              <div className="text-sm font-medium text-slate-900">Install App</div>
              <div className="text-xs text-slate-400">Add to home screen, works offline</div>
            </div>
          </button>
        )}
        <button onClick={() => signOut(auth)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-rose-50 text-rose-500"><ILogout width={18} height={18} /></span>
          <div className="text-sm font-medium text-rose-600">Logout</div>
        </button>
      </Card>
      <p className="mt-6 text-center text-[11px] text-slate-300">Brighton Solution • DEMO</p>
    </div>
  );
}
