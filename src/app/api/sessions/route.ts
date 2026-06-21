import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";
import { startingState } from "@/lib/games/backgammon/engine";

export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = await getDb();
    const myProfile = await db
      .collection("profiles")
      .findOne({ userId: new ObjectId(session.user.id) });
    if (!myProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const newSessionId = Math.random().toString(36).slice(2, 10);
    const sessionData = {
      sessionId: newSessionId,
      status: "created",
      host: {
        userId: myProfile.userId.toString(),
        profileId: myProfile._id.toString(),
        handle: myProfile.handle,
        displayName: myProfile.displayName,
        nickname: myProfile.displayName,
        avatarUrl: myProfile.avatarUrl,
        challengeMessage: myProfile.challengeMessage,
        victoryGifUrl: myProfile.victoryGifUrl,
      },
      state: startingState(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("sessions").insertOne(sessionData);

    await db.collection("snapshots").insertOne({
      sessionId: newSessionId,
      seq: 0,
      state: sessionData.state,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, sessionId: newSessionId });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
