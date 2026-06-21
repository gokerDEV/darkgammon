import { Volume2, VolumeX, X } from "lucide-react";
import { Avatar, type ConnStatus } from "@/components/Avatar";

interface GameHeaderProps {
  whitePlayer: string;
  whiteAvatarUrl?: string;
  whiteStatus?: ConnStatus;
  blackPlayer?: string;
  blackAvatarUrl?: string;
  blackStatus?: ConnStatus;
  showControls?: boolean;
  onExit?: () => void;
  muted?: boolean;
  onToggleMute?: () => void;
}

export function GameHeader({
  whitePlayer,
  whiteAvatarUrl,
  whiteStatus = "connected",
  blackPlayer,
  blackAvatarUrl,
  blackStatus = "waiting",
  showControls = false,
  onExit,
  muted,
  onToggleMute,
}: GameHeaderProps) {
  return (
    <div className="flex flex-col shrink-0 w-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-2 shrink-0 h-8">
        <h1 className="text-xl font-bold tracking-tight">tavla.be</h1>
        {showControls && (
          <div className="flex items-center gap-1">
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
            )}
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center"
                aria-label="Exit"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Players */}
      <div className="flex justify-between items-center px-4 w-full mt-2">
        <div className="flex flex-col items-center">
          <div
            className="rounded-full p-3 border shadow-sm"
            style={{ backgroundColor: "rgb(251,249,244)" }}
          >
            <Avatar
              nickname={whitePlayer}
              avatarUrl={whiteAvatarUrl}
              tone="host"
              status={whiteStatus}
            />
          </div>
        </div>

        <div className="flex items-center justify-center font-bold w-full">
          <div className="uppercase text-[10px] tracking-wide w-1/2 text-center break-words">
            {whitePlayer}
          </div>
          <div className="text-[20px] text-muted-foreground w-12 text-center shrink-0">
            VS
          </div>
          <div className="uppercase text-[10px] tracking-wide w-1/2 text-center break-words">
            {blackPlayer ?? "BEKLENİYOR..."}
          </div>
        </div>

        <div className="flex flex-col items-center">
          {blackPlayer ? (
            <div
              className="rounded-full p-3 border shadow-sm aspect-square"
              style={{ backgroundColor: "rgb(37,37,37)" }}
            >
              <Avatar
                nickname={blackPlayer}
                avatarUrl={blackAvatarUrl}
                tone="player"
                status={blackStatus}
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted-foreground/40" />
          )}
        </div>
      </div>
    </div>
  );
}
