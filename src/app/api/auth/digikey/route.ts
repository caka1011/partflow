import { NextResponse } from "next/server";
import { getAuthorizationUrl } from "@/lib/digikey";

// GET /api/auth/digikey — redirect to DigiKey's OAuth authorize page
export async function GET() {
  try {
    const url = getAuthorizationUrl();
    return NextResponse.redirect(url);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to build authorization URL" },
      { status: 500 }
    );
  }
}
