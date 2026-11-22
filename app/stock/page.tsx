"use client";
import { useState } from "react";
import { collection, doc, increment, orderBy, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, StockLog, useCol, useProducts } from "@/lib/data";
import { dmy, todayISO } from "@/lib/format";
import { Badge, Btn, Card, Empty, Field, Input, Loading, Modal, PageHead, Select } from "@/components/ui";
import { IPlus } from "@/components/icons";

export default function Stock() {
  const { rows: products, loading } = useProducts();
  const { rows: logs } = useCol<StockLog>("stocklog", orderBy("createdAt", "desc"));
  const [open, setOpen] = useState<string | null>(null);
  const low = products.filter((p) => p.stock <= p.minStock);
  const sorted = [...products].sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock));

  return (
    <div>
      <PageHead title="Stock" sub={`${products.reduce((s, p) => s + p.stock, 0)} pcs in hand`} actions={<Btn onClick={() => setOpen("")}><IPlus width={18} height={18} /> Add stock</Btn>} />
      {low.length > 0 && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <b>{low.length} item{low.length > 1 ? "s" : ""} low on stock:</b> {low.map((p) => `${p.name} (${p.stock})`).join(", ")}
        </div>
      )}
      {loading ? <Loading /> : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="divide-y divide-slate-100 overflow-hidden lg:col-span-2">
            {sorted.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.model} · {p.category} · alert at {p.minStock}</div>
                </div>
                <div className="flex items-center gap-2">
                  {p.stock <= p.minStock ? <Badge tone={p.stock <= 0 ? "rose" : "amber"}>{p.stock} pcs</Badge> : <span className="text-sm font-semibold text-slate-800">{p.stock} pcs</span>}
                  <Btn size="sm" variant="outline" onClick={() => setOpen(p.id)}>+ Add</Btn>
                </div>
              </div>
            ))}
          </Card>
          <Card className="self-start">
            <h2 className="px-4 pb-2 pt-4 font-semibold text-slate-900">Stock log</h2>
            <div className="divide-y divide-slate-100">
              {logs.length === 0 && <Empty text="No entries" />}
              {logs.slice(0, 15).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-slate-800">{l.productName}</div>
                    <div className="text-xs text-slate-400">{dmy(l.date)}{l.note ? " · " + l.note : ""}</div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">+{l.qty}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      {open !== null && <AddStock products={products} initial={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function AddStock({ products, initial, onClose }: { products: Product[]; initial: string; onClose: () => void }) {
  const [pid, setPid] = useState(initial);
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("Stock added");
  const [busy, setBusy] = useState(false);
  const p = products.find((x) => x.id === pid);
  const save = async () => {
    const q = +qty;
    if (!p || !(q > 0)) return;
    setBusy(true);
    const b = writeBatch(db);
    b.update(doc(db, "products", p.id), { stock: increment(q) });
    b.set(doc(collection(db, "stocklog")), { productId: p.id, productName: p.name, qty: q, date, note, createdAt: Date.now() });
    await b.commit();
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Add Stock">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Product" className="col-span-2">
          <Select value={pid} onChange={(e) => setPid(e.target.value)}>
            <option value="">Select product</option>
            {products.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.model}) — {x.stock} in stock</option>)}
          </Select>
        </Field>
        <Field label="Quantity (pcs)"><Input type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus /></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Note" className="col-span-2"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {p && qty && <p className="col-span-2 text-sm text-slate-500">New stock: <b className="text-slate-900">{p.stock + (+qty || 0)} pcs</b></p>}
        <Btn className="col-span-2 mt-2" onClick={save} disabled={busy}>{busy ? "Saving…" : "Add Stock"}</Btn>
      </div>
    </Modal>
  );
}
