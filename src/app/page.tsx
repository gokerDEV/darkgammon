import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";
import LandingAuth from "./LandingAuth";
import LandingClient from "./LandingClient";
import { unstable_cache } from "next/cache";

const getStats = unstable_cache(
  async () => {
    const db = await getDb();
    
    const [lightUsers, darkUsers, lightWins, darkWins, totalMatches] = await Promise.all([
      db.collection("profiles").countDocuments({ side: { $ne: "dark" } }),
      db.collection("profiles").countDocuments({ side: "dark" }),
      db.collection("sessions").countDocuments({ status: "finished", "state.winner": "white" }),
      db.collection("sessions").countDocuments({ status: "finished", "state.winner": "black" }),
      db.collection("sessions").countDocuments({ status: "finished" })
    ]);

    return { lightUsers, darkUsers, lightWins, darkWins, totalMatches };
  },
  ["landing-stats"],
  { revalidate: 600 }
);

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    const stats = await getStats();
    return <LandingAuth stats={stats} />;
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
