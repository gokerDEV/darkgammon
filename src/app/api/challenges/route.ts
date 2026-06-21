import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";
import { pusherTrigger } from "@/lib/realtime/pusher.server";
import "@/lib/firebase/admin";
import { getMessaging } from "firebase-admin/messaging";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { toProfileId, gameKind } = body;
    if (!toProfileId)
      return NextResponse.json(
        { error: "Missing toProfileId" },
        { status: 400 },
      );

    const db = await getDb();

    const myProfile = await db
      .collection("profiles")
      .findOne({ userId: new ObjectId(session.user.id) });
    if (!myProfile)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const fromProfileId = myProfile._id;

    if (fromProfileId.toString() === toProfileId) {
      return NextResponse.json(
        { error: "You cannot challenge yourself" },
        { status: 400 },
      );
    }

    // Rate limiting rules
    const recent = await db.collection("challenges").findOne({
      fromProfileId,
      toProfileId: new ObjectId(toProfileId),
      createdAt: { $gt: new Date(Date.now() - 60000) },
    });
    if (recent)
      return NextResponse.json(
        { error: "You cannot spam challenges. Wait 1 min." },
        { status: 429 },
      );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const countToday = await db.collection("challenges").countDocuments({
      fromProfileId,
      toProfileId: new ObjectId(toProfileId),
      createdAt: { $gt: todayStart },
    });
    if (countToday >= 3)
      return NextResponse.json(
        { error: "You can send up to 3 challenges per day to the same user." },
        { status: 429 },
      );

    const maxPendingSent = myProfile.maxPendingSent || 50;
    const countPendingSent = await db.collection("challenges").countDocuments({
      fromProfileId,
      status: "pending",
    });
    if (countPendingSent >= maxPendingSent) {
      return NextResponse.json(
        {
          error: `Maximum pending challenges reached. (Limit: ${maxPendingSent})`,
        },
        { status: 429 },
      );
    }

    const targetProfile = await db
      .collection("profiles")
      .findOne({ _id: new ObjectId(toProfileId) });
    if (!targetProfile)
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );

    const maxPendingReceived = targetProfile.maxPendingReceived || 50;
    const countPendingReceived = await db
      .collection("challenges")
      .countDocuments({
        toProfileId: new ObjectId(toProfileId),
        status: "pending",
      });
    if (countPendingReceived >= maxPendingReceived) {
      return NextResponse.json(
        { error: "Target user has too many pending challenges." },
        { status: 429 },
      );
    }

    const challenge = {
      fromProfileId,
      toProfileId: new ObjectId(toProfileId),
      status: "pending",
      gameKind: gameKind || "backgammon",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60000), // 5 min expiry
    };

    const result = await db.collection("challenges").insertOne(challenge);
    const challengeId = result.insertedId;

    if (targetProfile) {
      const notification = {
        userId: targetProfile.userId,
        profileId: targetProfile._id,
        type: "challenge_received",
        title: "New Battle Challenge",
        body: `${myProfile.displayName} is challenging you to a battle!`,
        data: { challengeId: challengeId.toString(), fromProfile: myProfile },
        createdAt: new Date(),
        readAt: null,
      };
      const notifRes = await db
        .collection("notifications")
        .insertOne(notification);

      await pusherTrigger(`profile-${toProfileId}`, "challenge:new", {
        notificationId: notifRes.insertedId.toString(),
        challengeId: challengeId.toString(),
        fromProfile: myProfile,
      });

      if (
        targetProfile.fcmTokens &&
        Array.isArray(targetProfile.fcmTokens) &&
        targetProfile.fcmTokens.length > 0
      ) {
        try {
          await getMessaging().sendEachForMulticast({
            tokens: targetProfile.fcmTokens,
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: {
              challengeId: challengeId.toString(),
            },
          });
        } catch (err) {
          console.error("FCM Send Error", err);
        }
      }
    }

    return NextResponse.json({ success: true, challengeId });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
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

    const pendingReceived = await db
      .collection("challenges")
      .aggregate([
        { $match: { toProfileId: myProfile._id, status: "pending" } },
        {
          $lookup: {
            from: "profiles",
            localField: "fromProfileId",
            foreignField: "_id",
            as: "fromProfile",
          },
        },
        { $unwind: "$fromProfile" },
        { $project: { "fromProfile.fcmTokens": 0, "fromProfile.userId": 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    const pendingSent = await db
      .collection("challenges")
      .aggregate([
        { $match: { fromProfileId: myProfile._id, status: "pending" } },
        {
          $lookup: {
            from: "profiles",
            localField: "toProfileId",
            foreignField: "_id",
            as: "toProfile",
          },
        },
        { $unwind: "$toProfile" },
        { $project: { "toProfile.fcmTokens": 0, "toProfile.userId": 0 } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return NextResponse.json({
      received: pendingReceived,
      sent: pendingSent,
      limits: {
        maxPendingSent: myProfile.maxPendingSent || 50,
        maxPendingReceived: myProfile.maxPendingReceived || 50,
      },
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
