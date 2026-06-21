import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";
import { pusherTrigger } from "@/lib/realtime/pusher.server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const body = await req.json();
    const { action } = body; // "accept" | "decline" | "cancel"

    if (action !== "accept" && action !== "decline" && action !== "cancel") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const db = await getDb();

    const myProfile = await db
      .collection("profiles")
      .findOne({ userId: new ObjectId(session.user.id) });
    if (!myProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const challenge = await db
      .collection("challenges")
      .findOne({ _id: new ObjectId(resolvedParams.id) });
    if (!challenge)
      return NextResponse.json(
        { error: "Challenge not found" },
        { status: 404 },
      );

    if (action === "cancel") {
      if (challenge.fromProfileId.toString() !== myProfile._id.toString()) {
        return NextResponse.json(
          { error: "You can only cancel your own challenges" },
          { status: 403 },
        );
      }
    } else {
      if (challenge.toProfileId.toString() !== myProfile._id.toString()) {
        return NextResponse.json(
          { error: "Not authorized to respond to this challenge" },
          { status: 403 },
        );
      }
    }

    if (challenge.status !== "pending") {
      return NextResponse.json(
        { error: "Challenge is no longer pending" },
        { status: 400 },
      );
    }

    if (challenge.expiresAt < new Date()) {
      await db
        .collection("challenges")
        .updateOne({ _id: challenge._id }, { $set: { status: "expired" } });
      return NextResponse.json(
        { error: "Challenge has expired" },
        { status: 400 },
      );
    }

    // create an easy to share session id using a random string for game URL
    const newSessionId =
      action === "accept" ? Math.random().toString(36).slice(2, 10) : undefined;

    await db.collection("challenges").updateOne(
      { _id: challenge._id },
      {
        $set: {
          status: `${action}ed`,
          respondedAt: new Date(),
          sessionId: newSessionId,
        },
      },
    );

    const targetProfileId = challenge.fromProfileId;
    const targetProfile = await db
      .collection("profiles")
      .findOne({ _id: targetProfileId });

    if (action === "accept" && targetProfile) {
      // Import dynamic to avoid static build issues if possible or just use require
      // Wait, we can import startingState at the top of the file
      const { startingState } = await import("@/lib/games/backgammon/engine");
      const sessionData = {
        sessionId: newSessionId,
        status: "playing",
        host: {
          userId: targetProfile.userId.toString(),
          profileId: targetProfile._id.toString(),
          handle: targetProfile.handle,
          displayName: targetProfile.displayName,
          avatarUrl: targetProfile.avatarUrl,
          challengeMessage: targetProfile.challengeMessage,
          victoryGifUrl: targetProfile.victoryGifUrl,
        },
        player: {
          userId: myProfile.userId.toString(),
          profileId: myProfile._id.toString(),
          handle: myProfile.handle,
          displayName: myProfile.displayName,
          avatarUrl: myProfile.avatarUrl,
          challengeMessage: myProfile.challengeMessage,
          victoryGifUrl: myProfile.victoryGifUrl,
        },
        state: startingState(),
        createdFromChallengeId: challenge._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection("sessions").insertOne(sessionData);

      // We also need to save the initial snapshot
      await db.collection("snapshots").insertOne({
        sessionId: newSessionId,
        states: [sessionData.state],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (targetProfile && action !== "cancel") {
      const notification = {
        userId: targetProfile.userId,
        profileId: targetProfile._id,
        type: action === "accept" ? "challenge_accepted" : "challenge_declined",
        title:
          action === "accept"
            ? "Meydan Okuma Kabul Edildi!"
            : "Meydan Okuma Reddedildi",
        body:
          action === "accept"
            ? `${myProfile.displayName} davetinizi kabul etti.`
            : `${myProfile.displayName} davetinizi reddetti.`,
        data: {
          challengeId: challenge._id.toString(),
          sessionId: newSessionId,
          fromProfile: myProfile,
        },
        createdAt: new Date(),
        readAt: null,
      };
      await db.collection("notifications").insertOne(notification);

      await pusherTrigger(
        `profile-${targetProfileId.toString()}`,
        `challenge:${action}ed`,
        {
          challengeId: challenge._id.toString(),
          sessionId: newSessionId,
          fromProfile: myProfile,
        },
      );
    }

    return NextResponse.json({ success: true, sessionId: newSessionId });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
