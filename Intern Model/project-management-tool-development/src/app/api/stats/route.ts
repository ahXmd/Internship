import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks, users } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  const [projectCount] = await db.select({ count: sql<number>`count(*)` }).from(projects);
  const [taskCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks);
  const [doneCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(sql`${tasks.completed} = true`);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);

  const tasksByStatus = await db
    .select({ status: tasks.status, count: sql<number>`count(*)` })
    .from(tasks)
    .groupBy(tasks.status);

  const tasksByPriority = await db
    .select({ priority: tasks.priority, count: sql<number>`count(*)` })
    .from(tasks)
    .groupBy(tasks.priority);

  return NextResponse.json({
    projects: Number(projectCount.count),
    tasks: Number(taskCount.count),
    done: Number(doneCount.count),
    users: Number(userCount.count),
    tasksByStatus: tasksByStatus.map((r) => ({ ...r, count: Number(r.count) })),
    tasksByPriority: tasksByPriority.map((r) => ({ ...r, count: Number(r.count) })),
  });
}
