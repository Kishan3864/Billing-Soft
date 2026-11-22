"use client";
import { useState } from "react";
import { useBills, useCustomers, useProducts } from "@/lib/data";
import { dmy, downloadCSV, inr, inr0, todayISO } from "@/lib/format";
import { Btn, Card, Empty, Field, Input, Loading, PageHead, Stat } from "@/components/ui";
import { IDownload } from "@/components/icons";

export default function Reports() {
  const { rows: bills, loading } = useBills();
  const { rows: customers } = useCustomers();
  const { rows: products } = useProducts();
  const t = todayISO();
  const [from, setFrom] = useState(t.slice(0, 8) + "01");
  const [to, setTo] = useState(t);
  const [tab, setTab] = useState<"sales" | "pending" | "stock">("sales");

  const sales = bills.filter((b) => b.date >= from && b.date <= to).sort((a, b) => a.date.localeCompare(b.date) || a.no - b.no);
  const sum = (k: "taxable" | "cgst" | "sgst" | "igst" | "total" | "paid" | "due") => sales.reduce((s, b) => s + (b[k] || 0), 0);
  const pending = customers.filter((c) => c.balance > 0).sort((a, b) => b.balance - a.balance);

  const exportSales = () =>
    downloadCSV(`sales_${from}_to_${to}.csv`, [
      ["Date", "Bill No", "Customer", "GSTIN", "State", "Taxable", "CGST", "SGST", "IGST", "Total", "Paid", "Due"],
      ...sales.map((b) => [dmy(b.date), b.billNo, b.customer.name, b.customer.gstin || "", b.customer.state, b.taxable, b.cgst, b.sgst, b.igst, b.total, b.paid, b.due]),
      ["", "", "TOTAL", "", "", sum("taxable"), sum("cgst"), sum("sgst"), sum("igst"), sum("total"), sum("paid"), sum("due")],
    ]);
  const exportPending = () =>
    downloadCSV(`pending_${t}.csv`, [["Customer", "Mobile", "State", "Pending"], ...pending.map((c) => [c.name, c.mobile, c.state, c.balance])]);
  const exportStock = () =>
    downloadCSV(`stock_${t}.csv`, [["Product", "Model", "Category", "HSN", "GST %", "Rate", "Stock", "Value"], ...products.map((p) => [p.name, p.model, p.category, p.hsn, p.gst, p.rate, p.stock, p.rate * p.stock])]);

  return (
    <div>
      <PageHead title="Reports" />
      <div className="mb-4 inline-flex rounded bg-slate-100 p-1">
        {(["sales", "pending", "stock"] as const).map((x) => (
          <button key={x} onClick={() => setTab(x)} className={`rounded px-4 py-1.5 text-sm font-medium capitalize ${tab === x ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>{x}</button>
        ))}
      </div>
      {loading ? <Loading /> : tab === "sales" ? (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            <Btn variant="outline" onClick={exportSales}><IDownload width={16} height={16} /> CSV</Btn>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total Sales" value={inr0(sum("total"))} hint={`${sales.length} bills`} tone="accent" />
            <Stat label="Taxable Value" value={inr0(sum("taxable"))} />
            <Stat label="CGST + SGST" value={inr0(sum("cgst") + sum("sgst"))} />
            <Stat label="IGST" value={inr0(sum("igst"))} />
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Bill</th><th className="px-4 py-2.5">Customer</th><th className="px-4 py-2.5 text-right">Taxable</th><th className="px-4 py-2.5 text-right">CGST</th><th className="px-4 py-2.5 text-right">SGST</th><th className="px-4 py-2.5 text-right">IGST</th><th className="px-4 py-2.5 text-right">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map((b) => (
                    <tr key={b.id}>
                      <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{dmy(b.date)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">{b.billNo}</td>
                      <td className="px-4 py-2.5">{b.customer.name}</td>
                      <td className="px-4 py-2.5 text-right">{inr(b.taxable)}</td>
                      <td className="px-4 py-2.5 text-right">{inr(b.cgst)}</td>
                      <td className="px-4 py-2.5 text-right">{inr(b.sgst)}</td>
                      <td className="px-4 py-2.5 text-right">{inr(b.igst)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{inr(b.total)}</td>
                    </tr>
                  ))}
                </tbody>
                {sales.length > 0 && (
                  <tfoot className="bg-slate-50 font-semibold">
                    <tr><td className="px-4 py-2.5" colSpan={3}>Total</td><td className="px-4 py-2.5 text-right">{inr(sum("taxable"))}</td><td className="px-4 py-2.5 text-right">{inr(sum("cgst"))}</td><td className="px-4 py-2.5 text-right">{inr(sum("sgst"))}</td><td className="px-4 py-2.5 text-right">{inr(sum("igst"))}</td><td className="px-4 py-2.5 text-right">{inr(sum("total"))}</td></tr>
                  </tfoot>
                )}
              </table>
              {sales.length === 0 && <Empty text="No bills in this period" />}
            </div>
          </Card>
        </>
      ) : tab === "pending" ? (
        <>
          <div className="mb-4 flex justify-end"><Btn variant="outline" onClick={exportPending}><IDownload width={16} height={16} /> CSV</Btn></div>
          <Card className="divide-y divide-slate-100 overflow-hidden">
            {pending.length === 0 && <Empty text="Nothing pending" />}
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-4 py-3">
                <div><div className="text-sm font-medium text-slate-900">{c.name}</div><div className="text-xs text-slate-400">{c.mobile} · {c.state}</div></div>
                <div className="text-sm font-semibold text-rose-600">{inr(c.balance)}</div>
              </div>
            ))}
            {pending.length > 0 && (
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 font-semibold"><span>Total</span><span className="text-rose-600">{inr(pending.reduce((s, c) => s + c.balance, 0))}</span></div>
            )}
          </Card>
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-end"><Btn variant="outline" onClick={exportStock}><IDownload width={16} height={16} /> CSV</Btn></div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr><th className="px-4 py-2.5">Product</th><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5 text-right">Rate</th><th className="px-4 py-2.5 text-right">Stock</th><th className="px-4 py-2.5 text-right">Value</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5"><div className="font-medium">{p.name}</div><div className="text-xs text-slate-400">{p.model}</div></td>
                      <td className="px-4 py-2.5 text-slate-600">{p.category}</td>
                      <td className="px-4 py-2.5 text-right">{inr0(p.rate)}</td>
                      <td className={`px-4 py-2.5 text-right ${p.stock <= p.minStock ? "font-semibold text-amber-600" : ""}`}>{p.stock}</td>
                      <td className="px-4 py-2.5 text-right">{inr0(p.rate * p.stock)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 font-semibold">
                  <tr><td className="px-4 py-2.5" colSpan={3}>Total</td><td className="px-4 py-2.5 text-right">{products.reduce((s, p) => s + p.stock, 0)}</td><td className="px-4 py-2.5 text-right">{inr0(products.reduce((s, p) => s + p.rate * p.stock, 0))}</td></tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
