/**
 * Idempotente Copy-then-Delete-Migration für localStorage-Keys.
 * Läuft beim Modul-Load der jeweiligen `storage.ts` — kopiert den Wert
 * unter altem Key (falls vorhanden und neuer Key noch leer) auf den neuen
 * Key und entfernt den alten. Mehrfacher Aufruf ist gefahrlos.
 */
export function migrateKey(oldKey: string, newKey: string): void {
  if (typeof window === "undefined") return;
  try {
    const oldValue = window.localStorage.getItem(oldKey);
    if (oldValue === null) return;
    if (window.localStorage.getItem(newKey) === null) {
      window.localStorage.setItem(newKey, oldValue);
    }
    window.localStorage.removeItem(oldKey);
  } catch {
    // localStorage nicht verfügbar (z. B. Privacy-Mode) — Migration überspringen
  }
}
