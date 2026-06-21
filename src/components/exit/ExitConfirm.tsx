import { Button } from "@/components/ui/button";
import { DARKGAMMON_COPY } from "@/lib/copy/darkgammon";
export function ExitConfirm({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6">
      <div className="bg-background rounded-xl p-5 w-full max-w-xs text-center shadow-2xl">
        <h3 className="text-lg font-semibold">
          {DARKGAMMON_COPY.battle.leavePromptTitle}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {DARKGAMMON_COPY.battle.leavePromptDesc}
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            {DARKGAMMON_COPY.battle.cancel}
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm}>
            {DARKGAMMON_COPY.battle.leave}
          </Button>
        </div>
      </div>
    </div>
  );
}
