import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPosthogServerClient } from "@/lib/posthog";

export async function logEvent(
  eventName: string,
  options?: {
    sessionId?: string;
    properties?: Record<string, unknown>;
  }
) {
  const sessionId = options?.sessionId;
  const properties = options?.properties ?? {};

  await prisma.eventLog.create({
    data: {
      eventName,
      sessionId,
      properties: properties as Prisma.InputJsonValue,
    },
  });

  const posthog = getPosthogServerClient();
  if (posthog) {
    posthog.capture({
      distinctId: sessionId ?? "anonymous",
      event: eventName,
      properties,
    });
  }
}
