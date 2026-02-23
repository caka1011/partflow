import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(missing)";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "(missing)";

  // Show first 20 chars with their char codes
  const urlChars = [...url].slice(0, 30).map((c, i) => ({
    i,
    char: c,
    code: c.charCodeAt(0),
  }));
  const keyChars = [...key].slice(0, 20).map((c, i) => ({
    i,
    char: c,
    code: c.charCodeAt(0),
  }));

  return NextResponse.json({
    url_length: url.length,
    url_first30: url.slice(0, 30),
    url_chars: urlChars,
    key_length: key.length,
    key_first20: key.slice(0, 20),
    key_chars: keyChars,
  });
}
