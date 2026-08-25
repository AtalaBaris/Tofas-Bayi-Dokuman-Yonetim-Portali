/** Takvim/tarih yardımcıları — birden çok takvim bileşeni (docs-list-filters,
 * docs-schedule-calendar-page, docs-pool-calendar-panel, dashboard-schedule-calendar)
 * aynı yerel-saat tabanlı tarih hesabını paylaşır. Zaman dilimi/DST düzeltmeleri
 * tek yerde yapılabilsin diye burada toplandı. Her günü YYYY-MM-DD anahtarına
 * çevirirken kasıtlı olarak yerel saat kullanılır (UTC değil). */

/** Verilen tarihin ait olduğu ayın ilk günü (yerel saat, gün 1, saat 00:00). */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Tarihi yerel saate göre YYYY-MM-DD anahtarına çevirir. */
export function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** YYYY-MM-DD ISO metnini yerel Date'e çevirir; geçersizse null. */
export function parseIsoDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return null;
  }
  const [y, m, day] = iso.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}
