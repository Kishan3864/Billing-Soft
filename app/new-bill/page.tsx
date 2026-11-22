"use client";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, increment, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { categoryNames, MODES, useCategories, useCustomers, useProducts, useSettings } from "@/lib/data";
import { billNoOf, calcBill, fyOf } from "@/lib/calc";
import { inr, todayISO } from "@/lib/format";
import { Btn, Card, Field, Input, Loading, PageHead, Select } from "@/components/ui";
import { IPlus, ITrash } from "@/components/icons";
import { CustomerForm } from "@/components/CustomerForm";

type Line = { productId: string; name: string; model: string; hsn: string; unit: string; qty: number; rate: number; gst: number };

function NewBill() {
  const router = useRouter();
  const params = useSearchParams();
  const settings = useSettings();
  const { rows: customers } = useCustomers();
  const { rows: products } = useProducts();
  const { rows: cats } = useCategories();
  const groups = categoryNames(cats, products);
  const [cid, setCid] = useState(params.get("c") || "");
  const [date, setDate] = useState(todayISO());
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState("");
  const [discount, setDiscount] = useState("");
  const [gstOn, setGstOn] = useState(true);
  const [vehicleNo, setVehicleNo] = useState("");
  const [ewayNo, setEwayNo] = useState("");
  const [paid, setPaid] = useState("");
  const [mode, setMode] = useState("Cash");
  const [addCust, setAddCust] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const cust = customers.find((c) => c.id === cid);
  const interState = !!cust && cust.state !== settings.state;
  const t = useMemo(() => calcBill(lines, +discount || 0, gstOn, interState), [lines, discount, gstOn, interState]);
  const paidAmt = Math.min(+paid || 0, t.total);
  const due = t.total - paidAmt;

  const addProduct = (pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    setLines((ls) => {
      const i = ls.findIndex((l) => l.productId === pid);
      if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { productId: p.id, name: p.name, model: p.model, hsn: p.hsn, unit: p.unit || "Pcs", qty: 1, rate: p.rate, gst: p.gst }];
    });
    setPick("");
  };
  const upd = (i: number, k: keyof Line, v: number) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: v } : l)));

  const save = async () => {
    setErr("");
    if (!cust) return setErr("Please select a customer");
    if (lines.length === 0 || lines.some((l) => !(l.qty > 0))) return setErr("Add at least one item with quantity");
    setBusy(true);
    try {
      const fy = fyOf(date);
      const billRef = doc(collection(db, "bills"));
      await runTransaction(db, async (tx) => {
        const cRef = doc(db, "meta", "counter_" + fy);
        const cs = await tx.get(cRef);
        const no = cs.exists() ? (cs.data().next as number) : 1;
        const items = lines.map((l) => ({ ...l, amount: Math.round(l.qty * l.rate * 100) / 100 }));
        tx.set(billRef, {
          no, fy, billNo: billNoOf(settings.prefix, fy, no), date, createdAt: Date.now(),
          customerId: cust.id,
          customer: { name: cust.name, mobile: cust.mobile, address: cust.address, state: cust.state, gstin: cust.gstin || "" },
          items, gstOn, interState, ...t, paid: paidAmt, mode, due, vehicleNo: vehicleNo.toUpperCase(), ewayNo,
        });
        tx.set(cRef, { next: no + 1 });
        for (const l of lines) tx.update(doc(db, "products", l.productId), { stock: increment(-l.qty) });
        tx.update(doc(db, "customers", cust.id), { balance: increment(due) });
      });
      router.push(`/bill?id=${billRef.id}`);
    } catch (e) {
      setErr("Could not save bill: " + (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHead title="New Bill" sub="Tax invoice" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <Field label="Customer" className="col-span-2">
                <div className="flex gap-2">
                  <Select value={cid} onChange={(e) => setCid(e.target.value)}>
                    <option value="">Select customer</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <Btn variant="outline" onClick={() => setAddCust(true)} title="Add customer"><IPlus width={16} height={16} /></Btn>
                </div>
              </Field>
              <Field label="Bill date" className="col-span-2 md:col-span-1"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            </div>
            {cust && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <span>{cust.state}</span>
                <span>{cust.gstin || "Unregistered"}</span>
                <span className="font-medium text-accent">{interState ? "IGST (inter-state)" : "CGST + SGST"}</span>
                {cust.balance > 0 && <span className="text-rose-600">Old due {inr(cust.balance)}</span>}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Items</h2>
            </div>
            <Select value={pick} onChange={(e) => addProduct(e.target.value)}>
              <option value="">+ Add product…</option>
              {groups.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {products.filter((p) => p.category === cat).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.model}) — ₹{p.rate} · stock {p.stock}</option>
                  ))}
                </optgroup>
              ))}
            </Select>

            <div className="mt-3 space-y-2">
              {lines.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No items added yet</p>}
              {lines.map((l, i) => {
                const p = products.find((x) => x.id === l.productId);
                const short = p && l.qty > p.stock;
                return (
                  <div key={l.productId} className="rounded border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">{l.name}</div>
                        <div className="text-xs text-slate-400">{l.model} · HSN {l.hsn} · GST {l.gst}%{short && <span className="text-amber-600"> · only {p?.stock} in stock</span>}</div>
                      </div>
                      <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><ITrash width={16} height={16} /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 items-end gap-2">
                      <Field label={`Qty (${l.unit})`}><Input type="number" inputMode="numeric" value={l.qty || ""} onChange={(e) => upd(i, "qty", +e.target.value)} /></Field>
                      <Field label="Rate (₹)"><Input type="number" inputMode="decimal" value={l.rate || ""} onChange={(e) => upd(i, "rate", +e.target.value)} /></Field>
                      <div className="pb-2.5 text-right text-sm font-semibold text-slate-900">{inr(l.qty * l.rate)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-slate-900">Transport <span className="text-xs font-normal text-slate-400">(optional)</span></h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Vehicle no."><Input value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="RJ14 GB 4521" className="uppercase" /></Field>
              <Field label="E-way bill no."><Input inputMode="numeric" value={ewayNo} onChange={(e) => setEwayNo(e.target.value)} /></Field>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold text-slate-900">Summary</h2>
            <div className="space-y-2 text-sm">
              <Row k="Subtotal" v={inr(t.subtotal)} />
              <div className="flex items-center justify-between gap-3">
                <span className="whitespace-nowrap text-slate-500">Discount (₹)</span>
                <Input type="number" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} className="!h-8 !w-28 shrink-0 text-right" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">GST</span>
                <button onClick={() => setGstOn(!gstOn)} className={`relative h-6 w-11 rounded-sm transition ${gstOn ? "bg-accent" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-sm bg-white shadow transition ${gstOn ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
              <Row k="Taxable value" v={inr(t.taxable)} />
              {gstOn && (interState ? <Row k="IGST" v={inr(t.igst)} /> : <><Row k="CGST" v={inr(t.cgst)} /><Row k="SGST" v={inr(t.sgst)} /></>)}
              <Row k="Round off" v={inr(t.roundOff)} />
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-semibold text-slate-900">Total</span>
                <span className="text-xl font-semibold text-accent">{inr(t.total)}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <Field label="Amount paid (₹)">
                <Input type="number" inputMode="decimal" value={paid} onChange={(e) => setPaid(e.target.value)} />
              </Field>
              <Field label="Mode"><Select value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <button onClick={() => setPaid(String(t.total))} className="col-span-2 -mt-1 text-left text-xs font-medium text-accent">Mark fully paid</button>
              <div className="col-span-2 flex items-center justify-between rounded bg-rose-50/60 px-3 py-2 text-sm">
                <span className="text-slate-600">Pending</span>
                <span className="font-semibold text-rose-600">{inr(due)}</span>
              </div>
            </div>
            {err && <p className="mt-3 text-sm text-rose-600">{err}</p>}
            <Btn className="mt-4 w-full" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Bill"}</Btn>
          </Card>
        </div>
      </div>
      {addCust && <CustomerForm initial={null} onClose={() => setAddCust(false)} onSaved={(id) => setCid(id)} />}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{k}</span>
      <span className="text-slate-800">{v}</span>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<Loading />}><NewBill /></Suspense>;
}
