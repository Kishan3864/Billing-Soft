"use client";
import Link from "next/link";
import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { categoryNames, Product, UNITS, useCategories, useProducts } from "@/lib/data";
import { inr0 } from "@/lib/format";
import { Badge, Btn, Card, Empty, Field, Input, Loading, Modal, PageHead, SearchBox, Select } from "@/components/ui";
import { IPlus, ITag } from "@/components/icons";

type Draft = Omit<Product, "id"> & { id?: string };

export default function Products() {
  const { rows, loading } = useProducts();
  const { rows: cats } = useCategories();
  const names = categoryNames(cats, rows);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [edit, setEdit] = useState<Draft | null>(null);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const list = rows.filter(
    (p) => (cat === "All" || p.category === cat) && (p.name + p.model + p.hsn).toLowerCase().includes(q.toLowerCase())
  );

  const blank = (): Draft => {
    const c = cats[0];
    return { name: "", category: c?.name || "", model: "", hsn: c?.hsn || "", gst: c?.gst ?? 18, rate: 0, stock: 0, minStock: 5, unit: "Pcs" };
  };

  const pickCategory = (name: string) => {
    const c = cats.find((x) => x.name === name);
    setEdit((e) => (e ? { ...e, category: name, hsn: e.hsn || c?.hsn || "", gst: c?.gst ?? e.gst } : e));
  };

  const addCategory = async () => {
    const name = newCat.trim();
    if (!name) return;
    if (!names.some((n) => n.toLowerCase() === name.toLowerCase())) {
      await addDoc(collection(db, "categories"), { name, hsn: "", gst: 18, createdAt: Date.now() });
    }
    setEdit((e) => (e ? { ...e, category: name } : e));
    setNewCat("");
  };

  const save = async () => {
    if (!edit) return;
    if (!edit.name.trim()) return setErr("Enter product name");
    if (!edit.category) return setErr("Select or add a category");
    setBusy(true);
    const { id, ...data } = edit;
    const clean = { ...data, name: data.name.trim(), gst: +data.gst || 0, rate: +data.rate || 0, stock: +data.stock || 0, minStock: +data.minStock || 0, unit: data.unit || "Pcs" };
    if (id) await updateDoc(doc(db, "products", id), clean);
    else await addDoc(collection(db, "products"), clean);
    setBusy(false);
    setEdit(null);
  };
  const remove = async () => {
    if (edit?.id && confirm("Delete this product?")) {
      await deleteDoc(doc(db, "products", edit.id));
      setEdit(null);
    }
  };
  const set = (k: keyof Draft, v: string | number) => setEdit((e) => (e ? { ...e, [k]: v } : e));

  return (
    <div>
      <PageHead
        title="Products"
        sub={`${rows.length} items`}
        actions={
          <>
            <Link href="/categories" className="inline-flex h-10 items-center gap-1.5 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <ITag width={16} height={16} /> <span className="hidden sm:inline">Categories</span>
            </Link>
            <Btn onClick={() => { setErr(""); setEdit(blank()); }}><IPlus width={18} height={18} /> Add</Btn>
          </>
        }
      />
      <div className="mb-4 space-y-2">
        <SearchBox value={q} onChange={setQ} placeholder="Search name, model, HSN" />
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {["All", ...names].map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`h-9 shrink-0 whitespace-nowrap rounded px-3.5 text-sm font-medium ${cat === c ? "bg-accent text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      {loading ? <Loading /> : (
        <Card className="overflow-hidden">
          {list.length === 0 && <Empty text="No products found" />}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">HSN</th><th className="px-4 py-3">GST</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Stock</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((p) => (
                  <tr key={p.id} onClick={() => { setErr(""); setEdit(p); }} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{p.name}</div><div className="text-xs text-slate-400">{p.model}</div></td>
                    <td className="px-4 py-3 text-slate-600">{p.category}</td>
                    <td className="px-4 py-3 text-slate-600">{p.hsn}</td>
                    <td className="px-4 py-3 text-slate-600">{p.gst}%</td>
                    <td className="px-4 py-3 text-right font-medium">{inr0(p.rate)}</td>
                    <td className="px-4 py-3 text-right">{p.stock <= p.minStock ? <Badge tone={p.stock <= 0 ? "rose" : "amber"}>{p.stock} {p.unit || "Pcs"}</Badge> : <span className="text-slate-700">{p.stock} {p.unit || "Pcs"}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {list.map((p) => (
              <button key={p.id} onClick={() => { setErr(""); setEdit(p); }} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{p.name}</div>
                  <div className="truncate text-xs text-slate-400">{p.model} · {p.category} · GST {p.gst}%</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold">{inr0(p.rate)}</div>
                  {p.stock <= p.minStock ? <Badge tone={p.stock <= 0 ? "rose" : "amber"}>Stock {p.stock}</Badge> : <span className="text-xs text-slate-400">Stock {p.stock}</span>}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit Product" : "Add Product"}>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Product name" className="col-span-2"><Input value={edit.name} onChange={(e) => set("name", e.target.value)} placeholder="Product name" /></Field>
            <Field label="Category" className="col-span-2">
              <Select value={edit.category} onChange={(e) => pickCategory(e.target.value)}>
                <option value="">Select category</option>
                {names.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <div className="col-span-2 flex gap-2">
              <Input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Or add new category" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
              <Btn variant="outline" onClick={addCategory} disabled={!newCat.trim()}>Add</Btn>
            </div>
            <Field label="Size / Model"><Input value={edit.model} onChange={(e) => set("model", e.target.value)} /></Field>
            <Field label="Unit"><Select value={edit.unit || "Pcs"} onChange={(e) => set("unit", e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</Select></Field>
            <Field label="HSN code"><Input value={edit.hsn} onChange={(e) => set("hsn", e.target.value)} inputMode="numeric" /></Field>
            <Field label="GST %"><Select value={edit.gst} onChange={(e) => set("gst", +e.target.value)}>{[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}</Select></Field>
            <Field label="Rate (₹, excl. GST)" className="col-span-2"><Input type="number" inputMode="decimal" value={edit.rate || ""} onChange={(e) => set("rate", e.target.value)} /></Field>
            <Field label="Opening stock"><Input type="number" inputMode="numeric" value={edit.stock} onChange={(e) => set("stock", e.target.value)} /></Field>
            <Field label="Low stock alert at"><Input type="number" inputMode="numeric" value={edit.minStock} onChange={(e) => set("minStock", e.target.value)} /></Field>
            {err && <p className="col-span-2 text-sm text-rose-600">{err}</p>}
            <div className="col-span-2 mt-2 flex gap-2">
              {edit.id && <Btn variant="danger" onClick={remove}>Delete</Btn>}
              <Btn className="flex-1" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
