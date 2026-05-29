import { NextRequest, NextResponse } from "next/server";
import { loadProductWorkspace, saveProductWorkspace } from "@/lib/server";
import { AudienceInsight, CompetitorProcessed, ProductBrief } from "@/lib/types";

export async function GET(_: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  try {
    return NextResponse.json({ workspace: loadProductWorkspace(slug) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const body = (await request.json()) as {
    brief?: ProductBrief;
    audience?: AudienceInsight;
    competitor?: CompetitorProcessed;
  };
  try {
    saveProductWorkspace(slug, body);
    return NextResponse.json({ workspace: loadProductWorkspace(slug) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save product" }, { status: 500 });
  }
}
