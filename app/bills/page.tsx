"use client";
import Link from "next/link";
import { useState } from "react";
import { useBills } from "@/lib/data";
import { dmy, inr0 } from "@/lib/format";
import { Badge, Card, Empty, Loading, PageHead, SearchBox } from "@/components/ui";
import { IPlus } from "@/components/icons";

export default function Bills() {
  const { rows, loading } = useBills();
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "due" | "paid">("all");
  const list = rows.filter(
    (b) =>
      (f === "all" || (f === "due" ? b.due > 0 : b.due <= 0)) &&
      (b.billNo + b.customer.name + (b.vehicleNo || "")).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <PageHead
        title="Bills"
        sub={`${rows.length} invoices`}
        actions={<Link href="/new-bill" className="inline-flex h-10 items-center gap-1.5 rounded bg-accent px-4 text-sm font-medium text-white shadow-sm"><IPlus width={18} height={18} /> New</Link>}
      />
      <div className="mb-4 flex flex-col gap-2 md:flex-row">
        <div className="flex-1"><SearchBox value={q} onChange={setQ} placeholder="Search bill no, customer, vehicle" /></div>
        <div className="flex gap-1.5">
          {(["all", "due", "paid"] as const).map((x) => (
            <button key={x} onClick={() => setF(x)} className={`h-10 rounded px-4 text-sm font-medium capitalize ${f === x ? "bg-accent text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{x}</button>
          ))}
        </div>
      </div>
      {loading ? <Loading /> : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {list.length === 0 && <Empty text="No bills found" />}
          {list.map((b) => (
            <Link key={b.id} href={`/bill?id=${b.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{b.customer.name}</div>
                <div className="text-xs text-slate-400">{b.billNo} · {dmy(b.date)} · {b.items.reduce((s, i) => s + i.qty, 0)} pcs</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">{inr0(b.total)}</div>
                {b.due > 0 ? <Badge tone="rose">Due {inr0(b.due)}</Badge> : <Badge tone="green">Paid</Badge>}
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
