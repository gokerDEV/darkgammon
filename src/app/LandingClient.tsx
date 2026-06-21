"use client";

import { Inbox, QrCode } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-4">
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
          <h2 className="text-xl font-bold text-white mb-2">
            Hoş geldin, {String(profile.displayName)}!
          </h2>

          <Button
            size="lg"
            disabled={creating}
            onClick={onCreate}
            className="group bg-indigo-500 hover:bg-indigo-400 text-white font-semibold"
          >
            {creating ? (
              "Oluşturuluyor…"
            ) : (
              <span className="flex items-center gap-1.5">
                Tavla beni
                <span className="inline-block transition-transform duration-300 ease-out group-hover:rotate-[60deg]">
                  =)
                </span>
              </span>
            )}
          </Button>

          <Link href="/profile" className="w-full">
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white border-none"
            >
              Profilim
            </Button>
          </Link>

          <Link href="/challenges" className="w-full">
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white border-none flex items-center justify-center gap-2"
            >
              <Inbox className="w-4 h-4 opacity-70" />
              Bekleyen İstekler
            </Button>
          </Link>

          <Link href="/qr" className="flex-1">
            <Button
              variant="outline"
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-lg shadow-black/20 h-12 text-base font-semibold"
            >
              <QrCode className="w-5 h-5 mr-2 opacity-70" />
              QR Kodum
            </Button>
          </Link>

          <div className="mt-4 border-t border-white/10 pt-4">
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full text-white/50 hover:text-white hover:bg-white/5"
            >
              Çıkış Yap
            </Button>
          </div>
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
    </div>
  );
}
