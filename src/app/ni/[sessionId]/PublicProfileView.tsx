"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/Avatar";
import { GameFrame } from "@/components/GameFrame";
import { Button } from "@/components/ui/button";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";

interface PublicProfile {
  _id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
  challengeMessage: string;
  qrToken: string;
  // biome-ignore lint/suspicious/noExplicitAny: Complex structure
  lastGames?: any[];
  stats?: {
    light: { total: number; wins: number; losses: number };
    dark: { total: number; wins: number; losses: number };
  };
}

export function PublicProfileView({
  handle,
  qrToken,
}: {
  handle?: string;
  qrToken?: string;
}) {
  const router = useRouter();
  const { ready, profileId } = useLocalProfile();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const url = handle ? `/api/profile/${handle}` : `/api/qr/${qrToken}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Profil bulunamadı");
        }
        const data = await res.json();
        setProfile(data);
      } catch (e) {
        const err = e as Error;
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [handle, qrToken]);

  const handleChallenge = async () => {
    if (!profileId) {
      toast.error("Önce giriş yapmalısınız");
      router.push(
        `/?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    if (profile?._id === profileId) {
      toast.error("Kendinize meydan okuyamazsınız");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toProfileId: profile?._id,
          gameKind: "backgammon",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "İstek gönderilemedi");
      }
      toast.success("Meydan okuma gönderildi!");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!ready || loading) {
    return (
      <GameFrame>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p>Loading...</p>
        </div>
      </GameFrame>
    );
  }

  if (error || !profile) {
    return (
      <GameFrame>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Return to Home
          </Button>
        </div>
      </GameFrame>
    );
  }

  return (
    <GameFrame>
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6 w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center gap-3 text-center">
          <Avatar nickname={profile.displayName} size="lg" />
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-muted-foreground">@{profile.handle}</p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-full p-5 w-full border border-border text-center">
          <p className="italic text-sm font-bold">
            "{profile.challengeMessage || "Ready for a battle?"}"
          </p>
        </div>

        <Button
          size="lg"
          onClick={handleChallenge}
          disabled={sending}
          className="group w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-lg py-6 shadow-lg shadow-indigo-500/20"
        >
          {sending ? (
            "Sending..."
          ) : (
            <span className="flex items-center justify-center gap-1">
              <span>Challenge</span>
              <span className="inline-block rotate-[60deg] transition-transform group-hover:animate-[shake-smile_0.3s_ease-in-out_infinite]">
                =)
              </span>
            </span>
          )}
        </Button>

        {profile.stats &&
          (profile.stats.light.total > 0 || profile.stats.dark.total > 0) && (
            <div className="w-full mt-4 flex flex-col gap-3 text-sm">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-left">
                Battle Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center">
                  <span className="font-bold text-white mb-1">LIGHT</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.stats.light.total} Battles
                  </span>
                  <span className="text-xs text-green-400 font-medium">
                    {profile.stats.light.wins} W / {profile.stats.light.losses}{" "}
                    L
                  </span>
                </div>
                <div className="bg-black/20 border border-white/5 rounded-xl p-3 flex flex-col items-center">
                  <span className="font-bold text-neutral-400 mb-1">DARK</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.stats.dark.total} Battles
                  </span>
                  <span className="text-xs text-green-400 font-medium">
                    {profile.stats.dark.wins} W / {profile.stats.dark.losses} L
                  </span>
                </div>
              </div>
            </div>
          )}

        {profile.lastGames && profile.lastGames.length > 0 && (
          <div className="w-full mt-4 flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-left">
              Recent Battles
            </h3>
            {/* biome-ignore lint/suspicious/noExplicitAny: complex type */}
            {profile.lastGames.map((game: any) => {
              const isHost = game.host?.profileId === profile._id;
              const opponent = isHost ? game.player : game.host;

              const mySide = isHost
                ? game.hostSide || "light"
                : game.playerSide || "light";
              const myColor = isHost
                ? mySide === "light"
                  ? "white"
                  : "black"
                : mySide === "light"
                  ? "white"
                  : "black";

              const isWinner = game.state?.winner === myColor;

              if (!opponent) return null;

              const myNickname = profile.displayName || profile.handle;
              const opNickname = opponent.nickname || opponent.displayName;
              const mySmile = isWinner ? "=)" : "=(";
              const opSmile = isWinner ? "=(" : "=)";
              const myColorText = isWinner ? "text-green-500" : "text-red-500";
              const opColorText = isWinner ? "text-red-500" : "text-green-500";

              const myRingColor =
                mySide === "light" ? "border-white" : "border-black/50";
              const opRingColor =
                mySide === "light" ? "border-black/50" : "border-white";

              const myCount =
                myColor === "white"
                  ? game.state?.off?.white || 0
                  : game.state?.off?.black || 0;
              const opCount =
                myColor === "white"
                  ? game.state?.off?.black || 0
                  : game.state?.off?.white || 0;

              return (
                <div
                  key={game._id}
                  className="flex items-center justify-between bg-muted/20 p-3 rounded-full border border-border w-full"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-between">
                    <div
                      className={`rounded-full border-[4px] ${myRingColor} shadow shrink-0`}
                    >
                      <Avatar
                        nickname={myNickname}
                        avatarUrl={profile.avatarUrl}
                        size="sm"
                      />
                    </div>
                    <div className="flex flex-col truncate grow">
                      <span className="text-sm font-medium truncate">
                        {myNickname}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {myCount}
                      </span>
                    </div>
                    <span
                      className={`inline-block rotate-[60deg] font-bold ${myColorText} ml-1 shrink-0`}
                    >
                      {mySmile}
                    </span>
                  </div>

                  <span className="text-muted-foreground text-[10px] uppercase tracking-wider mx-2 font-bold shrink-0">
                    vs
                  </span>

                  <div className="flex items-center gap-2 flex-1 justify-between min-w-0">
                    <span
                      className={`inline-block rotate-[60deg] font-bold ${opColorText} mr-1 shrink-0`}
                    >
                      {opSmile}
                    </span>
                    <div className="flex flex-col items-end truncate grow">
                      <span className="text-sm font-medium truncate">
                        {opNickname}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {opCount}
                      </span>
                    </div>
                    <div
                      className={`rounded-full border-[4px] ${opRingColor} shadow shrink-0`}
                    >
                      <Avatar
                        nickname={opNickname}
                        avatarUrl={opponent.avatarUrl}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </GameFrame>
  );
}
