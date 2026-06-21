import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const db = await getDb();

    const doc = await db
      .collection("snapshots")
      .findOne({ sessionId: resolvedParams.sessionId });
    return NextResponse.json({ snapshots: doc?.states || [] });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    const { state } = body;

    if (!state)
      return NextResponse.json({ error: "State required" }, { status: 400 });

    const db = await getDb();

    await db.collection("snapshots").updateOne(
      { sessionId: resolvedParams.sessionId },
      {
        $push: {
          states: {
            $each: [state],
            $slice: -400,
          },
          // biome-ignore lint/suspicious/noExplicitAny: Complex mongo typing
        } as any,
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
