"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { SideSelector } from "@/components/side/SideSelector";
import { Button } from "@/components/ui/button";
import { DARKGAMMON_COPY } from "@/lib/copy/darkgammon";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";
import type { PlayerSide } from "@/lib/side";

function LandingAuthContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const { setSide } = useLocalProfile();
  const [selectedSide, setSelectedSide] = useState<PlayerSide | undefined>();

  const handleSideChange = (side: PlayerSide) => {
    setSelectedSide(side);
    setSide(side);
  };

  return (
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
        <p className="font-medium">Choose Your Side</p>

        <SideSelector
          value={selectedSide as PlayerSide}
          onChange={handleSideChange}
        />

        <div className="flex flex-col gap-2 mt-4">
          <Button
            size="lg"
            disabled={!selectedSide}
            onClick={() => signIn("google", { callbackUrl })}
            className="bg-foreground text-background hover:bg-foreground/90 font-semibold"
          >
            Sign in with Google
          </Button>

          <Button
            size="lg"
            disabled={!selectedSide}
            onClick={() => signIn("apple", { callbackUrl })}
            className="bg-foreground text-background hover:bg-foreground/90 font-semibold"
          >
            Sign in with Apple
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
  );
}

export default function LandingAuth() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LandingAuthContent />
      </Suspense>
    </div>
  );
}
