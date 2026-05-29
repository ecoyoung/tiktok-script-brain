import { NextRequest, NextResponse } from "next/server";
import { inferAudienceFromContext } from "@/lib/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.product) {
      return NextResponse.json(
        { ok: false, error: "Missing product" },
        { status: 400 }
      );
    }
    const insight = await inferAudienceFromContext(body.product);
    return NextResponse.json({ ok: true, insight });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to infer audience insight" },
      { status: 500 }
    );
  }
}
