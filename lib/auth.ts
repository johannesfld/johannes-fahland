import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export type CurrentUser = {
  id: string;
  username: string;
};

export async function createSession(userId: string) {
  const token = newSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (token) {
    const tokenHash = hashToken(token);
    await prisma.session.deleteMany({ where: { tokenHash } });
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
  };
}
