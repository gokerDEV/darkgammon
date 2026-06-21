"use client";

import { Check, Copy, Download } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdSlot } from "@/components/AdSlot";
import type { ConnStatus } from "@/components/Avatar";
import { BackgammonBoard } from "@/components/board/BackgammonBoard";
import { ExitConfirm } from "@/components/exit/ExitConfirm";
import { GameFrame } from "@/components/GameFrame";
import { GameHeader } from "@/components/GameHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WinnerProgressBar } from "@/components/WinnerProgressBar";
import {
  acceptDouble,
  advantage,
  applyMove,
  canOfferDouble as canOfferDoubleFn,
  declineDouble,
  endTurn,
  legalMoves,
  offerDouble,
  resign,
  rollDice,
} from "@/lib/games/backgammon/engine";
import type { BgSession, Color, Move } from "@/lib/games/backgammon/types";
import { colorOf } from "@/lib/games/backgammon/types";
import { relay } from "@/lib/games/tictactoe/session.functions";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";
import { useChannel } from "@/lib/realtime/usePusher";
import { isMuted, setMuted, sfx } from "@/lib/sound";

type Role = "host" | "player" | "spectator" | "open" | "full" | "missing";

export default function BgPage() {
  const params = useParams();
  const sessionId = decodeURIComponent((params.sessionId as string) || "");
  const router = useRouter();
  const {
    localUserId,
    nickname,
    setNickname,
    challengeMsg,
    setChallengeMsg,
    giphyUrl,
    setGiphyUrl,
    ready,
    profileId,
  } = useLocalProfile();
  const [draftName, setDraftName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (nickname && !draftName) {
      setDraftName(nickname);
    }
  }, [nickname, draftName]);
  const [session, setSession] = useState<BgSession | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [selected, setSelected] = useState<number | "bar" | null>(null);
  const [peerLastSeen, setPeerLastSeen] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const sessionRef = useRef<BgSession | null>(null);
  sessionRef.current = session;
  const prevPeerConnectedRef = useRef<boolean | null>(null);
  const prevDiceLenRef = useRef(0);

  useEffect(() => {
    if (!ready || typeof window === "undefined" || !sessionId) return;
    let mounted = true;
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.session) {
          setSession(data.session);
        }
        setLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [ready, sessionId]);

  const _hasSyncedRef = useRef(false);

  const isHost = useMemo(() => {
    if (!session) return false;
    return (
      (session.host.profileId && session.host.profileId === profileId) ||
      (session.host.userId && session.host.userId === localUserId) ||
      (session.host.localUserId && session.host.localUserId === localUserId)
    );
  }, [session, profileId, localUserId]);
  // Game Sync is now handled implicitly by API via PATCH /api/sessions/[sessionId]
  const role: Role = useMemo(() => {
    if (!loaded) return "missing";
    if (isHost) return "host";
    if (!session) return "open";
    if (
      (session.player?.profileId && session.player.profileId === profileId) ||
      (session.player?.userId && session.player.userId === localUserId) ||
      (session.player?.localUserId &&
        session.player.localUserId === localUserId)
    ) {
      return "player";
    }
    if (session.player) return "full";
    return "open";
  }, [loaded, isHost, session, localUserId, profileId]);

  const myColor: Color | null =
    role === "host" || role === "player"
      ? colorOf(role as "host" | "player")
      : null;

  const broadcast = useCallback(
    async (
      event:
        | "state:update"
        | "player:hello"
        | "challenge:msg"
        | "anim:emoji"
        | "peer:ping"
        | "peer:leave",
      // biome-ignore lint/suspicious/noExplicitAny: complex pusher payload
      payload: any,
    ) => {
      // In Phase 4, state:update is handled by the server when we call PATCH /api/sessions/[sessionId].
      // So we only broadcast other events manually here, or we can just let relay handle them.
      if (event === "state:update") return;

      try {
        await relay({
          data: { sessionId: String(sessionId), kind: "bg", event, payload },
        });
      } catch (err) {
        console.error("Relay error:", err);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  useChannel(
    loaded && sessionId
      ? `bg-${sessionId}`.replace(/[^a-zA-Z0-9_\-=@,.;]/g, "")
      : null,
    {
      "player:hello": (data) => {
        const hello = data as {
          localUserId: string;
          nickname: string;
          challengeMsg?: string;
          giphyUrl?: string;
          profileId?: string;
        };
        setPeerLastSeen(Date.now());
        // In Phase 4, server updates DB when player joins and broadcasts updated session.
        // So client just logs or shows a toast.
        toast.success(`${hello.nickname} katıldı`);
        sfx.join();
      },
      "state:update": (data) => {
        const payload = data as { session: BgSession; from?: string };
        if (payload.from && payload.from !== localUserId)
          setPeerLastSeen(Date.now());
        setSession((prev) => {
          if (prev && prev.updatedAt > payload.session.updatedAt) return prev;
          return payload.session;
        });
      },
      "peer:ping": (data) => {
        const p = data as { from: string; updatedAt?: string };
        if (p.from !== localUserId) {
          setPeerLastSeen(Date.now());
        }
      },
      "peer:leave": (data) => {
        const p = data as { from: string; nickname?: string };
        if (p.from === localUserId) return;
        setPeerLastSeen(null);
        if (p.nickname) toast.warning(`${p.nickname} bağlantıyı kesti`);
        sfx.leave();
      },
    },
  );

  const guestHelloSentRef = useRef(false);
  useEffect(() => {
    if (!loaded || isHost) return;
    if (!session && !guestHelloSentRef.current) {
      guestHelloSentRef.current = true;
      // guest:hello removed in phase 4 since DB holds session state
    }
  }, [loaded, isHost, session]);

  useEffect(() => {
    if (!loaded || !session?.player || session.status === "finished") return;
    const id = window.setInterval(() => {
      void broadcast("peer:ping", {
        from: localUserId,
        updatedAt: sessionRef.current?.updatedAt,
      });
    }, 5000);
    void broadcast("peer:ping", {
      from: localUserId,
      updatedAt: sessionRef.current?.updatedAt,
    });
    return () => window.clearInterval(id);
  }, [loaded, session?.player, session?.status, broadcast, localUserId]);

  useEffect(() => {
    if (!session?.player || session.status === "finished") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [session?.player, session?.status]);

  useEffect(() => {
    if (!loaded) return;
    const handler = () => {
      try {
        void broadcast("peer:leave", { from: localUserId, nickname });
      } catch {
        /* noop */
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loaded, broadcast, localUserId, nickname]);

  // Peer status + connect/disconnect/reconnect sounds
  const peerStatus: ConnStatus = useMemo(() => {
    if (!session?.player) return "waiting";
    if (peerLastSeen === null) return "disconnected";
    return now - peerLastSeen < 12000 ? "connected" : "disconnected";
  }, [session?.player, peerLastSeen, now]);

  useEffect(() => {
    if (!session?.player) return;
    const connected = peerStatus === "connected";
    if (prevPeerConnectedRef.current === null) {
      prevPeerConnectedRef.current = connected;
      return;
    }
    if (prevPeerConnectedRef.current && !connected) {
      sfx.disconnect();
      toast.warning("Bağlantı koptu");
    } else if (!prevPeerConnectedRef.current && connected) {
      sfx.reconnect();
      toast.success("Yeniden bağlanıldı");
    }
    prevPeerConnectedRef.current = connected;
  }, [peerStatus, session?.player]);

  // Dice roll sound (whenever dice count grows for the active player)
  useEffect(() => {
    const len = session?.state.dice.length ?? 0;
    if (len > prevDiceLenRef.current) sfx.dice();
    prevDiceLenRef.current = len;
  }, [session?.state.dice]);

  // Finish navigation
  useEffect(() => {
    if (session?.status !== "finished" || !session.state.winner || !sessionId)
      return;
    const mine = myColor && session.state.winner === myColor;
    if (mine) {
      sfx.win();
      toast.success("Kazandın!");
    } else {
      sfx.lose();
      toast.error("Kaybettin");
    }
    const t = window.setTimeout(() => {
      router.push(`/replay?s=${sessionId}`);
    }, 1400);
    return () => window.clearTimeout(t);
  }, [session?.status, session?.state.winner, myColor, sessionId, router]);

  const hostStatus: ConnStatus = isHost ? "connected" : peerStatus;
  const playerStatus: ConnStatus = !session?.player
    ? "waiting"
    : isHost
      ? peerStatus
      : "connected";

  function toggleMute() {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) sfx.notify();
  }

  const isMyTurn = useMemo(() => {
    if (!session || !myColor) return false;
    if (session.status === "finished") return false;
    return session.state.turn === myColor;
  }, [session, myColor]);

  const canOffer =
    !!session &&
    !!myColor &&
    canOfferDoubleFn(session.state, myColor) &&
    !!session.player;
  const adv = useMemo(
    () => (session ? advantage(session.state) : 0.5),
    [session],
  );

  const pushState = useCallback(
    (next: BgSession) => {
      const currentMs = Date.now();
      const prevMs = new Date(sessionRef.current?.updatedAt || 0).getTime();
      const nextMs = Math.max(currentMs, prevMs + 1);
      const finalNext = { ...next, updatedAt: new Date(nextMs).toISOString() };
      setSession(finalNext);

      // Update DB Session (Triggers state:update pusher event automatically on server)
      fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: finalNext.state,
          status: finalNext.status,
          finishedAt: finalNext.finishedAt,
        }),
      }).catch(console.error);

      // Append Snapshot to DB
      fetch(`/api/sessions/${sessionId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: finalNext.state }),
      }).catch(console.error);
    },
    [sessionId],
  );

  function handleRoll(isCheat?: boolean) {
    if (!session || !myColor) return;
    if (!isMyTurn || session.state.rolled || session.state.pendingDouble)
      return;
    const ns = rollDice(session.state, isCheat);
    pushState({ ...session, state: ns, updatedAt: new Date().toISOString() });
  }

  function handleApply(mv: Move) {
    if (!session || !myColor || !isMyTurn) return;
    sfx.move();
    let ns = applyMove(session.state, myColor, mv);
    // auto-end turn if no remaining legal moves and dice consumed
    if (!ns.winner && ns.dice.length === 0) {
      ns = endTurn(ns);
    } else if (!ns.winner && legalMoves(ns, myColor).length === 0) {
      // no more usable dice — auto-end
      ns = endTurn(ns);
    }
    const nowIso = new Date().toISOString();
    const next: BgSession = { ...session, state: ns, updatedAt: nowIso };
    if (ns.winner) {
      next.status = "finished";
      next.finishedAt = nowIso;
    }
    pushState(next);
  }

  function handleEndTurn() {
    if (!session || !myColor || !isMyTurn || !session.state.rolled) return;
    if (legalMoves(session.state, myColor).length > 0) return;
    const ns = endTurn(session.state);
    pushState({ ...session, state: ns, updatedAt: new Date().toISOString() });
  }

  function handleOfferDouble() {
    if (!session || !myColor || !canOffer) return;
    const ns = offerDouble(session.state, myColor);
    pushState({ ...session, state: ns, updatedAt: new Date().toISOString() });
  }

  function handleAcceptDouble() {
    if (!session) return;
    const ns = acceptDouble(session.state);
    pushState({ ...session, state: ns, updatedAt: new Date().toISOString() });
  }

  function handleDeclineDouble() {
    if (!session) return;
    const ns = declineDouble(session.state);
    const nowIso = new Date().toISOString();
    pushState({
      ...session,
      state: ns,
      status: ns.winner ? "finished" : session.status,
      finishedAt: ns.winner ? nowIso : session.finishedAt,
      updatedAt: nowIso,
    });
  }

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ni/${encodeURIComponent(sessionId).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)}`
      : "";

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      sfx.copy();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  function onConfirmExit() {
    setExitOpen(false);
    if (!session || !myColor || session.status === "finished") {
      router.push("/");
      return;
    }
    const ns = resign(session.state, myColor);
    const nowIso = new Date().toISOString();
    pushState({
      ...session,
      state: ns,
      status: "finished",
      finishedAt: nowIso,
      updatedAt: nowIso,
    });
  }

  if (!ready || !loaded) return <CenterMessage>Yükleniyor…</CenterMessage>;

  if (!isHost && !session) return <CenterMessage>Oda aranıyor…</CenterMessage>;

  if (role === "open" && !isHost) {
    return (
      <GameFrame>
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 w-full max-w-sm mx-auto">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Maça katıl</h2>
            {session && (
              <p className="text-muted-foreground text-sm mt-1">
                <span className="font-semibold text-foreground">
                  {session.host.nickname}
                </span>{" "}
                seni tavla oynamaya davet etti!
              </p>
            )}
          </div>

          <div className="bg-muted/30 rounded-2xl p-5 flex flex-col gap-4 border border-border w-full">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nick">Kullanıcı Adı</Label>
              <Input
                id="nick"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={24}
                placeholder="Kullanıcı adınız"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="challengeMsg">Meydan Okuma Mesajı</Label>
              <Input
                id="challengeMsg"
                value={challengeMsg}
                onChange={(e) => setChallengeMsg(e.target.value)}
                placeholder="Kazandığında gösterilecek mesaj"
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="giphyUrl">Zafer Giphy URL'si</Label>
              <Input
                id="giphyUrl"
                value={giphyUrl}
                onChange={(e) => setGiphyUrl(e.target.value)}
                placeholder="https://media.giphy.com/.../giphy.gif"
              />
            </div>
          </div>
          <Button
            size="lg"
            disabled={!draftName.trim() || isJoining}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold"
            onClick={async () => {
              setNickname(draftName);
              setIsJoining(true);
              try {
                const res = await fetch(`/api/sessions/${sessionId}/join`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    localUserId,
                    nickname: draftName,
                    challengeMsg,
                    giphyUrl,
                    profileId,
                  }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Katılamadı");
                // State will be updated via Pusher state:update
              } catch (e) {
                const err = e as Error;
                toast.error(err.message || "Hata oluştu");
                setIsJoining(false);
              }
            }}
          >
            {isJoining ? "Bağlanıyor..." : "Maça Katıl"}
          </Button>
          <div className="mt-4 w-full flex justify-center">
            {/* 300x300 Large Square Ad */}
            <AdSlot
              className="w-[300px] h-[300px]"
              label="Büyük Kare Reklam (300x300)"
            />
          </div>
        </div>
      </GameFrame>
    );
  }

  if (role === "full") {
    return (
      <GameFrame>
        <GameHeader
          whitePlayer={
            session?.host.nickname || session?.host.displayName || "Host"
          }
          whiteAvatarUrl={session?.host.avatarUrl}
          whiteStatus="connected"
          blackPlayer={
            session?.player?.nickname ||
            session?.player?.displayName ||
            "Player"
          }
          blackAvatarUrl={session?.player?.avatarUrl}
          blackStatus="connected"
          onExit={() => router.push("/")}
        />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-xl font-semibold">Oyun zaten devam ediyor</h2>
          {session && (
            <p className="text-muted-foreground text-sm">
              {session.host.nickname} vs {session.player?.nickname ?? "—"}
            </p>
          )}
          <Button onClick={() => router.push("/")}>Kendi maçını başlat</Button>
        </div>
      </GameFrame>
    );
  }

  if (!session) return <CenterMessage>Yükleniyor…</CenterMessage>;

  const waiting = !session.player;
  const opponentOfferedToMe =
    session.state.pendingDouble &&
    myColor &&
    session.state.pendingDouble !== myColor;

  return (
    <GameFrame>
      <GameHeader
        whitePlayer={
          session.host.nickname || session.host.displayName || "Misafir"
        }
        whiteAvatarUrl={session.host.avatarUrl}
        whiteStatus={hostStatus}
        blackPlayer={
          session.player?.nickname || session.player?.displayName || "Misafir"
        }
        blackAvatarUrl={session.player?.avatarUrl}
        blackStatus={playerStatus}
        showControls={true}
        onExit={() => setExitOpen(true)}
        muted={muted}
        onToggleMute={toggleMute}
      />

      <div className="mt-1 mx-4 h-4 p-1 bg-muted rounded-full">
        <WinnerProgressBar advantage={adv} />
      </div>
      <div className="mt-1 mx-4 h-4 p-1">
        {/* TODO: Timer for  time based playing */}
        {/* <TimerProgressBar /> */}
      </div>

      <div className="flex-1 flex flex-col items-center justify-start px-2 py-4 overflow-hidden">
        {waiting && isHost ? (
          <div className="w-full max-w-sm flex flex-col gap-3 items-center px-4 mt-6">
            <p className="text-sm text-muted-foreground text-center">
              Arkadaşını davet etmek için bu bağlantıyı paylaş
            </p>
            <div className="w-full flex gap-2">
              <Input readOnly value={inviteUrl} className="text-xs" />
              <Button
                onClick={onCopy}
                size="icon"
                variant="outline"
                aria-label="Copy invite"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Bu sekmeyi açık tut — kapatırsan maç biter.
            </p>

            <div className="mt-4 w-full flex justify-center">
              {/* 336x280 Large Rectangle Ad */}
              <AdSlot
                className="w-[336px] h-[280px]"
                label="Büyük Dikdörtgen (336x280)"
              />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl mx-auto px-2">
            <BackgammonBoard
              state={session.state}
              myColor={myColor}
              selected={selected}
              onSelect={setSelected}
              onApply={handleApply}
              onRoll={handleRoll}
              onEndTurn={handleEndTurn}
              onOfferDouble={handleOfferDouble}
              isMyTurn={isMyTurn}
              canOffer={canOffer}
            />
          </div>
        )}
        {!waiting && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-xs text-muted-foreground text-center">
              {session.status === "finished"
                ? "Oyun bitti"
                : isMyTurn
                  ? session.state.rolled
                    ? "Senin sıran — oyna"
                    : "Senin sıran — zar at veya katla"
                  : "Rakibin sırası"}
            </p>
            {session.status === "finished" && (
              <Button
                onClick={() => router.push(`/replay?s=${sessionId}`)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-2 rounded-full shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" /> Tekrar Videosunu İndir
              </Button>
            )}
          </div>
        )}
      </div>

      {!waiting && (
        <div className="px-4 pb-3 mt-auto w-full shrink-0">
          <AdSlot className="w-full h-14" />
        </div>
      )}

      {opponentOfferedToMe && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6">
          <div className="bg-background rounded-xl p-5 w-full max-w-xs text-center shadow-2xl">
            <h3 className="text-lg font-semibold">Katlama teklif edildi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Rakip bahsi {session.state.cube.value * 2} katına çıkardı. Kabul
              et veya {session.state.cube.value} kaybederek pes et?
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDeclineDouble}
              >
                Reddet (Kaybet)
              </Button>
              <Button className="flex-1" onClick={handleAcceptDouble}>
                Kabul Et
              </Button>
            </div>
          </div>
        </div>
      )}

      <ExitConfirm
        open={exitOpen}
        onCancel={() => setExitOpen(false)}
        onConfirm={onConfirmExit}
      />
    </GameFrame>
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <GameFrame>
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-lg font-medium">{children}</p>
        <Button onClick={() => router.push("/")} variant="outline">
          Ana Sayfaya Dön
        </Button>

        <div className="mt-6 w-full flex justify-center">
          <AdSlot
            className="w-[336px] h-[280px]"
            label="Büyük Dikdörtgen (336x280)"
          />
        </div>
      </div>
    </GameFrame>
  );
}
