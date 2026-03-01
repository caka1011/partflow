import { NextResponse } from "next/server";
import { getPartDetails } from "@/lib/z2data";

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

// POST /api/assemblies/[id]/bom-items/[itemId]/resolve
// Body: { partId: number, manufacturer?: string, description?: string, datasheet?: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const { url, headers } = getConfig();
    const { partId, manufacturer, description, datasheet } = await req.json();

    if (!partId) {
      return NextResponse.json(
        { error: "partId is required" },
        { status: 400 }
      );
    }

    // Fetch full part details from Z2Data
    let details: Awaited<ReturnType<typeof getPartDetails>> = null;
    try {
      details = await getPartDetails(partId);
    } catch {
      // If details fetch fails, fall back to data from the search result (passed in body)
    }

    // Build the enrichment payload — prefer Z2Data details, fall back to search result data
    const patch = {
      z2data_part_id: String(partId),
      z2data_manufacturer:
        details?.MPNSummary?.Supplier ?? manufacturer ?? "",
      z2data_description:
        details?.MPNSummary?.Description ?? description ?? "",
      z2data_lifecycle_status:
        details?.Lifecycle?.LifecycleStatus ?? "",
      z2data_rohs: details?.ComplianceDetails?.RoHSStatus ?? "",
      z2data_reach: details?.ComplianceDetails?.REACHStatus ?? "",
      z2data_datasheet_url:
        details?.MPNSummary?.DataSheet ?? datasheet ?? "",
      z2data_enriched_at: new Date().toISOString(),
      z2data_error: null,
    };

    // Update the BOM line item
    const patchRes = await fetch(
      `${url}/rest/v1/bom_line_items?id=eq.${itemId}&assembly_id=eq.${id}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      }
    );
    if (!patchRes.ok) {
      return NextResponse.json(
        { error: "Failed to save resolution" },
        { status: 500 }
      );
    }

    // Update assembly enrichment counters
    const countRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=id,z2data_enriched_at,value&assembly_id=eq.${id}`,
      { method: "GET", headers }
    );
    const allItems = countRes.ok ? await countRes.json() : [];
    const enrichable = allItems.filter(
      (i: { value: string }) => i.value && i.value.trim() !== ""
    ).length;
    const enriched = allItems.filter(
      (i: { z2data_enriched_at: string | null }) => i.z2data_enriched_at
    ).length;

    const enrichmentStatus = enriched === enrichable ? "completed" : "partial";

    await fetch(`${url}/rest/v1/assemblies?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        z2data_enrichment_status: enrichmentStatus,
        z2data_enriched_count: enriched,
        z2data_total_enrichable: enrichable,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
