import { NextRequest, NextResponse } from "next/server";
import { runTask } from "@/lib/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await runTask(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to run task" }, { status: 500 });
  }
}
