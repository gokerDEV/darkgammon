import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/mongodb";
import { ProfileEditForm } from "./ProfileEditForm";

export default async function ProfileDashboard() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const db = await getDb();
  const profile = await db
    .collection("profiles")
    .findOne({ userId: new ObjectId(session.user.id) });

  if (!profile) {
    redirect("/profile/setup");
  }

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col items-center p-8">
      <div className="w-full max-w-md flex flex-col gap-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tight">Profilim</h1>
          <Link href="/">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Ana Sayfa
            </Button>
          </Link>
        </header>

        <ProfileEditForm
          profile={{
            _id: profile._id.toString(),
            handle: profile.handle,
            displayName: profile.displayName,
            challengeMessage: profile.challengeMessage,
            victoryGifUrl: profile.victoryGifUrl || "",
          }}
        />

        {/* Offline Notifications */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 flex flex-col gap-3">
          <div className="flex flex-col">
            <h3 className="font-semibold">Meydan Okuma Bildirimleri</h3>
            <p className="text-sm text-white/70">
              Uygulama kapalıyken bile rakiplerinizden gelen istekleri
              kaçırmayın.
            </p>
          </div>
          <PushNotificationManager />
        </div>
      </div>
    </div>
  );
}
