import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";
import { pusherTrigger } from "@/lib/realtime/pusher.server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const db = await getDb();

    const session = await db
      .collection("sessions")
      .findOne({ sessionId: resolvedParams.sessionId });
    if (!session)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    return NextResponse.json({ session });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { state, status, finishedAt } = body;

    const db = await getDb();

    const updateDoc: Record<string, unknown> = { updatedAt: new Date() };
    if (state) updateDoc.state = state;
    if (status) updateDoc.status = status;
    if (finishedAt) updateDoc.finishedAt = new Date(finishedAt);

    // If game finished, save winnerProfileId
    if (status === "finished" && state?.winner) {
      const session = await db
        .collection("sessions")
        .findOne({ sessionId: resolvedParams.sessionId });
      if (session) {
        if (state.winner === "white")
          updateDoc.winnerProfileId = session.host.profileId;
        else if (state.winner === "black" && session.player)
          updateDoc.winnerProfileId = session.player.profileId;
      }
    }

    await db
      .collection("sessions")
      .updateOne({ sessionId: resolvedParams.sessionId }, { $set: updateDoc });

    // Fetch the updated session
    const updatedSession = await db
      .collection("sessions")
      .findOne({ sessionId: resolvedParams.sessionId });

    // Trigger Pusher session:updated
    await pusherTrigger(`bg-${resolvedParams.sessionId}`, "state:update", {
      session: updatedSession,
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
