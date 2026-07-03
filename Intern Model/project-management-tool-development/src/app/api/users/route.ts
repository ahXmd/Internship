import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AVATAR_COLORS } from "@/lib/utils";

export async function GET() {
  const all = await db.select().from(users).orderBy(users.name);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    return NextResponse.json({ error: "Email already in use." }, { status: 409 });
  }

  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const [user] = await db.insert(users).values({ name, email, avatarColor: color }).returning();
  return NextResponse.json(user, { status: 201 });
}
