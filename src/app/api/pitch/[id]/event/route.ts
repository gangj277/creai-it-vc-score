import { NextRequest } from "next/server";
import { eventSchema } from "@/lib/validators";
import { logEvent } from "@/lib/tracking";
import { ok, badRequest, serverError } from "@/lib/http";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = eventSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid event", parsed.error.flatten());
    }

    await logEvent(parsed.data.eventName, {
      sessionId: id,
      properties: parsed.data.properties,
    });

    return ok({ success: true });
  } catch (error) {
    console.error("[pitch/event]", error);
    return serverError("Failed to log event");
  }
}
