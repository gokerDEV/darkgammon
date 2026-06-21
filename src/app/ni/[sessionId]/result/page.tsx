"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { GameFrame } from "@/components/GameFrame";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { exportBackgammonVideo } from "@/components/video/BackgammonVideoExporter";
import { DARKGAMMON_COPY } from "@/lib/copy/darkgammon";
import type { BgSession, BgState, Color } from "@/lib/games/backgammon/types";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";

const LIGHT_VICTORY_MESSAGES = [
  "The Light held the board.",
  "The longest day is ours.",
  "Darkness retreats.",
];
const DARK_VICTORY_MESSAGES = [
  "Night has claimed the board.",
  "The Dark rises.",
  "The longest day ends here.",
];
const DEFEAT_MESSAGES = [
  "The balance will shift again.",
  "This battle is over. The war is not.",
  "I will return for the rematch.",
  "The dice favored your side.",
  "Enjoy the victory while it lasts.",
  "Next time, the board is mine.",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export default function ResultPage() {
  const params = useParams();
  const sessionId = decodeURIComponent((params.sessionId as string) || "");
  const { localUserId, ready } = useLocalProfile();
  const router = useRouter();
  const [session, setSession] = useState<BgSession | null>(null);
  const [snapshots, setSnapshots] = useState<BgState[]>([]);
  const [winnerMsg, setWinnerMsg] = useState("");
  const [loserMsg, setLoserMsg] = useState(() => pick(DEFEAT_MESSAGES));
  const [exporting, setExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || typeof window === "undefined" || !sessionId) return;

    let mounted = true;

    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.session) setSession(data.session);
      })
      .catch(console.error);

    fetch(`/api/sessions/${sessionId}/snapshots`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.snapshots) setSnapshots(data.snapshots);
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, [ready, sessionId]);

  useEffect(() => {
    if (session && !winnerMsg) {
      const color =
        session.host.localUserId === localUserId ? "white" : "black";
      setWinnerMsg(
        pick(
          color === "white" ? LIGHT_VICTORY_MESSAGES : DARK_VICTORY_MESSAGES,
        ),
      );
    }
  }, [session, localUserId, winnerMsg]);

  const myColor: Color | null = useMemo(() => {
    if (!session) return null;
    if (session.host.localUserId === localUserId)
      return session.hostSide === "light" ? "white" : "black";
    if (session.player?.localUserId === localUserId)
      return session.playerSide === "light" ? "white" : "black";
    return null;
  }, [session, localUserId]);

  async function onExport() {
    if (!session) return;
    setExporting(true);
    try {
      const { blob, ext } = await exportBackgammonVideo({
        session,
        snapshots: snapshots.length > 0 ? snapshots : [session.state],
        winnerMessage: winnerMsg,
        loserMessage: loserMsg,
      });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `darkgammon-${sessionId}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  if (!session) {
    return (
      <GameFrame>
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Loading result…
        </div>
      </GameFrame>
    );
  }

  const winner = session.state.winner;
  const outcome = !winner
    ? "pending"
    : myColor && winner === myColor
      ? "win"
      : "loss";
  const cube = session.state.cube.value;
  const reason = session.state.endReason;
  const isWinner = outcome === "win";
  const isLoser = outcome === "loss";

  return (
    <GameFrame>
      <div className="px-4 pt-3 pb-1 flex items-center justify-between shrink-0">
        <div className="text-sm font-semibold">
          <span className="font-bold uppercase tracking-widest">
            {DARKGAMMON_COPY.brand.name}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 items-center px-4 pt-2">
        <div className="flex flex-col items-center gap-1">
          <Avatar
            nickname={session.host.nickname || DARKGAMMON_COPY.inGame.guest}
            tone="host"
          />
          <span className="text-xs font-semibold truncate max-w-[100px]">
            {session.host.nickname || DARKGAMMON_COPY.inGame.guest}
          </span>
          <span className="text-[9px] uppercase text-muted-foreground">
            {session.hostSide === "dark" ? "DARK" : "LIGHT"}
          </span>
        </div>
        <div className="text-center text-muted-foreground text-sm font-bold">
          VS
        </div>
        <div className="flex flex-col items-center gap-1">
          <Avatar nickname={session.player?.nickname ?? "?"} tone="player" />
          <span className="text-xs font-semibold truncate max-w-[100px]">
            {session.player?.nickname ?? "—"}
          </span>
          <span className="text-[9px] uppercase text-muted-foreground">
            {session.playerSide === "light" ? "LIGHT" : "DARK"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-5 gap-3 text-center">
        <h1 className="text-3xl font-black uppercase">
          {outcome === "win"
            ? myColor === "white"
              ? DARKGAMMON_COPY.inGame.winnerLight
              : DARKGAMMON_COPY.inGame.winnerDark
            : outcome === "loss"
              ? DARKGAMMON_COPY.inGame.gameOverHeading
              : DARKGAMMON_COPY.inGame.gameOverHeading}
        </h1>
        {outcome !== "pending" && (
          <p className="text-sm font-semibold mb-1">
            {outcome === "win"
              ? myColor === "white"
                ? DARKGAMMON_COPY.inGame.winnerLightSub
                : DARKGAMMON_COPY.inGame.winnerDarkSub
              : DARKGAMMON_COPY.inGame.resultDefeatSub}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {reason === "resign"
            ? DARKGAMMON_COPY.inGame.reasonResignation
            : reason === "decline"
              ? DARKGAMMON_COPY.inGame.reasonDeclined
              : DARKGAMMON_COPY.inGame.reasonBearOff}
          {cube > 1 && ` · cube ${cube}×`}
        </p>

        <div className="grid grid-cols-2 gap-3 w-full text-xs">
          <div className="bg-muted rounded p-3">
            <div className="font-bold text-base">{session.state.off.white}</div>
            <div className="text-muted-foreground">
              {DARKGAMMON_COPY.sides.white} borne off
            </div>
          </div>
          <div className="bg-muted rounded p-3">
            <div className="font-bold text-base">{session.state.off.black}</div>
            <div className="text-muted-foreground">
              {DARKGAMMON_COPY.sides.black} borne off
            </div>
          </div>
        </div>

        {isWinner && (
          <div className="w-full flex flex-col gap-2 text-left">
            <Label htmlFor="msg">Victory message</Label>
            <Textarea
              id="msg"
              value={winnerMsg}
              maxLength={120}
              onChange={(e) => setWinnerMsg(e.target.value.slice(0, 120))}
              rows={2}
            />
          </div>
        )}
        {isLoser && (
          <div className="w-full flex flex-col gap-2 text-left">
            <Label htmlFor="msg">Celebrate message</Label>
            <Textarea
              id="msg"
              value={loserMsg}
              maxLength={120}
              onChange={(e) => setLoserMsg(e.target.value.slice(0, 120))}
              rows={2}
            />
          </div>
        )}

        <Button
          size="lg"
          className="w-full bg-amber-600 hover:bg-amber-500 text-white"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting
            ? DARKGAMMON_COPY.battle.videoForging
            : DARKGAMMON_COPY.battle.exportVideo}
        </Button>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`darkgammon-${sessionId}.mp4`}
            className="text-xs underline text-muted-foreground"
          >
            {DARKGAMMON_COPY.battle.downloadAgain}
          </a>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/")}
        >
          {DARKGAMMON_COPY.battle.returnHome}
        </Button>
      </div>

      {exporting && (
        <div className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center gap-4 text-white">
          <div className="h-12 w-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="font-medium">{DARKGAMMON_COPY.battle.videoForging}</p>
        </div>
      )}
    </GameFrame>
  );
}
