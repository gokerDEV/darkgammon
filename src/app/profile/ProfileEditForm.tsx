"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { SideSelector } from "@/components/side/SideSelector";
import { Button } from "@/components/ui/button";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";
import type { PlayerSide } from "@/lib/side";

interface Profile {
  _id: string;
  handle: string;
  displayName: string;
  challengeMessage: string;
  victoryGifUrl: string;
  side: string;
}

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [handle, setHandle] = useState(profile.handle);
  const [challengeMessage, setChallengeMessage] = useState(
    profile.challengeMessage,
  );
  const [victoryGifUrl, setVictoryGifUrl] = useState(profile.victoryGifUrl);
  const [side, setSide] = useState<PlayerSide>(
    (profile.side as PlayerSide) || "light",
  );
  const [loading, setLoading] = useState(false);
  const { setSide: setLocalSide } = useLocalProfile();

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
          side,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Güncelleme başarısız");
      }

      setLocalSide(side);

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
      <div className="flex justify-between items-center bg-card text-card-foreground shadow-sm rounded-2xl p-6 border">
        <div className="flex flex-col">
          <h3 className="font-bold">Public Profile</h3>
          <p className="text-sm text-muted-foreground">
            Your public profile page where challengers will see you.
          </p>
        </div>
        <Link href={`/ni/@${profile.handle}`}>
          <Button variant="outline">
            View
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-4 bg-card text-card-foreground shadow-sm rounded-2xl p-6 border">
          <h2 className="text-xl font-bold mb-2">Profile Details</h2>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">
              Choose Your Side
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              Your side defines your theme and the side you command when
              creating battles.
            </p>
            <SideSelector 
              value={side} 
              onChange={(s) => {
                setSide(s);
                setLocalSide(s);
                fetch("/api/profile", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    displayName,
                    handle,
                    challengeMessage,
                    victoryGifUrl,
                    side: s,
                  }),
                }).catch(() => {});
              }} 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="displayName"
              className="text-sm font-medium"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={30}
              className="bg-background border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="handle"
              className="text-sm font-medium"
            >
              Username (Handle)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-muted-foreground">@</span>
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
                className="bg-background border rounded-lg pl-8 pr-4 py-2 outline-none focus:ring-2 focus:ring-ring transition-colors w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Only lowercase letters, numbers, hyphens (-), and underscores (_)
              are allowed.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="challengeMessage"
              className="text-sm font-medium"
            >
              Challenge Message
            </label>
            <input
              id="challengeMessage"
              type="text"
              value={challengeMessage}
              onChange={(e) => setChallengeMessage(e.target.value)}
              maxLength={100}
              className="bg-background border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="victoryGiphyUrl"
              className="text-sm font-medium"
            >
              Victory Giphy URL
            </label>
            <input
              id="victoryGiphyUrl"
              type="url"
              value={victoryGifUrl}
              onChange={(e) => setVictoryGifUrl(e.target.value)}
              placeholder="https://giphy.com/..."
              className="bg-background border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-4"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="flex justify-between items-center bg-card text-card-foreground shadow-sm rounded-2xl p-6 border">
          <div className="flex flex-col">
            <h3 className="font-bold">QR Code</h3>
            <p className="text-sm text-muted-foreground">
              View and manage your Battle QR code.
            </p>
          </div>
          <Link href="/qr">
            <Button variant="outline">
              Go to QR Page
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
