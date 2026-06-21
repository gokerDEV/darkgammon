import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const profiles = db.collection("profiles");

    const existingProfile = await profiles.findOne({
      userId: new ObjectId(session.user.id),
    });
    if (existingProfile) {
      return NextResponse.json(
        { error: "Profile already exists" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { displayName, challengeMessage, victoryGifUrl, side } = body;

    if (!displayName) {
      return NextResponse.json(
        { error: "displayName is required" },
        { status: 400 },
      );
    }

    if (side !== undefined && side !== "light" && side !== "dark") {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }

    // Generate a unique handle based on display name
    const baseHandle = displayName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const handle = `${baseHandle}-${nanoid(4)}`;

    const newProfile = {
      userId: new ObjectId(session.user.id),
      handle,
      displayName,
      avatarUrl: session.user.image || "",
      challengeMessage: challengeMessage || "",
      victoryGifUrl: victoryGifUrl || "",
      side: side || "light",
      qrToken: nanoid(12),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await profiles.insertOne(newProfile);

    return NextResponse.json({ profile: newProfile });
  } catch (error) {
    console.error("Profile creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { displayName, handle, challengeMessage, victoryGifUrl, side } = body;

    if (!displayName || !handle) {
      return NextResponse.json(
        { error: "displayName and handle are required" },
        { status: 400 },
      );
    }

    if (side !== undefined && side !== "light" && side !== "dark") {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }

    const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9\-_]/g, "");
    if (!cleanHandle) {
      return NextResponse.json(
        { error: "invalid handle format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const profiles = db.collection("profiles");
    const userIdObj = new ObjectId(session.user.id);

    const existingHandleUser = await profiles.findOne({
      handle: cleanHandle,
      userId: { $ne: userIdObj },
    });
    if (existingHandleUser) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı (handle) zaten alınmış." },
        { status: 400 },
      );
    }

    await profiles.updateOne(
      { userId: userIdObj },
      {
        $set: {
          displayName,
          handle: cleanHandle,
          challengeMessage: challengeMessage || "",
          victoryGifUrl: victoryGifUrl || "",
          side: side || "light",
          updatedAt: new Date(),
        },
      },
    );

    const updatedProfile = await profiles.findOne({ userId: userIdObj });
    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
