import { NextResponse } from "next/server";

/** Temporary debug endpoint — delete after fixing the issue */
export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "(missing)";

  // Show sanitised versions (mask the key for safety)
  const ascii = (s: string) => s.replace(/[^\x20-\x7E]/g, "");
  const cleanUrl = ascii(rawUrl).trim();
  const cleanKey = ascii(rawKey).trim();

  // Try a simple fetch to Supabase to test connectivity
  let connectResult = "not tested";
  if (cleanUrl !== "(missing)" && cleanKey !== "(missing)") {
    try {
      const res = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: cleanKey,
          Authorization: `Bearer ${cleanKey}`,
        },
      });
      connectResult = `status ${res.status} — ${res.statusText}`;
    } catch (e) {
      const cause = e instanceof Error && e.cause ? ` [cause: ${e.cause}]` : "";
      connectResult = `FAILED: ${e instanceof Error ? e.message : String(e)}${cause}`;
    }
  }

  return NextResponse.json({
    url: {
      raw_length: rawUrl.length,
      clean_length: cleanUrl.length,
      clean_value: cleanUrl,
      starts_with_https: cleanUrl.startsWith("https://"),
      has_non_ascii: rawUrl !== ascii(rawUrl),
    },
    key: {
      raw_length: rawKey.length,
      clean_length: cleanKey.length,
      first_10: cleanKey.slice(0, 10) + "...",
      starts_with_ey: cleanKey.startsWith("ey"),
      has_non_ascii: rawKey !== ascii(rawKey),
    },
    connectivity: connectResult,
  });
}
