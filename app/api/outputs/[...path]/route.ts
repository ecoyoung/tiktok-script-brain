import { NextRequest, NextResponse } from "next/server";
import { getOutputDetail } from "@/lib/server";

export async function GET(_: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const relativePath = path.join("/");

  try {
    return NextResponse.json({ detail: getOutputDetail(relativePath) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load output" },
      { status: 500 }
    );
  }
}
