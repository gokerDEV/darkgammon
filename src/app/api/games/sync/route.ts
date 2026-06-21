import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/mongodb";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { sessionId, host, player, state, snapshots, winnerProfileId } = data;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const games = db.collection("games");

    // Sadece 'finished' veya en azından biten oyunları kaydetmek istiyoruz
    const gameRecord = {
      sessionId,
      host,
      player,
      state,
      snapshots,
      winnerProfileId,
      status: "finished",
      createdAt: new Date(),
    };

    // Eğer bu sessionId ile daha önce kaydedilmişse güncelle, yoksa ekle.
    await games.updateOne(
      { sessionId },
      { $set: gameRecord },
      { upsert: true },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Game sync error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
