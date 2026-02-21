import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { ADMIN_COOKIE_NAME, signAdminToken } from "@/lib/admin-auth";
import { badRequest, unauthorized, serverError } from "@/lib/http";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!email || !password) {
      return badRequest("Email and password are required");
    }

    const admin = await prisma.adminUser.findUnique({ where: { email } });

    let valid = false;

    if (admin?.active) {
      valid = await bcrypt.compare(password, admin.passwordHash);
    } else if (env.adminEmail && env.adminPasswordHash) {
      valid = email === env.adminEmail.toLowerCase() && (await bcrypt.compare(password, env.adminPasswordHash));
    }

    if (!valid) {
      return unauthorized("Invalid credentials");
    }

    const token = await signAdminToken(email);

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.nodeEnv === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("[admin/login]", error);
    return serverError("Login failed");
  }
}
