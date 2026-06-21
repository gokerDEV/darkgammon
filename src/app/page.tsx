import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";
import LandingAuth from "./LandingAuth";
import LandingClient from "./LandingClient";

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    return <LandingAuth />;
  }

  const db = await getDb();
  const profile = await db
    .collection("profiles")
    .findOne({ userId: new ObjectId(session.user.id) });

  if (!profile) {
    redirect("/profile/setup");
  }

  // Convert ObjectId to string for client component props
  const safeProfile = {
    ...profile,
    _id: profile._id.toString(),
    userId: profile.userId.toString(),
  };

  return <LandingClient profile={safeProfile} />;
}
