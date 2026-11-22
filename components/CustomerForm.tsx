"use client";
import { useState } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Customer, STATES, useSettings } from "@/lib/data";
import { Btn, Field, Input, Modal, Select, Textarea } from "./ui";

type Draft = Omit<Customer, "id" | "balance"> & { id?: string; balance?: number };

export function CustomerForm({ initial, onClose, onSaved }: { initial: Draft | null; onClose: () => void; onSaved?: (id: string) => void }) {
  const settings = useSettings();
  const [c, setC] = useState<Draft>(initial || { name: "", mobile: "", address: "", state: settings.state, gstin: "", opening: 0 });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Draft, v: string) => setC((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if (!c.name.trim()) return;
    setBusy(true);
    const { id, balance, ...data } = c;
    const clean = { ...data, name: data.name.trim(), gstin: (data.gstin || "").toUpperCase().trim() };
    if (id) {
      await updateDoc(doc(db, "customers", id), clean);
      onSaved?.(id);
    } else {
      const opening = +(data.opening || 0);
      const r = await addDoc(collection(db, "customers"), { ...clean, opening, balance: opening + (balance || 0) });
      onSaved?.(r.id);
    }
    setBusy(false);
    onClose();
  };

  return (
    <Modal open onClose={onClose} title={c.id ? "Edit Customer" : "Add Customer"}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name / Firm" className="col-span-2"><Input value={c.name} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        <Field label="Mobile"><Input inputMode="tel" maxLength={10} value={c.mobile} onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))} /></Field>
        <Field label="State"><Select value={c.state} onChange={(e) => set("state", e.target.value)}>{STATES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Address" className="col-span-2"><Textarea rows={2} value={c.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Field label="GSTIN (optional)" className={c.id ? "col-span-2" : ""}><Input value={c.gstin} onChange={(e) => set("gstin", e.target.value)} maxLength={15} className="uppercase" /></Field>
        {!c.id && <Field label="Opening balance (₹)"><Input type="number" inputMode="decimal" value={c.opening || ""} onChange={(e) => set("opening", e.target.value)} /></Field>}
        <Btn className="col-span-2 mt-2" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Btn>
      </div>
    </Modal>
  );
}
