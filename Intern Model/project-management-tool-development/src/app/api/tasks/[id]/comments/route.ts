import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await db
    .select({
      id: comments.id,
      taskId: comments.taskId,
      body: comments.body,
      createdAt: comments.createdAt,
      authorId: comments.authorId,
      authorName: users.name,
      authorColor: users.avatarColor,
    })
    .from(comments)
    .leftJoin(users, eq(comments.authorId, users.id))
    .where(eq(comments.taskId, Number(id)))
    .orderBy(comments.createdAt);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { body: text, authorId } = body;

  if (!text) return NextResponse.json({ error: "Comment body is required." }, { status: 400 });

  const [comment] = await db
    .insert(comments)
    .values({ taskId: Number(id), body: text, authorId: authorId || null })
    .returning();

  return NextResponse.json(comment, { status: 201 });
}
