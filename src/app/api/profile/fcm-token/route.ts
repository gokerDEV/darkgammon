import { ObjectId } from "mongodb";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { token } = body;
    if (!token)
      return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const db = await getDb();

    // Store token in an array, to support multiple devices (or overwrite for simplicity)
    await db.collection("profiles").updateOne(
      { userId: new ObjectId(session.user.id) },
      {
        $addToSet: { fcmTokens: token },
        $set: { updatedAt: new Date() },
      },
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
