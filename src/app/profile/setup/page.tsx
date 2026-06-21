"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const localProfile = useLocalProfile();

  const [displayName, setDisplayName] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [victoryGifUrl, setVictoryGifUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (localProfile.ready) {
      if (localProfile.nickname && !displayName)
        setDisplayName(localProfile.nickname);
      if (localProfile.challengeMsg && !challengeMessage)
        setChallengeMessage(localProfile.challengeMsg);
      if (localProfile.giphyUrl && !victoryGifUrl)
        setVictoryGifUrl(localProfile.giphyUrl);
    }
  }, [
    localProfile.ready,
    localProfile.nickname,
    localProfile.challengeMsg,
    localProfile.giphyUrl,
    challengeMessage,
    displayName,
    victoryGifUrl,
  ]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Username is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          challengeMessage,
          victoryGifUrl,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "An error occurred");
      }

      // Profile created successfully, redirect to callbackUrl
      router.push(callbackUrl);
      router.refresh();
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-3xl font-black tracking-tight">
            Complete Your Profile
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Set your profile details to start the game.
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          className="bg-white/5 rounded-2xl p-5 flex flex-col gap-4 border border-white/10"
        >
          {error && (
            <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="displayName" className="text-white/80">
              Username
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your username"
              className="bg-white/10 border-white/20 text-white"
              maxLength={24}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="challengeMessage" className="text-white/80">
              Challenge Message (Optional)
            </Label>
            <Input
              id="challengeMessage"
              value={challengeMessage}
              onChange={(e) => setChallengeMessage(e.target.value)}
              placeholder="Message shown when you win"
              className="bg-white/10 border-white/20 text-white"
              maxLength={100}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="victoryGifUrl" className="text-white/80">
              Victory Giphy URL (Optional)
            </Label>
            <Input
              id="victoryGifUrl"
              value={victoryGifUrl}
              onChange={(e) => setVictoryGifUrl(e.target.value)}
              placeholder="https://media.giphy.com/.../giphy.gif"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting || !displayName.trim()}
            className="group bg-indigo-500 hover:bg-indigo-400 text-white font-semibold mt-2"
          >
            {submitting ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        {/* Offline Notifications */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col gap-3">
          <div className="flex flex-col">
            <h3 className="font-semibold">Challenge Notifications</h3>
            <p className="text-sm text-white/70">
              Never miss a challenge from opponents, even when the app is
              closed.
            </p>
          </div>
          <PushNotificationManager />
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-neutral-950 text-white flex items-center justify-center p-4">
          Loading...
        </div>
      }
    >
      <ProfileSetupContent />
    </Suspense>
  );
}
