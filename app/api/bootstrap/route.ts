import { NextResponse } from "next/server";
import { getBootstrapData } from "@/lib/server";

export async function GET() {
  return NextResponse.json(getBootstrapData());
}
