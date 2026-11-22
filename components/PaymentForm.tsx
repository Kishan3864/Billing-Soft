"use client";
import { useState } from "react";
import { collection, doc, increment, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MODES, useCustomers } from "@/lib/data";
import { inr0, todayISO } from "@/lib/format";
import { Btn, Field, Input, Modal, Select } from "./ui";

export function PaymentForm({ customerId, onClose }: { customerId?: string; onClose: () => void }) {
  const { rows: customers } = useCustomers();
  const [cid, setCid] = useState(customerId || "");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const cust = customers.find((c) => c.id === cid);

  const save = async () => {
    const amt = +amount;
    if (!cust || !(amt > 0)) { setErr("Select customer and enter amount"); return; }
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        tx.set(doc(collection(db, "payments")), {
          customerId: cust.id, customerName: cust.name, date, amount: amt, mode, note, createdAt: Date.now(),
        });
        tx.update(doc(db, "customers", cust.id), { balance: increment(-amt) });
      });
      onClose();
    } catch (e) {
      setErr("Could not save: " + (e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Receive Payment">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Customer" className="col-span-2">
          <Select value={cid} onChange={(e) => setCid(e.target.value)}>
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.balance > 0 ? ` — ${inr0(c.balance)} due` : ""}</option>)}
          </Select>
        </Field>
        {cust && (
          <div className="col-span-2 rounded bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Pending: <b className={cust.balance > 0 ? "text-rose-600" : "text-emerald-600"}>{inr0(cust.balance)}</b>
          </div>
        )}
        <Field label="Amount (₹)"><Input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
        <Field label="Mode"><Select value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ref / cheque no." /></Field>
        {err && <p className="col-span-2 text-sm text-rose-600">{err}</p>}
        <Btn className="col-span-2 mt-2" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save Payment"}</Btn>
      </div>
    </Modal>
  );
}
