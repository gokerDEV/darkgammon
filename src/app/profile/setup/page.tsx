"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { SideSelector } from "@/components/side/SideSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";
import type { PlayerSide } from "@/lib/side";

function ProfileSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const localProfile = useLocalProfile();

  const [displayName, setDisplayName] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [victoryGifUrl, setVictoryGifUrl] = useState("");
  const [side, setSide] = useState<PlayerSide>("light");
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
      if (localProfile.side) setSide(localProfile.side as PlayerSide);
    }
  }, [
    localProfile.ready,
    localProfile.nickname,
    localProfile.challengeMsg,
    localProfile.giphyUrl,
    challengeMessage,
    displayName,
    victoryGifUrl,
    localProfile.side,
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
          side,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "An error occurred");
      }

      localProfile.setSide(side);

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
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card text-card-foreground shadow-sm border rounded-2xl p-6">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your identity before entering the battlefield.
          </p>
        </header>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-foreground">Choose Your Side</Label>
            <p className="text-xs text-muted-foreground mb-1">
              Your side defines your theme and the side you command when
              creating battles.
            </p>
            <SideSelector value={side} onChange={setSide} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-foreground">
              Display Name
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Commander Shepard"
              className="bg-background border-border text-foreground"
              maxLength={24}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="challengeMessage" className="text-foreground">
              Challenge Message
            </Label>
            <Input
              id="challengeMessage"
              value={challengeMessage}
              onChange={(e) => setChallengeMessage(e.target.value)}
              placeholder="e.g. Prepare to be crushed!"
              className="bg-background border-border text-foreground"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="victoryGifUrl" className="text-foreground">
              Victory GIF URL
            </Label>
            <Input
              id="victoryGifUrl"
              value={victoryGifUrl}
              onChange={(e) => setVictoryGifUrl(e.target.value)}
              placeholder="https://media.giphy.com/.../giphy.gif"
              className="bg-background border-border text-foreground"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting || !displayName.trim()}
            className="w-full mt-2"
          >
            {submitting ? "Saving..." : "Save Profile"}
          </Button>
        </form>

        {/* Offline Notifications */}
        <div className="mt-6 border-t pt-6 flex flex-col gap-3">
          <div className="flex flex-col">
            <h3 className="font-semibold">Challenge Notifications</h3>
            <p className="text-sm text-muted-foreground">
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
        <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4">
          Loading...
        </div>
      }
    >
      <ProfileSetupContent />
    </Suspense>
  );
}
