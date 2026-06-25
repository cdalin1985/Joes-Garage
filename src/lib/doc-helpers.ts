import type { EditorItem } from "@/components/forms/DocumentEditor";
import type { LineItemType } from "@/lib/database.types";

const VALID_TYPES: LineItemType[] = ["labor", "part", "sublet", "fee", "discount"];

/** Safely parse the serialized line items coming from DocumentEditor. */
export function parseItems(formData: FormData): EditorItem[] {
  const raw = formData.get("items");
  if (typeof raw !== "string") return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .map((x): EditorItem => {
      const o = x as Record<string, unknown>;
      const type = VALID_TYPES.includes(o.item_type as LineItemType)
        ? (o.item_type as LineItemType)
        : "labor";
      return {
        item_type: type,
        description: String(o.description ?? ""),
        quantity: Number(o.quantity) || 0,
        unit_price: Number(o.unit_price) || 0,
        taxable: Boolean(o.taxable),
        part_id: typeof o.part_id === "string" ? o.part_id : null,
      };
    })
    .filter((i) => i.description.trim() !== "" || i.unit_price !== 0);
}

export function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

export function num(fd: FormData, key: string, fallback = 0): number {
  const s = str(fd, key);
  if (!s) return fallback;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}

/** Map editor items to insertable rows for a given parent id column. */
export function itemRows<K extends string>(
  items: EditorItem[],
  parentKey: K,
  parentId: string,
): Array<Record<string, unknown>> {
  return items.map((it, idx) => ({
    [parentKey]: parentId,
    item_type: it.item_type,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    taxable: it.taxable,
    part_id: it.part_id,
    sort_order: idx,
  }));
}
