import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  try {
    const resolvedParams = await params;
    const db = await getDb();

    const profile = await db
      .collection("profiles")
      .findOne({ handle: resolvedParams.handle });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const lastGames = await db
      .collection("sessions")
      .find({
        status: "finished",
        $or: [
          { "host.profileId": profile._id.toString() },
          { "player.profileId": profile._id.toString() },
        ],
      })
      .sort({ finishedAt: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({ ...profile, lastGames });
  } catch (error) {
    console.error("Fetch profile error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
