// Seeds demo data for Goyal Industries. Run: node tools/seed.mjs
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, deleteUser, signOut } from "firebase/auth";
import { getFirestore, writeBatch, doc, getDocs, collection, terminate } from "firebase/firestore";
import { calcBill, fyOf, billNoOf } from "../lib/calc.ts";

const cfg = {
  apiKey: "AIzaSyAjMpF6lXVdF0jURidxFTJxm2ua_lHomLs",
  authDomain: "billingsoftware-11.firebaseapp.com",
  projectId: "billingsoftware-11",
  appId: "1:75306232120:web:394e0d413a24f018a279cd",
};
const EMAIL = "demo@billing.com";
const PASS = "demo@123";

const app = initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

// remove the old demo account
try {
  const o = await signInWithEmailAndPassword(auth, "demo@goyal.com", PASS);
  await deleteUser(o.user);
  console.log("deleted old demo user");
} catch (e) { console.log("old user:", e.code); }
try { await signOut(auth); } catch {}

try {
  await createUserWithEmailAndPassword(auth, EMAIL, PASS);
  console.log("created user");
} catch (e) {
  if (String(e.code).includes("email-already-in-use")) await signInWithEmailAndPassword(auth, EMAIL, PASS);
  else throw e;
}
console.log("signed in", auth.currentUser.uid);

// wipe existing demo collections
for (const c of ["products", "customers", "bills", "payments", "stocklog", "meta", "categories"]) {
  const s = await getDocs(collection(db, c));
  const b = writeBatch(db);
  s.docs.forEach((d) => b.delete(d.ref));
  await b.commit();
}

const settings = {
  name: "Shubh Enterprises",
  address: "E-112, RIICO Industrial Area, Sitapura, Jaipur - 302022",
  state: "Rajasthan",
  gstin: "08ABCFS1234K1Z5",
  phone: "+91 98290 12345",
  email: "",
  bankName: "State Bank of India",
  accountName: "Shubh Enterprises",
  accountNo: "38291045672",
  ifsc: "SBIN0011223",
  branch: "Sitapura, Jaipur",
  upi: "billingdemo@upi",
  prefix: "INV",
  terms: "Goods once sold will not be taken back.\nInterest @18% p.a. will be charged if payment is not made within 30 days.\nSubject to Jaipur jurisdiction only.",
};

const P = [
  ["p01", "Desert Air Cooler 50L", "Cooler", "DC-50", "8479", 18, 5800, 34, 5],
  ["p02", "Desert Air Cooler 75L", "Cooler", "DC-75", "8479", 18, 7200, 22, 5],
  ["p03", "Desert Air Cooler 100L", "Cooler", "DC-100", "8479", 18, 8900, 14, 5],
  ["p04", "Personal Air Cooler 30L", "Cooler", "PC-30", "8479", 18, 3900, 3, 5],
  ["p05", "Steel Almirah 4 ft 1-Door", "Iron Almirah", "SA-41", "9403", 18, 7500, 16, 4],
  ["p06", "Steel Almirah 5 ft 2-Door", "Iron Almirah", "SA-52", "9403", 18, 11800, 12, 4],
  ["p07", "Steel Almirah 6.5 ft 2-Door with Locker", "Iron Almirah", "SA-62L", "9403", 18, 15500, 9, 4],
  ["p08", "Steel Almirah 6.5 ft 3-Door", "Iron Almirah", "SA-63", "9403", 18, 18900, 2, 3],
  ["p09", "Revolving Office Chair", "Furniture", "OC-01", "9401", 18, 3200, 26, 6],
  ["p10", "Steel Study Table", "Furniture", "ST-01", "9403", 18, 4600, 11, 4],
  ["p11", "Steel Double Bed 6x5 ft", "Furniture", "BD-65", "9403", 18, 16500, 1, 2],
  ["p12", "Steel Storage Rack 5 Shelf", "Furniture", "RK-5", "9403", 18, 3400, 18, 5],
].map(([id, name, category, model, hsn, gst, rate, stock, minStock]) => ({ id, name, category, model, hsn, gst, rate, stock, minStock, unit: "Pcs" }));

const C = [
  ["c01", "Sharma Electronics & Furniture", "9876543201", "Shop 14, MI Road, Jaipur - 302001", "Rajasthan", "08AAKFS4521L1Z2"],
  ["c02", "Agarwal Traders", "9876543202", "Naya Bazar, Ajmer - 305001", "Rajasthan", "08ABHPA7781M1Z9"],
  ["c03", "Shree Balaji Furniture House", "9876543203", "Station Road, Kota - 324002", "Rajasthan", "08AFBPB3345Q1Z4"],
  ["c04", "Jain Steel Furniture", "9876543204", "Sojati Gate, Jodhpur - 342001", "Rajasthan", ""],
  ["c05", "Patel Home Appliances", "9876543205", "Relief Road, Ahmedabad - 380001", "Gujarat", "24AAMFP9182H1Z7"],
  ["c06", "Verma Furniture Mart", "9876543206", "Rajwada, Indore - 452002", "Madhya Pradesh", "23ACXPV6610D1Z3"],
].map(([id, name, mobile, address, state, gstin]) => ({ id, name, mobile, address, state, gstin, balance: 0, opening: 0 }));

const pi = Object.fromEntries(P.map((p) => [p.model, p]));
const B = [
  ["2026-10-08", 0, [["DC-50", 10], ["DC-75", 5]], 1000, "all", "Bank", "RJ14GB4521", "391204567812"],
  ["2026-10-21", 4, [["SA-52", 6], ["SA-62L", 4]], 0, 100000, "Bank", "GJ01AB2345", "391204598830"],
  ["2026-11-02", 1, [["DC-100", 4], ["PC-30", 10]], 0, 40000, "Cash", "RJ01CA7712", ""],
  ["2026-11-05", 2, [["ST-01", 6], ["OC-01", 10]], 0, "all", "UPI", "", ""],
  ["2026-11-09", 5, [["SA-41", 8], ["RK-5", 10]], 0, 50000, "Cheque", "MP09GH3310", "391204633417"],
  ["2026-11-12", 3, [["BD-65", 2], ["SA-52", 2]], 500, 20000, "Cash", "", ""],
  ["2026-11-15", 0, [["SA-63", 3], ["DC-75", 6]], 0, 0, "Cash", "RJ14GB4521", "391204671290"],
  ["2026-11-18", 4, [["DC-100", 8]], 0, 50000, "UPI", "GJ01AB2345", "391204690021"],
  ["2026-11-22", 1, [["DC-50", 6], ["OC-01", 5]], 0, "all", "Cash", "", ""],
  ["2026-11-22", 2, [["SA-62L", 2], ["RK-5", 4]], 0, 20000, "UPI", "RJ20CB1188", ""],
];

const batch = writeBatch(db);
[["cat1","Cooler","8479",18],["cat2","Iron Almirah","9403",18],["cat3","Furniture","9403",18]].forEach(([id,name,hsn,gst],k)=>batch.set(doc(db,"categories",id),{name,hsn,gst,createdAt:Date.now()+k}));
batch.set(doc(db, "meta", "settings"), settings);
let n = 0;
const counters = {};
B.forEach(([date, ci, lines, discount, paidSpec, mode, vehicleNo, ewayNo], k) => {
  const c = C[ci];
  const interState = c.state !== settings.state;
  const items = lines.map(([m, qty]) => {
    const p = pi[m];
    return { productId: p.id, name: p.name, model: p.model, hsn: p.hsn, qty, rate: p.rate, gst: p.gst, amount: qty * p.rate };
  });
  const t = calcBill(items, discount, true, interState);
  const paid = paidSpec === "all" ? t.total : paidSpec;
  const fy = fyOf(date);
  counters[fy] = (counters[fy] || 0) + 1;
  const no = counters[fy];
  n++;
  const id = `b${String(n).padStart(2, "0")}`;
  const due = t.total - paid;
  c.balance += due;
  batch.set(doc(db, "bills", id), {
    no, fy, billNo: billNoOf(settings.prefix, fy, no), date,
    createdAt: new Date(date + "T10:00:00+05:30").getTime() + k * 3600000,
    customerId: c.id,
    customer: { name: c.name, mobile: c.mobile, address: c.address, state: c.state, gstin: c.gstin },
    items, gstOn: true, interState, ...t, paid, mode, due, vehicleNo, ewayNo,
  });
  console.log(id, billNoOf(settings.prefix, fy, no), c.name, t.total, "paid", paid);
});
for (const [fy, v] of Object.entries(counters)) batch.set(doc(db, "meta", "counter_" + fy), { next: v + 1 });

const PAY = [
  ["2026-11-10", 1, 15000, "Cash", "Against bill INV/2026-27/0003"],
  ["2026-11-16", 4, 30000, "Bank", "NEFT received"],
  ["2026-11-20", 5, 25000, "UPI", "Part payment"],
];
PAY.forEach(([date, ci, amount, mode, note], k) => {
  const c = C[ci];
  c.balance -= amount;
  batch.set(doc(db, "payments", `pay${k + 1}`), {
    customerId: c.id, customerName: c.name, date, amount, mode, note,
    createdAt: new Date(date + "T12:00:00+05:30").getTime(),
  });
});
for (const c of C) {
  const { id, ...rest } = c;
  batch.set(doc(db, "customers", id), rest);
  console.log(c.name, "balance", c.balance);
}
for (const p of P) {
  const { id, ...rest } = p;
  batch.set(doc(db, "products", id), rest);
}
const LOG = [
  ["2026-11-01", "p01", 20, "Production batch #41"],
  ["2026-11-06", "p06", 10, "Production batch #42"],
  ["2026-11-14", "p09", 15, "Purchased from vendor"],
];
LOG.forEach(([date, pid, qty, note], k) => {
  const p = P.find((x) => x.id === pid);
  batch.set(doc(db, "stocklog", `s${k + 1}`), { productId: pid, productName: p.name, qty, date, note, createdAt: new Date(date + "T09:00:00+05:30").getTime() });
});
await batch.commit();
console.log("SEED DONE");
await terminate(db);
process.exit(0);
