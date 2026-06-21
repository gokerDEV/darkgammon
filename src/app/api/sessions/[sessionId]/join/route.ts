import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { pusherTrigger } from "@/lib/realtime/pusher.server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { profileId, nickname, localUserId, challengeMsg, giphyUrl } = body;

    if (!nickname) {
      return NextResponse.json(
        { error: "Nickname is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const session = await db
      .collection("sessions")
      .findOne({ sessionId: resolvedParams.sessionId });

    if (!session)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    if (session.player) {
      // Already full or reconnecting
      if (
        session.player.profileId === profileId ||
        session.player.localUserId === localUserId
      ) {
        return NextResponse.json({ success: true, session });
      }
      return NextResponse.json({ error: "Session is full" }, { status: 403 });
    }

    let avatarUrl: string | undefined;
    if (profileId) {
      const { ObjectId } = require("mongodb");
      const playerProfile = await db
        .collection("profiles")
        .findOne({ _id: new ObjectId(profileId) });
      if (playerProfile) avatarUrl = playerProfile.avatarUrl;
    }

    // Join the session
    const updateDoc: Record<string, unknown> = {
      player: {
        profileId,
        localUserId,
        nickname,
        challengeMsg,
        giphyUrl,
        avatarUrl,
      },
      updatedAt: new Date(),
    };

    await db
      .collection("sessions")
      .updateOne({ sessionId: resolvedParams.sessionId }, { $set: updateDoc });

    const updatedSession = await db
      .collection("sessions")
      .findOne({ sessionId: resolvedParams.sessionId });

    // Broadcast state update to notify host
    await pusherTrigger(`bg-${resolvedParams.sessionId}`, "state:update", {
      session: updatedSession,
    });

    // Also broadcast player:hello so host shows toast
    await pusherTrigger(`bg-${resolvedParams.sessionId}`, "player:hello", {
      localUserId,
      nickname,
      challengeMsg,
      giphyUrl,
      profileId,
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
