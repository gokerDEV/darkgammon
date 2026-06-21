"use client";

import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";
import { oppositeSide } from "@/lib/side";

type Profile = {
  _id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  side?: "light" | "dark";
};

type Challenge = {
  _id: string;
  createdAt: string;
  fromProfile?: Profile;
  toProfile?: Profile;
};

export default function ChallengesPage() {
  const [received, setReceived] = useState<Challenge[]>([]);
  const [sent, setSent] = useState<Challenge[]>([]);
  const [limits, setLimits] = useState({
    maxPendingSent: 50,
    maxPendingReceived: 50,
  });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();
  const { side: myLocalSide } = useLocalProfile();

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once
  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/challenges");
      const data = await res.json();
      if (res.ok) {
        setReceived(data.received || []);
        setSent(data.sent || []);
        setLimits(
          data.limits || { maxPendingSent: 50, maxPendingReceived: 50 },
        );
      } else {
        toast.error(data.error || "İstekler alınamadı");
      }
    } catch (_err) {
      toast.error("İstekler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    id: string,
    action: "accept" | "decline" | "cancel",
  ) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/challenges/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (res.ok) {
        if (action === "accept" && data.sessionId) {
          router.push(`/ni/${data.sessionId}`);
          return;
        } else if (action === "decline") {
          toast.success("İstek reddedildi");
          setReceived((prev) => prev.filter((c) => c._id !== id));
        } else if (action === "cancel") {
          toast.success("İstek iptal edildi");
          setSent((prev) => prev.filter((c) => c._id !== id));
        }
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (_err) {
      toast.error("Bir hata oluştu");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6 pt-4">
        <header className="flex items-center gap-4 relative">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-center flex-1 pr-10">
            Pending Challenges
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Gelen İstekler */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-bold">
                  Received Challenges
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {received.length} / {limits.maxPendingReceived}
                </span>
              </div>

              {received.length === 0 ? (
                <div className="bg-muted/50 rounded-2xl p-6 text-center text-muted-foreground text-sm border border-border">
                  No pending received challenges.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {received.map((c) => (
                    <div
                      key={c._id}
                      className="bg-card text-card-foreground shadow-sm border rounded-xl p-4 flex flex-col gap-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {c.fromProfile?.displayName || c.fromProfile?.handle}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm bg-muted/50 p-3 rounded-lg border">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your side:</span>
                          <span className="font-bold">
                            {oppositeSide(
                              c.fromProfile?.side || "light",
                            ).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Opponent:</span>
                          <span className="font-bold">
                            {(c.fromProfile?.side || "light").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-1 italic">
                          You fight against the{" "}
                          {(c.fromProfile?.side || "light") === "light"
                            ? "Light"
                            : "Dark"}
                          .
                        </p>
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          onClick={() => handleAction(c._id, "decline")}
                          disabled={processingId === c._id}
                          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                        >
                          Decline
                        </Button>
                        <Button
                          onClick={() => handleAction(c._id, "accept")}
                          disabled={processingId === c._id}
                          className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white"
                        >
                          {processingId === c._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Accept"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gönderilen İstekler */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-bold">
                  Sent Challenges
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {sent.length} / {limits.maxPendingSent}
                </span>
              </div>

              {sent.length === 0 ? (
                <div className="bg-muted/50 rounded-2xl p-6 text-center text-muted-foreground text-sm border border-border">
                  No pending sent challenges.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sent.map((c) => (
                    <div
                      key={c._id}
                      className="bg-card text-card-foreground shadow-sm border rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {c.toProfile?.displayName || c.toProfile?.handle}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-sm mt-3 w-full">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Your side:</span>
                          <span className="font-bold">
                            {(myLocalSide || "light").toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Opponent:</span>
                          <span className="font-bold">
                            {oppositeSide(myLocalSide || "light").toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(c._id, "cancel")}
                        disabled={processingId === c._id}
                        className="bg-muted hover:bg-muted/80 text-muted-foreground border-none"
                      >
                        {processingId === c._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Cancel"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
