import { actionBtn, subtleBtn, turnierCard } from "@/components/turnier/styles";

type PauseOverlayProps = {
  onResume: () => void;
};

export function PauseOverlay({ onResume }: PauseOverlayProps) {
  return (
    <div className={`${turnierCard} flex flex-col gap-4`}>
      <h3 className="text-lg font-black tracking-tight">Turnier pausiert</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Spieler können jetzt hinzugefügt, entfernt oder reaktiviert werden. Nach dem Fortsetzen
        wird die nächste Auslosung erneut fair berechnet.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className={subtleBtn}>Pause-Modus aktiv</span>
        <button type="button" onClick={onResume} className={actionBtn}>
          Turnier fortsetzen
        </button>
      </div>
    </div>
  );
}
