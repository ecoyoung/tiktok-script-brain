import { NextRequest, NextResponse } from "next/server";
import { createProduct, listProducts } from "@/lib/server";

export async function GET() {
  return NextResponse.json({ products: listProducts() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { slug?: string };
  if (!body.slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  try {
    const workspace = createProduct(body.slug);
    return NextResponse.json({ workspace });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to create product" }, { status: 500 });
  }
}
