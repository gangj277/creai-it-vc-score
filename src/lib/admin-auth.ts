import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";

export const ADMIN_COOKIE_NAME = "creai_admin_token";

function secretKey() {
  return new TextEncoder().encode(env.authSecret);
}

export async function signAdminToken(email: string) {
  return new SignJWT({ role: "ADMIN", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());
}

export async function verifyAdminToken(token: string) {
  try {
    const verified = await jwtVerify(token, secretKey());
    return verified.payload;
  } catch {
    return null;
  }
}

export async function requireAdminFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

export async function requireAdminFromServerComponent() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}
