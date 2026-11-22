// Pure helpers (no imports) — shared by the app and the seed script.

export type BillItem = {
  productId: string;
  name: string;
  model: string;
  hsn: string;
  qty: number;
  rate: number;
  gst: number;
  amount: number;
  unit?: string;
};

export type BillTotals = {
  subtotal: number;
  discount: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
  roundOff: number;
  total: number;
  gstBreakup: { rate: number; taxable: number; tax: number }[];
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcBill(
  items: { qty: number; rate: number; gst: number }[],
  discount: number,
  gstOn: boolean,
  interState: boolean
): BillTotals {
  const subtotal = r2(items.reduce((s, i) => s + i.qty * i.rate, 0));
  const disc = Math.min(Math.max(discount || 0, 0), subtotal);
  const factor = subtotal > 0 ? (subtotal - disc) / subtotal : 0;
  const map = new Map<number, { taxable: number; tax: number }>();
  for (const i of items) {
    const t = i.qty * i.rate * factor;
    const rate = gstOn ? i.gst : 0;
    const cur = map.get(rate) ?? { taxable: 0, tax: 0 };
    cur.taxable += t;
    cur.tax += (t * rate) / 100;
    map.set(rate, cur);
  }
  const gstBreakup = [...map.entries()]
    .filter(([rate]) => rate > 0)
    .map(([rate, v]) => ({ rate, taxable: r2(v.taxable), tax: r2(v.tax) }));
  const taxable = r2(subtotal - disc);
  const tax = r2(gstBreakup.reduce((s, g) => s + g.tax, 0));
  const igst = interState ? tax : 0;
  const cgst = interState ? 0 : r2(tax / 2);
  const sgst = interState ? 0 : r2(tax - cgst);
  const raw = taxable + tax;
  const total = Math.round(raw);
  return { subtotal, discount: r2(disc), taxable, cgst, sgst, igst, tax, roundOff: r2(total - raw), total, gstBreakup };
}

export function fyOf(dateISO: string): string {
  const [y, m] = dateISO.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function billNoOf(prefix: string, fy: string, n: number): string {
  return `${prefix ? prefix + "/" : ""}${fy}/${String(n).padStart(4, "0")}`;
}
