"use client";
import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category, useCategories, useProducts } from "@/lib/data";
import { Btn, Card, Empty, Field, Input, Loading, Modal, PageHead, Select } from "@/components/ui";
import { IEdit, IPlus } from "@/components/icons";

type Draft = { id?: string; name: string; hsn: string; gst: number; oldName?: string };

export default function Categories() {
  const { rows, loading } = useCategories();
  const { rows: products } = useProducts();
  const [edit, setEdit] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const count = (name: string) => products.filter((p) => p.category === name).length;
  const stock = (name: string) => products.filter((p) => p.category === name).reduce((s, p) => s + p.stock, 0);

  const open = (c?: Category) => {
    setErr("");
    setEdit(c ? { id: c.id, name: c.name, hsn: c.hsn || "", gst: c.gst ?? 18, oldName: c.name } : { name: "", hsn: "", gst: 18 });
  };

  const save = async () => {
    if (!edit) return;
    const name = edit.name.trim();
    if (!name) return setErr("Enter a category name");
    if (rows.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== edit.id)) return setErr("This category already exists");
    setBusy(true);
    const data = { name, hsn: edit.hsn.trim(), gst: +edit.gst || 0 };
    if (edit.id) {
      const b = writeBatch(db);
      b.update(doc(db, "categories", edit.id), data);
      // rename on all products of this category
      if (edit.oldName && edit.oldName !== name) {
        products.filter((p) => p.category === edit.oldName).forEach((p) => b.update(doc(db, "products", p.id), { category: name }));
      }
      await b.commit();
    } else {
      await addDoc(collection(db, "categories"), { ...data, createdAt: Date.now() });
    }
    setBusy(false);
    setEdit(null);
  };

  const remove = async () => {
    if (!edit?.id) return;
    const n = count(edit.oldName || "");
    if (n > 0) return setErr(`${n} product(s) use this category. Move them to another category first.`);
    if (!confirm(`Delete category "${edit.oldName}"?`)) return;
    await deleteDoc(doc(db, "categories", edit.id));
    setEdit(null);
  };

  return (
    <div>
      <PageHead title="Categories" sub={`${rows.length} categories`} actions={<Btn onClick={() => open()}><IPlus width={18} height={18} /> Add</Btn>} />
      {loading ? <Loading /> : (
        <Card className="divide-y divide-slate-100 overflow-hidden">
          {rows.length === 0 && <Empty text="No categories yet. Add your first category." />}
          {rows.map((c) => (
            <button key={c.id} onClick={() => open(c)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-900">{c.name}</div>
                <div className="truncate text-xs text-slate-400">
                  {count(c.name)} products · {stock(c.name)} in stock{c.hsn ? ` · HSN ${c.hsn}` : ""} · GST {c.gst ?? 18}%
                </div>
              </div>
              <IEdit width={16} height={16} className="shrink-0 text-slate-400" />
            </button>
          ))}
        </Card>
      )}
      <p className="mt-3 text-xs text-slate-400">Default HSN and GST are filled automatically when you add a product in this category.</p>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Edit Category" : "Add Category"}>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category name" className="col-span-2">
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="e.g. Electronics" autoFocus />
            </Field>
            <Field label="Default HSN"><Input value={edit.hsn} onChange={(e) => setEdit({ ...edit, hsn: e.target.value })} inputMode="numeric" /></Field>
            <Field label="Default GST %">
              <Select value={edit.gst} onChange={(e) => setEdit({ ...edit, gst: +e.target.value })}>{[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}</Select>
            </Field>
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
