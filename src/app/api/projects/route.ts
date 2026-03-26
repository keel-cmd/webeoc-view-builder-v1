import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// GET /api/projects — list all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { schema: true },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string;
      description?: string;
      schema?: Record<string, unknown>;
    };
    const { name, description, schema } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: { name, description },
    });

    if (schema) {
      const jsonData = schema as Prisma.InputJsonValue;
      await prisma.schema.create({
        data: { projectId: project.id, data: jsonData },
      });
      await prisma.projectVersion.create({
        data: { projectId: project.id, version: 1, snapshot: jsonData },
      });
    }

    const full = await prisma.project.findUnique({
      where: { id: project.id },
      include: { schema: true },
    });

    return NextResponse.json(full, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
