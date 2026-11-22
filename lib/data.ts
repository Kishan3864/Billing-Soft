"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, QueryConstraint } from "firebase/firestore";
import { db } from "./firebase";
import type { BillItem } from "./calc";

export const MODES = ["Cash", "UPI", "Bank", "Cheque"] as const;
export const UNITS = ["Pcs", "Nos", "Set", "Box", "Kg", "Mtr", "Ltr", "Pair", "Dozen"] as const;
export const APP_NAME = "Billing";

export type Category = { id: string; name: string; hsn?: string; gst?: number; createdAt?: number };

/** Category names from the categories collection, plus any names used by products but not listed. */
export function categoryNames(categories: Category[], products: { category: string }[]): string[] {
  const names = categories.map((c) => c.name);
  for (const p of products) if (p.category && !names.includes(p.category)) names.push(p.category);
  return names;
}

export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export type Product = {
  id: string; name: string; category: string; model: string; hsn: string;
  gst: number; rate: number; stock: number; minStock: number; unit?: string;
};
export type Customer = {
  id: string; name: string; mobile: string; address: string; state: string;
  gstin?: string; balance: number; opening?: number;
};
export type Bill = {
  id: string; no: number; fy: string; billNo: string; date: string; createdAt?: number;
  customerId: string;
  customer: { name: string; mobile: string; address: string; state: string; gstin?: string };
  items: BillItem[];
  subtotal: number; discount: number; taxable: number; gstOn: boolean; interState: boolean;
  cgst: number; sgst: number; igst: number; tax: number; roundOff: number; total: number;
  gstBreakup: { rate: number; taxable: number; tax: number }[];
  paid: number; mode: string; due: number; vehicleNo?: string; ewayNo?: string; notes?: string;
};
export type Payment = {
  id: string; customerId: string; customerName: string; date: string; amount: number;
  mode: string; note?: string; createdAt?: number;
};
export type StockLog = { id: string; productId: string; productName: string; qty: number; date: string; note?: string; createdAt?: number };
export type Settings = {
  name: string; address: string; state: string; gstin: string; phone: string; email?: string;
  logo?: string; bankName?: string; accountName?: string; accountNo?: string; ifsc?: string; branch?: string;
  upi?: string; prefix: string; terms: string;
};

export const DEFAULT_SETTINGS: Settings = {
  name: "Your Business", address: "", state: "Rajasthan", gstin: "", phone: "", prefix: "INV",
  terms: "Goods once sold will not be taken back.\nSubject to local jurisdiction.",
};

export function useCol<T>(name: string, ...constraints: QueryConstraint[]) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const key = name + constraints.length;
  useEffect(() => {
    const q = constraints.length ? query(collection(db, name), ...constraints) : collection(db, name);
    return onSnapshot(q, (s) => {
      setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
      setLoading(false);
    }, () => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { rows, loading };
}

export const useProducts = () => useCol<Product>("products", orderBy("name"));
export const useCategories = () => useCol<Category>("categories", orderBy("name"));
export const useCustomers = () => useCol<Customer>("customers", orderBy("name"));
export const useBills = () => useCol<Bill>("bills", orderBy("createdAt", "desc"));
export const usePayments = () => useCol<Payment>("payments", orderBy("createdAt", "desc"));

export function useDocData<T>(path: string, id: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, path, id), (s) => {
      setData(s.exists() ? ({ id: s.id, ...s.data() } as T) : null);
      setLoading(false);
    }, () => setLoading(false));
  }, [path, id]);
  return { data, loading };
}

export function useSettings(): Settings {
  const { data } = useDocData<Settings>("meta", "settings");
  return { ...DEFAULT_SETTINGS, ...(data || {}) };
}
