import { NextResponse } from "next/server";
import { searchPartCandidates } from "@/lib/z2data";

/** Strip any non-ASCII characters from a string */
function ascii(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[^\x20-\x7E]/g, "");
}

function getConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) {
    throw new Error(`Missing env vars: URL=${!!rawUrl}, KEY=${!!rawKey}`);
  }
  const url = ascii(rawUrl).trim();
  const key = ascii(rawKey).trim();
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  };
}

// GET /api/assemblies/[id]/bom-items/[itemId]/candidates
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const { url, headers } = getConfig();

    // Fetch the BOM item to get its MPN + shorttext, verify assembly ownership
    const itemRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=id,value,shorttext&id=eq.${itemId}&assembly_id=eq.${id}`,
      { method: "GET", headers }
    );
    if (!itemRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch BOM item" },
        { status: itemRes.status }
      );
    }
    const items: { id: string; value: string; shorttext: string }[] =
      await itemRes.json();
    if (!items.length) {
      return NextResponse.json(
        { error: "BOM item not found" },
        { status: 404 }
      );
    }

    const item = items[0];
    const candidates = await searchPartCandidates(
      item.value.trim(),
      item.shorttext
    );

    return NextResponse.json({ candidates });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Z2Data search failed" },
      { status: 500 }
    );
  }
}
