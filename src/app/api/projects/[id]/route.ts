import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET /api/projects/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: { schema: true, versions: { orderBy: { version: "desc" } } },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] — update name, description, and schema
export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json() as {
      name?: string;
      description?: string;
      schema?: Record<string, unknown>;
    };
    const { name, description, schema } = body;

    const updateData: { name?: string; description?: string } = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await prisma.project.update({ where: { id }, data: updateData });

    if (schema) {
      const jsonData = schema as Prisma.InputJsonValue;
      await prisma.schema.upsert({
        where: { projectId: id },
        create: { projectId: id, data: jsonData },
        update: { data: jsonData },
      });
      const versionCount = await prisma.projectVersion.count({ where: { projectId: id } });
      await prisma.projectVersion.create({
        data: { projectId: id, version: versionCount + 1, snapshot: jsonData },
      });
    }

    const full = await prisma.project.findUnique({
      where: { id },
      include: { schema: true },
    });

    return NextResponse.json(full);
  } catch (error) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
