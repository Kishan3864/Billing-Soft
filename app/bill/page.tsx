"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, increment, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bill, useDocData, useSettings } from "@/lib/data";
import { STATE_CODES } from "@/lib/states";
import { dmy, inr, inWords, waLink } from "@/lib/format";
import { Btn, Empty, Loading, PageHead } from "@/components/ui";
import { IDownload, IPrint, ITrash, IWhatsApp } from "@/components/icons";

const n2 = (n: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

function View() {
  const id = useSearchParams().get("id");
  const { data: b, loading } = useDocData<Bill>("bills", id);
  const s = useSettings();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const f = () => {
      const m = document.querySelector("main");
      const w = m ? m.clientWidth - parseFloat(getComputedStyle(m).paddingLeft) - parseFloat(getComputedStyle(m).paddingRight) : window.innerWidth - 32;
      setZoom(Math.min(1, (w - 2) / 796));
    };
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  if (loading) return <Loading />;
  if (!b) return <Empty text="Bill not found" />;

  const print = () => {
    const t = document.title;
    document.title = b.billNo.replace(/\//g, "-") + " " + b.customer.name;
    window.print();
    setTimeout(() => (document.title = t), 500);
  };
  const share = () => {
    const lines = [
      `*${s.name}*`,
      `Tax Invoice: ${b.billNo}`,
      `Date: ${dmy(b.date)}`,
      ``,
      `Dear ${b.customer.name},`,
      ...b.items.map((i) => `• ${i.name} × ${i.qty} = ${inr(i.amount)}`),
      ``,
      `Total: *${inr(b.total)}*`,
      `Paid: ${inr(b.paid)}`,
      b.due > 0 ? `Balance due: *${inr(b.due)}*` : `Fully paid ✅`,
      s.upi ? `\nPay via UPI: ${s.upi}` : "",
      `\nThank you for your business!`,
    ];
    window.open(waLink(b.customer.mobile, lines.filter((x) => x !== undefined).join("\n")), "_blank");
  };

  const remove = async () => {
    if (!confirm(`Delete bill ${b.billNo}? Stock and customer balance will be restored.`)) return;
    setDeleting(true);
    try {
      await runTransaction(db, async (tx) => {
        const refs = b.items.map((i) => doc(db, "products", i.productId));
        const snaps = await Promise.all(refs.map((r) => tx.get(r)));
        const cRef = doc(db, "customers", b.customerId);
        const cSnap = await tx.get(cRef);
        snaps.forEach((sn, k) => sn.exists() && tx.update(refs[k], { stock: increment(b.items[k].qty) }));
        if (cSnap.exists()) tx.update(cRef, { balance: increment(-b.due) });
        tx.delete(doc(db, "bills", b.id));
      });
      router.replace("/bills");
    } catch (e) {
      alert("Could not delete: " + (e as Error).message);
      setDeleting(false);
    }
  };

  const tax = b.gstOn;
  return (
    <div>
      <div className="no-print">
        <PageHead
          title={b.billNo}
          sub={b.customer.name}
          back="/bills"
        />
        <div className="-mt-2 mb-4 flex flex-wrap gap-2">
          <Btn variant="outline" size="sm" onClick={print} className="hidden sm:inline-flex"><IPrint width={15} height={15} /> Print</Btn>
          <Btn variant="outline" size="sm" onClick={print}><IDownload width={15} height={15} /> <span className="hidden sm:inline">Save</span> PDF</Btn>
          <Btn size="sm" onClick={share} className="!bg-emerald-600 hover:!bg-emerald-700"><IWhatsApp width={15} height={15} /> WhatsApp</Btn>
          <Btn variant="danger" size="sm" onClick={remove} disabled={deleting} className="ml-auto"><ITrash width={15} height={15} /> <span className="hidden sm:inline">{deleting ? "Deleting…" : "Delete"}</span></Btn>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ zoom }} className="print-area mx-auto w-[794px] min-w-[794px] rounded border border-slate-200 bg-white p-8 text-[12px] leading-snug text-slate-800 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 border-b-2 border-accent pb-4">
            <div className="flex items-start gap-3">
              {s.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo} alt="" className="h-14 w-14 rounded object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-accent text-2xl font-bold text-white">{s.name.slice(0, 1)}</div>
              )}
              <div>
                <div className="text-xl font-bold text-slate-900">{s.name}</div>
                <div className="max-w-[340px] text-slate-600">{s.address}</div>
                <div className="text-slate-600">{[s.phone && "Ph: " + s.phone, s.email].filter(Boolean).join(" · ")}</div>
                {s.gstin && <div className="font-semibold text-slate-800">GSTIN: {s.gstin}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tracking-wide text-accent">{tax ? "TAX INVOICE" : "INVOICE"}</div>
              <div className="mt-1 text-[11px] text-slate-500">Original for Recipient</div>
              <table className="ml-auto mt-2 text-left">
                <tbody>
                  <tr><td className="pr-3 text-slate-500">Invoice No.</td><td className="font-semibold">{b.billNo}</td></tr>
                  <tr><td className="pr-3 text-slate-500">Date</td><td className="font-semibold">{dmy(b.date)}</td></tr>
                  {b.vehicleNo && <tr><td className="pr-3 text-slate-500">Vehicle No.</td><td>{b.vehicleNo}</td></tr>}
                  {b.ewayNo && <tr><td className="pr-3 text-slate-500">E-Way Bill</td><td>{b.ewayNo}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6 border-b border-slate-200 py-3">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bill To</div>
              <div className="text-[13px] font-semibold text-slate-900">{b.customer.name}</div>
              <div className="text-slate-600">{b.customer.address}</div>
              <div className="text-slate-600">{b.customer.mobile && "Mobile: " + b.customer.mobile}</div>
              <div className="font-medium">GSTIN: {b.customer.gstin || "Unregistered"}</div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Place of Supply</div>
              <div className="font-medium">{b.customer.state} ({STATE_CODES[b.customer.state] || "--"})</div>
              <div className="mt-1 text-slate-500">{tax ? (b.interState ? "Inter-state supply · IGST" : "Intra-state supply · CGST + SGST") : "GST not applied"}</div>
            </div>
          </div>

          {/* Items */}
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left text-[11px] font-semibold text-slate-600">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Description</th>
                <th className="px-2 py-2">HSN</th>
                <th className="px-2 py-2 text-right">Qty</th>
                <th className="px-2 py-2 text-right">Rate</th>
                {tax && <th className="px-2 py-2 text-right">GST</th>}
                <th className="px-2 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {b.items.map((i, k) => (
                <tr key={k} className="border-b border-slate-100">
                  <td className="px-2 py-2 text-slate-500">{k + 1}</td>
                  <td className="px-2 py-2"><div className="font-medium text-slate-900">{i.name}</div><div className="text-[11px] text-slate-500">{i.model}</div></td>
                  <td className="px-2 py-2">{i.hsn}</td>
                  <td className="px-2 py-2 text-right">{i.qty} {i.unit || "Pcs"}</td>
                  <td className="px-2 py-2 text-right">{n2(i.rate)}</td>
                  {tax && <td className="px-2 py-2 text-right">{i.gst}%</td>}
                  <td className="px-2 py-2 text-right font-medium">{n2(i.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-3 grid grid-cols-5 gap-6">
            <div className="col-span-3">
              <div className="rounded bg-slate-50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Amount in words</div>
                <div className="mt-0.5 font-semibold text-slate-900">{inWords(b.total)}</div>
              </div>
              {tax && b.gstBreakup?.length > 0 && (
                <table className="mt-3 w-full text-[11px]">
                  <thead><tr className="border-b border-slate-200 text-slate-500"><th className="py-1 text-left">GST Rate</th><th className="py-1 text-right">Taxable</th>{b.interState ? <th className="py-1 text-right">IGST</th> : <><th className="py-1 text-right">CGST</th><th className="py-1 text-right">SGST</th></>}<th className="py-1 text-right">Total Tax</th></tr></thead>
                  <tbody>
                    {b.gstBreakup.map((g) => (
                      <tr key={g.rate} className="border-b border-slate-100">
                        <td className="py-1">{g.rate}%</td>
                        <td className="py-1 text-right">{n2(g.taxable)}</td>
                        {b.interState ? <td className="py-1 text-right">{n2(g.tax)}</td> : <><td className="py-1 text-right">{n2(g.tax / 2)}</td><td className="py-1 text-right">{n2(g.tax / 2)}</td></>}
                        <td className="py-1 text-right">{n2(g.tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="col-span-2">
              <table className="w-full">
                <tbody>
                  <TR k="Subtotal" v={n2(b.subtotal)} />
                  {b.discount > 0 && <TR k="Discount" v={"- " + n2(b.discount)} />}
                  <TR k="Taxable Value" v={n2(b.taxable)} />
                  {tax && (b.interState ? <TR k="IGST" v={n2(b.igst)} /> : <><TR k="CGST" v={n2(b.cgst)} /><TR k="SGST" v={n2(b.sgst)} /></>)}
                  {b.roundOff !== 0 && <TR k="Round Off" v={n2(b.roundOff)} />}
                  <tr className="border-t-2 border-slate-800">
                    <td className="py-2 text-[13px] font-bold">Grand Total</td>
                    <td className="py-2 text-right text-[14px] font-bold">₹{n2(b.total)}</td>
                  </tr>
                  <TR k={`Paid (${b.mode})`} v={n2(b.paid)} />
                  <tr><td className="py-1 font-semibold text-rose-600">Balance Due</td><td className="py-1 text-right font-semibold text-rose-600">₹{n2(b.due)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 grid grid-cols-3 gap-6 border-t border-slate-200 pt-4">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bank Details</div>
              {s.bankName && <div>{s.bankName}</div>}
              {s.accountName && <div>A/c Name: {s.accountName}</div>}
              {s.accountNo && <div>A/c No: <b>{s.accountNo}</b></div>}
              {s.ifsc && <div>IFSC: <b>{s.ifsc}</b></div>}
              {s.branch && <div>Branch: {s.branch}</div>}
              {s.upi && <div className="mt-1">UPI: <b>{s.upi}</b></div>}
            </div>
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Terms & Conditions</div>
              <div className="whitespace-pre-line text-[11px] text-slate-600">{s.terms}</div>
            </div>
            <div className="flex flex-col justify-between text-right">
              <div className="font-semibold">For {s.name}</div>
              <div className="mt-14 border-t border-slate-300 pt-1 text-[11px] text-slate-500">Authorised Signatory</div>
            </div>
          </div>
          <div className="mt-4 flex justify-between text-[10px] text-slate-400">
            <span>This is a computer generated invoice.</span>
            <span>Brighton Solution • DEMO</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TR({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="py-1 text-slate-600">{k}</td>
      <td className="py-1 text-right">{v}</td>
    </tr>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><View /></Suspense>;
}
