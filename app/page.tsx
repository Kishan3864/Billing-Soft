"use client";
import Link from "next/link";
import { useBills, useCustomers, useProducts } from "@/lib/data";
import { dmy, inr0, todayISO } from "@/lib/format";
import { Badge, Card, Loading, PageHead, Stat } from "@/components/ui";
import { IAlert, IPlus } from "@/components/icons";

export default function Dashboard() {
  const { rows: bills, loading } = useBills();
  const { rows: customers } = useCustomers();
  const { rows: products } = useProducts();
  const today = todayISO();
  const month = today.slice(0, 7);

  const todays = bills.filter((b) => b.date === today);
  const monthly = bills.filter((b) => b.date.startsWith(month));
  const pending = customers.reduce((s, c) => s + Math.max(c.balance || 0, 0), 0);
  const low = products.filter((p) => p.stock <= (p.minStock ?? 5));

  return (
    <div>
      <PageHead
        title="Dashboard"
        sub={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        actions={
          <Link href="/new-bill" className="hidden h-10 items-center gap-1.5 rounded bg-accent px-4 text-sm font-medium text-white shadow-sm hover:bg-accent-dark md:inline-flex">
            <IPlus width={18} height={18} /> New Bill
          </Link>
        }
      />
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            <Stat label="Today's Sales" value={inr0(todays.reduce((s, b) => s + b.total, 0))} hint={`${todays.length} bill${todays.length === 1 ? "" : "s"}`} tone="accent" />
            <Stat label="This Month" value={inr0(monthly.reduce((s, b) => s + b.total, 0))} hint={`${monthly.length} bills`} />
            <Stat label="Total Pending" value={inr0(pending)} hint={`${customers.filter((c) => c.balance > 0).length} customers`} tone="danger" />
            <Stat label="Low Stock" value={String(low.length)} hint="items running low" tone={low.length ? "warn" : "default"} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2">
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <h2 className="font-semibold text-slate-900">Recent Bills</h2>
                <Link href="/bills" className="text-xs font-medium text-accent">View all</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {bills.slice(0, 6).map((b) => (
                  <Link key={b.id} href={`/bill?id=${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900">{b.customer.name}</div>
                      <div className="text-xs text-slate-400">{b.billNo} · {dmy(b.date)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">{inr0(b.total)}</div>
                      {b.due > 0 ? <Badge tone="rose">Due {inr0(b.due)}</Badge> : <Badge tone="green">Paid</Badge>}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between px-4 pb-2 pt-4">
                <h2 className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <IAlert width={16} height={16} className="text-amber-500" /> Low Stock
                </h2>
                <Link href="/stock" className="text-xs font-medium text-accent">Add stock</Link>
              </div>
              {low.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-slate-400">All items are well stocked.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {low.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.model}</div>
                      </div>
                      <Badge tone={p.stock <= 0 ? "rose" : "amber"}>{p.stock} left</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
