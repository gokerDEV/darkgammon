"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocalProfile } from "@/lib/profile/useLocalProfile";
import { useChannel } from "@/lib/realtime/usePusher";

export function GlobalNotificationListener() {
  const router = useRouter();
  const { profileId } = useLocalProfile();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      setActiveChannel(`profile-${profileId}`);
    } else {
      setActiveChannel(null);
    }
  }, [profileId]);

  const handleAccept = async (
    challengeId: string,
    toastId: string | number,
  ) => {
    toast.dismiss(toastId);
    try {
      const res = await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed to accept");
      const data = await res.json();
      if (data.sessionId) {
        router.push(`/ni/${data.sessionId}`);
      }
    } catch (e) {
      const err = e as Error;
      toast.error(err.message);
    }
  };

  const handleDecline = async (
    challengeId: string,
    toastId: string | number,
  ) => {
    toast.dismiss(toastId);
    try {
      await fetch(`/api/challenges/${challengeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
    } catch (e) {
      const err = e as Error;
      toast.error(err.message);
    }
  };

  useChannel(activeChannel, {
    // biome-ignore lint/suspicious/noExplicitAny: complex pusher typing
    "challenge:new": (data: any) => {
      const fromName = data.fromProfile?.displayName || "Someone";
      toast(
        <div className="flex flex-col gap-2">
          <p className="font-semibold">
            {fromName} is challenging you to a battle!
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-sm font-medium"
              onClick={(e) => {
                const toastId = (e.target as HTMLElement)
                  .closest("[data-sonner-toast]")
                  ?.getAttribute("data-sonner-toast");
                handleAccept(data.challengeId, toastId || "");
              }}
            >
              Accept
            </button>
            <button
              type="button"
              className="bg-muted hover:bg-muted/80 text-foreground px-3 py-1 rounded text-sm font-medium"
              onClick={(e) => {
                const toastId = (e.target as HTMLElement)
                  .closest("[data-sonner-toast]")
                  ?.getAttribute("data-sonner-toast");
                handleDecline(data.challengeId, toastId || "");
              }}
            >
              Decline
            </button>
          </div>
        </div>,
        { duration: 30000 },
      );
    },
    // biome-ignore lint/suspicious/noExplicitAny: complex pusher typing
    "challenge:accepted": (data: any) => {
      const fromName = data.fromProfile?.displayName || "Opponent";
      toast.success(
        `${fromName} accepted your challenge! Battle is starting...`,
      );
      if (data.sessionId) {
        router.push(`/ni/${data.sessionId}`);
      }
    },
    // biome-ignore lint/suspicious/noExplicitAny: complex pusher typing
    "challenge:declined": (data: any) => {
      const fromName = data.fromProfile?.displayName || "Opponent";
      toast.error(`${fromName} declined your challenge.`);
    },
  });

  return null;
}
