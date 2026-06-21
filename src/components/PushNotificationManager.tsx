"use client";

import { getToken } from "firebase/messaging";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMessagingInstance } from "@/lib/firebase/client";
import { Button } from "./ui/button";

export function PushNotificationManager() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const p = await Notification.requestPermission();
      setPermission(p);

      if (p === "granted") {
        await registerServiceWorkerAndGetToken();
      } else {
        toast.error("Bildirim izni reddedildi.");
      }
    } catch (e) {
      const err = e as Error;
      console.error(err);
      toast.error("İzin istenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const registerServiceWorkerAndGetToken = async () => {
    if (!("serviceWorker" in navigator)) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const messagingSenderId =
        process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
      const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

      const swUrl = `/firebase-messaging-sw.js?apiKey=${apiKey}&projectId=${projectId}&messagingSenderId=${messagingSenderId}&appId=${appId}`;
      const registration = await navigator.serviceWorker.register(swUrl);

      const messaging = await getMessagingInstance();
      if (!messaging) {
        toast.error("Bildirimler bu tarayıcıda desteklenmiyor.");
        return;
      }

      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (currentToken) {
        // Send token to backend
        const res = await fetch("/api/profile/fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: currentToken }),
        });

        if (res.ok) {
          toast.success("Bildirimler başarıyla açıldı!");
        } else {
          toast.error("Token sunucuya kaydedilemedi.");
        }
      } else {
        toast.error("Token alınamadı.");
      }
    } catch (e) {
      const err = e as Error;
      console.error(err);
      toast.error("Service worker kaydı veya token alımı başarısız.");
    }
  };

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-border">
        <BellOff size={16} />
        Bildirim izni tarayıcıdan engellenmiş.
      </div>
    );
  }

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
        <Bell size={16} />
        Bildirimler Açık
      </div>
    );
  }

  return (
    <Button
      onClick={requestPermission}
      disabled={loading}
      variant="outline"
      className="w-full py-6 flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="animate-spin" /> : <Bell size={18} />}
      Meydan Okuma Bildirimlerini Aç
    </Button>
  );
}
