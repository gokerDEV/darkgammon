import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

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

    const doc = await db
      .collection("snapshots")
      .findOne({ sessionId: resolvedParams.sessionId });

    return NextResponse.json({
      session,
      snapshots: doc?.states || [],
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
