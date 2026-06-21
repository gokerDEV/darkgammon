import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.PUSHER_KEY;
  const cluster = process.env.PUSHER_CLUSTER;
  if (!key || !cluster) {
    return NextResponse.json(
      { error: "Realtime not configured" },
      { status: 500 },
    );
  }
  return NextResponse.json(
    { key, cluster },
    { headers: { "cache-control": "public, max-age=300" } },
  );
}
