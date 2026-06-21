"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DARKGAMMON_COPY } from "@/lib/copy/darkgammon";

function LandingAuthContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight uppercase tracking-widest">
          {DARKGAMMON_COPY.brand.name}
        </h1>
        <p className="mt-2 text-lg text-white/70 font-medium group cursor-default w-fit mx-auto">
          {DARKGAMMON_COPY.brand.supportCopy}
        </p>
      </header>

      <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-4 border border-white/10 text-center">
        <p className="text-white/80 mb-2">Sign in to join the battle</p>

        <Button
          size="lg"
          onClick={() => signIn("google", { callbackUrl })}
          className="bg-white text-black hover:bg-neutral-200 font-semibold"
        >
          Sign in with Google
        </Button>

        <Button
          size="lg"
          onClick={() => signIn("apple", { callbackUrl })}
          className="bg-black text-white border border-white/20 hover:bg-neutral-900 font-semibold"
        >
          Sign in with Apple
        </Button>
      </div>

      <p className="text-center text-white/60 mt-4">
        Beta version. If you have feedback, reach out to{" "}
        <a
          href="https://x.com/gokerDEV/status/2063674093052813493"
          className="underline hover:text-white"
        >
          @gokerDEV
        </a>
      </p>
    </div>
  );
}

export default function LandingAuth() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <LandingAuthContent />
      </Suspense>
    </div>
  );
}
