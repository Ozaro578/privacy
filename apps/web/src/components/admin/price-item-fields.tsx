import type { Tables } from "@fahrpilot/db";
import { field, label } from "@/components/admin/action-form";
import { LESSON_KIND_LABEL } from "@/lib/data/admin";

export const PRICE_UNIT_LABEL: Record<string, string> = { each: "je Stück", unit45: "je Einheit (45 Min)", hour: "je Stunde" };

/** Vorschläge für Positionscodes laut Datenmodell (price_items.code). */
export const PRICE_CODE_SUGGESTIONS = ["base_fee", "lesson_practice", "lesson_overland", "lesson_motorway", "lesson_night", "exam_theory_presentation", "exam_practical_presentation", "material", "cancellation_fee"];

export function PriceItemFields({ item, listId, idPrefix }: { item?: Tables<"price_items">; listId: string; idPrefix: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <>
      <input type="hidden" name="price_list_id" value={listId} />
      <div><label htmlFor={id("code")} className={label}>Code</label><input id={id("code")} name="code" required list="price-codes" defaultValue={item?.code ?? ""} readOnly={Boolean(item)} className={`${field} ${item ? "bg-ink-50" : ""}`} /></div>
      <div><label htmlFor={id("name")} className={label}>Bezeichnung</label><input id={id("name")} name="name" required defaultValue={item?.name ?? ""} className={field} /></div>
      <div><label htmlFor={id("unit")} className={label}>Einheit</label><select id={id("unit")} name="unit" defaultValue={item?.unit ?? "each"} className={field}>{Object.entries(PRICE_UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      <div><label htmlFor={id("amount")} className={label}>Nettobetrag (EUR)</label><input id={id("amount")} name="amount_eur" required inputMode="decimal" defaultValue={item ? (item.amount_cents / 100).toFixed(2).replace(".", ",") : ""} className={field} /></div>
      <div><label htmlFor={id("kind")} className={label}>Fahrstundenart</label><select id={id("kind")} name="lesson_kind" defaultValue={item?.lesson_kind ?? ""} className={field}><option value="">Keine Zuordnung</option>{Object.entries(LESSON_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
    </>
  );
}
