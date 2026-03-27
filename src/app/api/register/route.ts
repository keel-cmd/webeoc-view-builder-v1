import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; password?: string; name?: string };
  const { email, password, name } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  // First registered user becomes admin and is auto-approved
  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name?.trim() || null,
      password: hashed,
      role: isFirstUser ? "admin" : "user",
      approved: isFirstUser,
    },
    select: { id: true, email: true, role: true, approved: true },
  });

  return NextResponse.json(user, { status: 201 });
}
