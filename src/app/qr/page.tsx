import { ObjectId } from "mongodb";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db/mongodb";
import { QrDashboardClient } from "./QrDashboardClient";

export default async function QrPage() {
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
          <h1 className="text-3xl font-black tracking-tight">My QR Code</h1>
          <Link href="/">
            <Button
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Home
            </Button>
          </Link>
        </header>

        <QrDashboardClient
          initialToken={profile.qrToken}
          handle={profile.handle}
        />
      </div>
    </div>
  );
}
