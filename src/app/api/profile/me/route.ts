import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/mongodb";

export async function GET() {
  try {
    const session = await getServerAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const profiles = db.collection("profiles");

    const profile = await profiles.findOne({
      userId: new ObjectId(session.user.id),
    });

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
