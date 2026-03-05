import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/digikey";

// GET /api/auth/digikey/callback?code=... — exchange auth code for tokens
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    const error = req.nextUrl.searchParams.get("error") ?? "missing_code";
    const desc = req.nextUrl.searchParams.get("error_description") ?? "";
    return NextResponse.redirect(
      new URL(`/assemblies?digikey_error=${encodeURIComponent(error + (desc ? ": " + desc : ""))}`, req.url)
    );
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(
      new URL("/assemblies?digikey_connected=1", req.url)
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    return NextResponse.redirect(
      new URL(`/assemblies?digikey_error=${encodeURIComponent(msg)}`, req.url)
    );
  }
}
