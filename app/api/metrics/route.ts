import { NextRequest, NextResponse } from "next/server";
import { updateMetrics } from "@/lib/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await updateMetrics(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update metrics" },
      { status: 500 }
    );
  }
}
