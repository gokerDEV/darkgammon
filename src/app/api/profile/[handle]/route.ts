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

    const stats = {
      light: { total: 0, wins: 0, losses: 0 },
      dark: { total: 0, wins: 0, losses: 0 },
    };

    for (const game of lastGames) {
      const isHost = game.host.profileId === profile._id.toString();
      const mySide = isHost
        ? game.hostSide || "light"
        : game.playerSide || "light";
      const myColor = isHost
        ? mySide === "light"
          ? "white"
          : "black"
        : mySide === "light"
          ? "white"
          : "black";

      const won = game.state?.winner === myColor;

      if (mySide === "light") {
        stats.light.total++;
        if (won) stats.light.wins++;
        else stats.light.losses++;
      } else {
        stats.dark.total++;
        if (won) stats.dark.wins++;
        else stats.dark.losses++;
      }
    }

    return NextResponse.json({ ...profile, lastGames, stats });
  } catch (error) {
    console.error("Fetch profile error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
