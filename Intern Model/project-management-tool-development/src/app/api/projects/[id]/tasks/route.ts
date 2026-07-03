import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const result = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      projectId: tasks.projectId,
      assigneeId: tasks.assigneeId,
      deadline: tasks.deadline,
      completed: tasks.completed,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assigneeName: users.name,
      assigneeColor: users.avatarColor,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.projectId, Number(id)))
    .orderBy(tasks.createdAt);

  return NextResponse.json(result);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, status, priority, assigneeId, deadline } = body;

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const [task] = await db
    .insert(tasks)
    .values({
      title,
      description,
      status: status ?? "todo",
      priority: priority ?? "medium",
      projectId: Number(id),
      assigneeId: assigneeId || null,
      deadline: deadline || null,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
