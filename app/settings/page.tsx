"use client";
import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SETTINGS, Settings, STATES, useDocData } from "@/lib/data";
import { Btn, Card, Field, Input, PageHead, Select, Textarea } from "@/components/ui";

export default function SettingsPage() {
  const { data, loading } = useDocData<Settings>("meta", "settings");
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loaded && !loading) { setS({ ...DEFAULT_SETTINGS, ...(data || {}) }); setLoaded(true); }
  }, [data, loading, loaded]);

  const set = (k: keyof Settings, v: string) => setS((x) => ({ ...x, [k]: v }));

  const onLogo = (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const r = Math.min(1, 200 / Math.max(img.width, img.height));
      c.width = img.width * r;
      c.height = img.height * r;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      set("logo", c.toDataURL("image/png"));
    };
    img.src = URL.createObjectURL(f);
  };

  const save = async () => {
    await setDoc(doc(db, "meta", "settings"), s, { merge: true });
    setMsg("Saved ✓");
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div>
      <PageHead title="Settings" sub="Shown on every invoice" actions={<><span className="text-sm text-emerald-600">{msg}</span><Btn onClick={save}>Save</Btn></>} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-semibold text-slate-900">Business</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex items-center gap-3">
              {s.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.logo} alt="" className="h-14 w-14 rounded border border-slate-200 object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-accent text-xl font-bold text-white">{s.name.slice(0, 1)}</div>
              )}
              <label className="cursor-pointer rounded border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
              </label>
              {s.logo && <button onClick={() => set("logo", "")} className="text-xs text-rose-500">Remove</button>}
            </div>
            <Field label="Business name" className="col-span-2"><Input value={s.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Address" className="col-span-2"><Textarea rows={2} value={s.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="State"><Select value={s.state} onChange={(e) => set("state", e.target.value)}>{STATES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
            <Field label="GSTIN"><Input value={s.gstin} onChange={(e) => set("gstin", e.target.value.toUpperCase())} maxLength={15} /></Field>
            <Field label="Phone"><Input value={s.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <Field label="Email"><Input value={s.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-3 font-semibold text-slate-900">Bank & UPI</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bank name"><Input value={s.bankName || ""} onChange={(e) => set("bankName", e.target.value)} /></Field>
            <Field label="Account name"><Input value={s.accountName || ""} onChange={(e) => set("accountName", e.target.value)} /></Field>
            <Field label="Account no."><Input value={s.accountNo || ""} onChange={(e) => set("accountNo", e.target.value)} /></Field>
            <Field label="IFSC"><Input value={s.ifsc || ""} onChange={(e) => set("ifsc", e.target.value.toUpperCase())} /></Field>
            <Field label="Branch"><Input value={s.branch || ""} onChange={(e) => set("branch", e.target.value)} /></Field>
            <Field label="UPI ID"><Input value={s.upi || ""} onChange={(e) => set("upi", e.target.value)} /></Field>
          </div>
          <h2 className="mb-3 mt-5 font-semibold text-slate-900">Invoice</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bill prefix"><Input value={s.prefix} onChange={(e) => set("prefix", e.target.value.toUpperCase())} /></Field>
            <div className="self-end pb-2.5 text-xs text-slate-400">e.g. {s.prefix ? s.prefix + "/" : ""}2026-27/0001 — restarts every April</div>
            <Field label="Terms & conditions" className="col-span-2"><Textarea rows={4} value={s.terms} onChange={(e) => set("terms", e.target.value)} /></Field>
          </div>
        </Card>
      </div>
    </div>
  );
}
