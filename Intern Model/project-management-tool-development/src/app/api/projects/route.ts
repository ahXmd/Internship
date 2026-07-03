import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const allProjects = await db.select().from(projects).orderBy(projects.createdAt);

  // Get task counts per project
  const taskCounts = await db
    .select({
      projectId: tasks.projectId,
      total: sql<number>`count(*)`.as("total"),
      done: sql<number>`count(*) filter (where ${tasks.completed} = true)`.as("done"),
    })
    .from(tasks)
    .groupBy(tasks.projectId);

  const countMap = Object.fromEntries(
    taskCounts.map((r) => [r.projectId, { total: Number(r.total), done: Number(r.done) }])
  );

  const result = allProjects.map((p) => ({
    ...p,
    taskCount: countMap[p.id]?.total ?? 0,
    taskDone: countMap[p.id]?.done ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, status, color, ownerId, deadline } = body;

  if (!name) {
    return NextResponse.json({ error: "Project name is required." }, { status: 400 });
  }

  const [project] = await db
    .insert(projects)
    .values({ name, description, status, color, ownerId: ownerId || null, deadline: deadline || null })
    .returning();

  return NextResponse.json(project, { status: 201 });
}
