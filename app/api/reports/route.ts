import { NextRequest, NextResponse } from "next/server";
import { generateReport, getReports, readReport } from "@/lib/server";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (name) {
    return NextResponse.json({ report: readReport(name) });
  }
  return NextResponse.json({ reports: getReports() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await generateReport(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
