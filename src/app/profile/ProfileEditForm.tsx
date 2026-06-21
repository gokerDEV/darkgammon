"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Profile {
  _id: string;
  handle: string;
  displayName: string;
  challengeMessage: string;
  victoryGifUrl: string;
}

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [challengeMessage, setChallengeMessage] = useState(
    profile.challengeMessage,
  );
  const [victoryGifUrl, setVictoryGifUrl] = useState(profile.victoryGifUrl);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          handle,
          challengeMessage,
          victoryGifUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Güncelleme başarısız");
      }

      toast.success("Profilin başarıyla güncellendi!");
      router.refresh();
    } catch (e) {
      const error = e as Error;
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col">
          <h3 className="font-bold text-white">Public Profilin</h3>
          <p className="text-sm text-white/50">
            İnsanların seni göreceği genel profil sayfası.
          </p>
        </div>
        <Link href={`/u/${profile.handle}`}>
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Görüntüle
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-4 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">
            Profil Bilgileri
          </h2>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="displayName"
              className="text-sm font-medium text-white/70"
            >
              Görünen İsim
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={30}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="handle"
              className="text-sm font-medium text-white/70"
            >
              Kullanıcı Adı (Handle)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-white/50">@</span>
              <input
                id="handle"
                type="text"
                value={handle}
                onChange={(e) =>
                  setHandle(
                    e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ""),
                  )
                }
                required
                maxLength={20}
                className="bg-black/50 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors w-full"
              />
            </div>
            <p className="text-xs text-white/40">
              Sadece küçük harf, rakam, tire (-) ve alt tire (_)
              kullanabilirsiniz.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="challengeMessage"
              className="text-sm font-medium text-white/70"
            >
              Meydan Okuma Mesajı
            </label>
            <input
              id="challengeMessage"
              type="text"
              value={challengeMessage}
              onChange={(e) => setChallengeMessage(e.target.value)}
              maxLength={100}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="victoryGiphyUrl"
              className="text-sm font-medium text-white/70"
            >
              Zafer Giphy URL
            </label>
            <input
              id="victoryGiphyUrl"
              type="url"
              value={victoryGifUrl}
              onChange={(e) => setVictoryGifUrl(e.target.value)}
              placeholder="https://giphy.com/..."
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            {loading ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>

        <div className="flex justify-between items-center bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex flex-col">
            <h3 className="font-bold text-white">QR Kod</h3>
            <p className="text-sm text-white/50">
              Davet QR kodunu görüntüle ve yönet.
            </p>
          </div>
          <Link href="/qr">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              QR Sayfasına Git
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
