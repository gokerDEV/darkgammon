import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/mongodb";

export async function POST() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const profiles = db.collection("profiles");
    const userIdObj = new ObjectId(session.user.id);

    const newQrToken = nanoid(12);

    await profiles.updateOne(
      { userId: userIdObj },
      { $set: { qrToken: newQrToken, updatedAt: new Date() } },
    );

    return NextResponse.json({ qrToken: newQrToken });
  } catch (error) {
    console.error("QR regeneration error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
