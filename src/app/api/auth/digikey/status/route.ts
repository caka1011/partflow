import { NextResponse } from "next/server";
import { isDigikeyAuthorized } from "@/lib/digikey";

// GET /api/auth/digikey/status — check if DigiKey OAuth tokens exist
export async function GET() {
  try {
    const authorized = await isDigikeyAuthorized();
    return NextResponse.json({ authorized });
  } catch {
    return NextResponse.json({ authorized: false });
  }
}
