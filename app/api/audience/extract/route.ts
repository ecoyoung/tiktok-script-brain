import { NextRequest, NextResponse } from "next/server";
import { extractAudienceFromRaw } from "@/lib/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.product || !body.rawMaterial) {
      return NextResponse.json(
        { ok: false, error: "Missing product or rawMaterial" },
        { status: 400 }
      );
    }
    const insight = await extractAudienceFromRaw(body.product, body.rawMaterial);
    return NextResponse.json({ ok: true, insight });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to extract audience insight" },
      { status: 500 }
    );
  }
}
