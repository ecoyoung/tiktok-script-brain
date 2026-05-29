import { NextRequest, NextResponse } from "next/server";
import { getReviewDecisions, saveReviewDecisions } from "@/lib/server";
import { ReviewDecisions } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ reviewDecisions: getReviewDecisions() });
}

export async function PUT(request: NextRequest) {
  const body = (await request.json()) as { reviewDecisions: ReviewDecisions };
  try {
    saveReviewDecisions(body.reviewDecisions ?? {});
    return NextResponse.json({ reviewDecisions: getReviewDecisions() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save review decisions" },
      { status: 500 }
    );
  }
}
