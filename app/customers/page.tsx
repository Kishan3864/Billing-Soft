"use client";
import Link from "next/link";
import { useState } from "react";
import { useCustomers } from "@/lib/data";
import { inr0 } from "@/lib/format";
import { Btn, Card, Empty, Loading, PageHead, SearchBox } from "@/components/ui";
import { IPlus } from "@/components/icons";
import { CustomerForm } from "@/components/CustomerForm";

export default function Customers() {
  const { rows, loading } = useCustomers();
  const [q, setQ] = useState("");
  const [add, setAdd] = useState(false);
  const list = rows.filter((c) => (c.name + c.mobile + (c.gstin || "")).toLowerCase().includes(q.toLowerCase()));
  const total = rows.reduce((s, c) => s + Math.max(c.balance || 0, 0), 0);

  return (
    <div>
      <PageHead title="Customers" sub={`${rows.length} customers · ${inr0(total)} pending`} actions={<Btn onClick={() => setAdd(true)}><IPlus width={18} height={18} /> Add</Btn>} />
      <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search name, mobile, GSTIN" /></div>
      {loading ? <Loading /> : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {list.length === 0 && <Empty text="No customers found" />}
          {list.map((c) => (
            <Link key={c.id} href={`/customer?id=${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-sm font-semibold text-slate-600">{c.name.slice(0, 1)}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                  <div className="truncate text-xs text-slate-400">{c.mobile} · {c.state}{c.gstin ? " · " + c.gstin : ""}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${c.balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>{inr0(Math.abs(c.balance || 0))}</div>
                <div className="text-[11px] text-slate-400">{c.balance > 0 ? "to receive" : c.balance < 0 ? "advance" : "settled"}</div>
              </div>
            </Link>
          ))}
        </Card>
      )}
      {add && <CustomerForm initial={null} onClose={() => setAdd(false)} />}
    </div>
  );
}
