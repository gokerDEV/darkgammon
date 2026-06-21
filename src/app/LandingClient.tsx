"use client";

import { Inbox, QrCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DARKGAMMON_COPY } from "@/lib/copy/darkgammon";

export default function LandingClient({
  profile,
}: {
  profile: Record<string, unknown>;
}) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  function onCreate() {
    setCreating(true);
    fetch("/api/sessions", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.sessionId) {
          router.push(`/ni/${data.sessionId}`);
        } else {
          console.error("Failed to create session:", data);
          setCreating(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setCreating(false);
      });
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-4xl font-black tracking-tight uppercase tracking-widest">
            {DARKGAMMON_COPY.brand.name}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground font-medium group cursor-default w-fit mx-auto">
            {DARKGAMMON_COPY.brand.supportCopy}
          </p>
        </header>

        <div className="bg-card text-card-foreground shadow-sm rounded-2xl p-5 flex flex-col gap-4 border text-center">
          <h2 className="text-xl font-bold mb-2">
            Welcome, {String(profile.displayName)}!
          </h2>

          <Button
            size="lg"
            disabled={creating}
            onClick={onCreate}
            className="group font-semibold"
          >
            {creating ? (
              "Creating..."
            ) : (
              <span className="flex items-center gap-1.5">
                {DARKGAMMON_COPY.battle.create}
              </span>
            )}
          </Button>

          <Link href="/profile" className="w-full">
            <Button
              variant="outline"
              className="w-full border-none shadow-none bg-muted hover:bg-muted/80 text-muted-foreground"
            >
              Profile
            </Button>
          </Link>

          <Link href="/challenges" className="w-full">
            <Button
              variant="outline"
              className="w-full border-none shadow-none bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center gap-2"
            >
              <Inbox className="w-4 h-4 opacity-70" />
              Pending Challenges
            </Button>
          </Link>

          <Link href="/qr" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-muted hover:bg-muted/80 text-muted-foreground border-none h-12 text-base font-semibold shadow-sm"
            >
              <QrCode className="w-5 h-5 mr-2 opacity-70" />
              My QR Code
            </Button>
          </Link>

          <div className="mt-4 border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Sign Out
            </Button>
          </div>
        </div>

        <p className="text-center text-muted-foreground mt-4">
          Beta version. If you have feedback, reach out to{" "}
          <a
            href="https://x.com/gokerDEV/status/2063674093052813493"
            className="underline hover:text-foreground"
          >
            @gokerDEV
          </a>
        </p>
      </div>
    </div>
  );
}
