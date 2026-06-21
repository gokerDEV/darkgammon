"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";

function LandingAuthContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight">tavla.be</h1>
        <p className="mt-2 text-lg text-white/70 font-medium group cursor-default w-fit mx-auto">
          <span className="mr-1">Tavla beni </span>
          <span className="inline-block rotate-[60deg] transition-transform group-hover:animate-[shake-smile_0.3s_ease-in-out_infinite]">
            =)
          </span>
        </p>
      </header>

      <div className="bg-white/5 rounded-2xl p-5 flex flex-col gap-4 border border-white/10 text-center">
        <p className="text-white/80 mb-2">Oyuna başlamak için giriş yapın</p>

        <Button
          size="lg"
          onClick={() => signIn("google", { callbackUrl })}
          className="bg-white text-black hover:bg-neutral-200 font-semibold"
        >
          Google ile Giriş Yap
        </Button>

        <Button
          size="lg"
          onClick={() => signIn("apple", { callbackUrl })}
          className="bg-black text-white border border-white/20 hover:bg-neutral-900 font-semibold"
        >
          Apple ile Giriş Yap
        </Button>
      </div>

      <p className="text-center text-white/60 mt-4">
        Proje test aşamasında, sorun yaşarsanız ya da önerileriniz varsa{" "}
        <a
          href="https://x.com/gokerDEV/status/2063674093052813493"
          className="underline hover:text-white"
        >
          @gokerDEV
        </a>{" "}
        üzerinden bana ulaşın!
      </p>
    </div>
  );
}

export default function LandingAuth() {
  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-4">
      <Suspense fallback={<div>Yükleniyor...</div>}>
        <LandingAuthContent />
      </Suspense>
    </div>
  );
}
