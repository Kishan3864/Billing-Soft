"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Customer, useBills, useDocData, usePayments, useSettings } from "@/lib/data";
import { dmy, inr, inr0, waLink } from "@/lib/format";
import { Btn, Card, Empty, Loading, PageHead } from "@/components/ui";
import { IEdit, IPlus, IWhatsApp } from "@/components/icons";
import { CustomerForm } from "@/components/CustomerForm";
import { PaymentForm } from "@/components/PaymentForm";

type Row = { date: string; ts: number; label: string; sub?: string; href?: string; debit: number; credit: number };

function View() {
  const id = useSearchParams().get("id");
  const { data: c, loading } = useDocData<Customer>("customers", id);
  const { rows: bills } = useBills();
  const { rows: payments } = usePayments();
  const settings = useSettings();
  const [edit, setEdit] = useState(false);
  const [pay, setPay] = useState(false);

  if (loading) return <Loading />;
  if (!c) return <Empty text="Customer not found" />;

  const rows: Row[] = [];
  bills.filter((b) => b.customerId === c.id).forEach((b) => {
    rows.push({ date: b.date, ts: b.createdAt || 0, label: `Bill ${b.billNo}`, sub: `${b.items.length} item(s)`, href: `/bill?id=${b.id}`, debit: b.total, credit: 0 });
    if (b.paid > 0) rows.push({ date: b.date, ts: (b.createdAt || 0) + 1, label: "Paid at billing", sub: b.mode, debit: 0, credit: b.paid });
  });
  payments.filter((p) => p.customerId === c.id).forEach((p) => {
    rows.push({ date: p.date, ts: p.createdAt || 0, label: "Payment received", sub: [p.mode, p.note].filter(Boolean).join(" · "), debit: 0, credit: p.amount });
  });
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
  let bal = c.opening || 0;
  const withBal = rows.map((r) => ({ ...r, bal: (bal += r.debit - r.credit) }));
  const sales = rows.reduce((s, r) => s + r.debit, 0);
  const recd = rows.reduce((s, r) => s + r.credit, 0);

  const msg = `Dear ${c.name},\nYour pending balance with ${settings.name} is ${inr(c.balance)}.\nKindly arrange the payment at the earliest.${settings.upi ? `\nUPI: ${settings.upi}` : ""}\nThank you.`;

  return (
    <div>
      <PageHead title={c.name} sub={`${c.mobile} · ${c.state}`} back="/customers" actions={<Btn variant="outline" size="sm" onClick={() => setEdit(true)}><IEdit width={15} height={15} /> Edit</Btn>} />

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4 md:col-span-1">
          <div className="text-xs text-slate-500">Balance</div>
          <div className={`mt-1 text-2xl font-semibold ${c.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{inr0(Math.abs(c.balance))}</div>
          <div className="text-xs text-slate-400">{c.balance > 0 ? "to receive" : c.balance < 0 ? "advance" : "settled"}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Btn size="sm" onClick={() => setPay(true)}>Receive</Btn>
            <a href={waLink(c.mobile, msg)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center justify-center gap-1 rounded bg-emerald-50 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
              <IWhatsApp width={14} height={14} /> Remind
            </a>
            <Link href={`/new-bill?c=${c.id}`} className="col-span-2 inline-flex h-8 items-center justify-center gap-1 rounded border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <IPlus width={14} height={14} /> New bill
            </Link>
          </div>
        </Card>
        <Card className="p-4 text-sm md:col-span-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div><div className="text-xs text-slate-400">Address</div><div className="text-slate-700">{c.address || "—"}</div></div>
            <div><div className="text-xs text-slate-400">GSTIN</div><div className="text-slate-700">{c.gstin || "Unregistered"}</div></div>
            <div><div className="text-xs text-slate-400">Total billed</div><div className="font-medium text-slate-900">{inr0(sales)}</div></div>
            <div><div className="text-xs text-slate-400">Total received</div><div className="font-medium text-slate-900">{inr0(recd)}</div></div>
          </div>
        </Card>
      </div>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">Ledger</h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Particulars</th><th className="px-4 py-2.5 text-right">Debit</th><th className="px-4 py-2.5 text-right">Credit</th><th className="px-4 py-2.5 text-right">Balance</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(c.opening || 0) !== 0 && (
                <tr><td className="px-4 py-2.5 text-slate-500">—</td><td className="px-4 py-2.5">Opening balance</td><td /><td /><td className="px-4 py-2.5 text-right font-medium">{inr(c.opening || 0)}</td></tr>
              )}
              {withBal.map((r, i) => (
                <tr key={i}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{dmy(r.date)}</td>
                  <td className="px-4 py-2.5">
                    {r.href ? <Link href={r.href} className="font-medium text-accent">{r.label}</Link> : <span className="text-slate-800">{r.label}</span>}
                    {r.sub && <div className="text-xs text-slate-400">{r.sub}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{r.debit ? inr(r.debit) : ""}</td>
                  <td className="px-4 py-2.5 text-right text-emerald-600">{r.credit ? inr(r.credit) : ""}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{inr(r.bal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {withBal.length === 0 && <Empty text="No transactions yet" />}
        </div>
      </Card>

      {edit && <CustomerForm initial={c} onClose={() => setEdit(false)} />}
      {pay && <PaymentForm customerId={c.id} onClose={() => setPay(false)} />}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><View /></Suspense>;
}
