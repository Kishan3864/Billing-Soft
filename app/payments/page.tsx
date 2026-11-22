"use client";
import Link from "next/link";
import { useState } from "react";
import { useCustomers, usePayments, useSettings } from "@/lib/data";
import { dmy, inr, inr0, waLink } from "@/lib/format";
import { Btn, Card, Empty, Loading, PageHead } from "@/components/ui";
import { IPlus, IWhatsApp } from "@/components/icons";
import { PaymentForm } from "@/components/PaymentForm";

export default function Payments() {
  const { rows: payments, loading } = usePayments();
  const { rows: customers } = useCustomers();
  const s = useSettings();
  const [tab, setTab] = useState<"pending" | "received">("pending");
  const [pay, setPay] = useState<string | null>(null);
  const pending = customers.filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance);
  const totalPending = pending.reduce((x, c) => x + c.balance, 0);

  const msg = (name: string, bal: number) =>
    `Dear ${name},\nThis is a gentle reminder that ${inr(bal)} is pending with ${s.name}.\nKindly clear the dues at the earliest.${s.upi ? `\nUPI: ${s.upi}` : ""}${s.accountNo ? `\nA/c ${s.accountNo} · IFSC ${s.ifsc}` : ""}\nThank you 🙏`;

  return (
    <div>
      <PageHead title="Payments" sub={`${inr0(totalPending)} pending`} actions={<Btn onClick={() => setPay("")}><IPlus width={18} height={18} /> Receive</Btn>} />
      <div className="mb-4 inline-flex rounded bg-slate-100 p-1">
        {(["pending", "received"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded px-4 py-1.5 text-sm font-medium capitalize ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{t}</button>
        ))}
      </div>
      {loading ? <Loading /> : tab === "pending" ? (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {pending.length === 0 && <Empty text="No pending payments 🎉" />}
          {pending.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <Link href={`/customer?id=${c.id}`} className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                <div className="text-xs text-slate-400">{c.mobile}</div>
              </Link>
              <div className="flex items-center gap-2">
                <div className="mr-1 text-right text-sm font-semibold text-rose-600">{inr0(c.balance)}</div>
                <a href={waLink(c.mobile, msg(c.name, c.balance))} target="_blank" rel="noreferrer" title="WhatsApp reminder" className="flex h-9 w-9 items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                  <IWhatsApp />
                </a>
                <Btn size="sm" variant="outline" onClick={() => setPay(c.id)}>Receive</Btn>
              </div>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {payments.length === 0 && <Empty text="No payments yet" />}
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{p.customerName}</div>
                <div className="text-xs text-slate-400">{dmy(p.date)} · {p.mode}{p.note ? " · " + p.note : ""}</div>
              </div>
              <div className="text-sm font-semibold text-emerald-600">+{inr0(p.amount)}</div>
            </div>
          ))}
        </Card>
      )}
      {pay !== null && <PaymentForm customerId={pay || undefined} onClose={() => setPay(null)} />}
    </div>
  );
}
