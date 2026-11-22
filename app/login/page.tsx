"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { APP_NAME } from "@/lib/data";
import { Btn, Field, Input } from "@/components/ui";
import { AppMark, InstallButton } from "@/components/Shell";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch {
      setErr("Wrong email or password");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <AppMark size={52} />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">GST billing, stock & payments</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <Field label="Email">
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" required />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" required />
          </Field>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <Btn type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Btn>
          <button
            type="button"
            onClick={() => { setEmail("demo@billing.com"); setPass("demo@123"); }}
            className="w-full text-center text-xs text-slate-400 hover:text-accent"
          >
            Use demo login
          </button>
        </form>
        <div className="mt-4 flex justify-center"><InstallButton /></div>
        <p className="mt-4 text-center text-[11px] text-slate-400">Brighton Solution • DEMO</p>
      </div>
    </div>
  );
}
