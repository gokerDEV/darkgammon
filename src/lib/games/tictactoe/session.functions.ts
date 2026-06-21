"use server";

import { z } from "zod";
import { pusherTrigger } from "@/lib/realtime/pusher.server";

const RelaySchema = z.object({
  sessionId: z.string().min(4).max(64),
  kind: z.string().min(1).max(20).optional(),
  event: z.enum([
    "player:hello",
    "state:update",
    "game:finished",
    "peer:ping",
    "peer:leave",
    "guest:hello",
  ]),
  payload: z.unknown(),
});

export async function relay(input: { data: unknown }) {
  const data = RelaySchema.parse(input.data);
  const channel = `${data.kind ?? "game"}-${data.sessionId}`.replace(
    /[^a-zA-Z0-9_\-=@,.;]/g,
    "",
  );
  await pusherTrigger(channel, data.event, data.payload);
  return { ok: true };
}
