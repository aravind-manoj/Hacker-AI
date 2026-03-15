import { NextResponse } from "next/server";
import { db } from "@/db";
import { system } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { secret_key } = body;

    if (!secret_key) {
      return NextResponse.json(
        { error: "Secret key is required" },
        { status: 400 }
      );
    }

    const sys = await db.select().from(system).where(eq(system.id, id));

    if (sys.length === 0) {
      return NextResponse.json(
        { error: "System not found" },
        { status: 404 }
      );
    }

    if (sys[0].secretKey !== secret_key) {
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 401 }
      );
    }

    await db.update(system)
      .set({ status: "connected" })
      .where(eq(system.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error connecting agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
