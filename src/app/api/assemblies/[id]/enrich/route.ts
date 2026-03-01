import { NextResponse } from "next/server";
import { enrichPart } from "@/lib/z2data";

const BATCH_SIZE = 10;

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

// POST /api/assemblies/[id]/enrich — enrich a batch of BOM line items
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { url, headers } = getConfig();

    // 1. Fetch un-enriched items: no result yet AND no error yet (skip already-processed)
    const itemsRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=id,value,shorttext&assembly_id=eq.${id}&value=neq.&z2data_enriched_at=is.null&z2data_error=is.null&limit=${BATCH_SIZE}`,
      { method: "GET", headers }
    );
    if (!itemsRes.ok) {
      const err = await itemsRes.json().catch(() => ({ message: itemsRes.statusText }));
      return NextResponse.json(
        { error: err.message ?? "Failed to fetch BOM items" },
        { status: itemsRes.status }
      );
    }
    const items: { id: string; value: string; shorttext: string }[] = await itemsRes.json();

    // If no items left to process, mark assembly as done
    if (items.length === 0) {
      // Count totals for assembly
      const countRes = await fetch(
        `${url}/rest/v1/bom_line_items?select=id,z2data_enriched_at,z2data_error,value&assembly_id=eq.${id}`,
        { method: "GET", headers }
      );
      const allItems = countRes.ok ? await countRes.json() : [];
      const enrichable = allItems.filter((i: { value: string }) => i.value && i.value.trim() !== "").length;
      const enriched = allItems.filter((i: { z2data_enriched_at: string | null }) => i.z2data_enriched_at).length;

      const finalStatus = enriched === enrichable ? "completed" : "partial";

      await fetch(
        `${url}/rest/v1/assemblies?id=eq.${id}`,
        {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({
            z2data_enrichment_status: finalStatus,
            z2data_enriched_count: enriched,
            z2data_total_enrichable: enrichable,
          }),
        }
      );

      return NextResponse.json({
        status: "done",
        enriched_in_batch: 0,
        errors_in_batch: 0,
        enriched_total: enriched,
        enrichable_total: enrichable,
      });
    }

    // 2. Mark assembly as in_progress
    await fetch(
      `${url}/rest/v1/assemblies?id=eq.${id}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ z2data_enrichment_status: "in_progress" }),
      }
    );

    // 3. Enrich each item
    let enrichedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const result = await enrichPart(item.value.trim(), item.shorttext);

        await fetch(
          `${url}/rest/v1/bom_line_items?id=eq.${item.id}`,
          {
            method: "PATCH",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify({
              z2data_part_id: result.partId,
              z2data_manufacturer: result.manufacturer,
              z2data_description: result.description,
              z2data_lifecycle_status: result.lifecycleStatus,
              z2data_rohs: result.rohs,
              z2data_reach: result.reach,
              z2data_datasheet_url: result.datasheetUrl,
              z2data_enriched_at: new Date().toISOString(),
            }),
          }
        );
        enrichedCount++;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        await fetch(
          `${url}/rest/v1/bom_line_items?id=eq.${item.id}`,
          {
            method: "PATCH",
            headers: { ...headers, Prefer: "return=minimal" },
            body: JSON.stringify({ z2data_error: errorMsg }),
          }
        );
        errorCount++;
      }
    }

    // 4. Update assembly progress counters
    const countRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=id,z2data_enriched_at,value&assembly_id=eq.${id}`,
      { method: "GET", headers }
    );
    const allItems = countRes.ok ? await countRes.json() : [];
    const enrichable = allItems.filter((i: { value: string }) => i.value && i.value.trim() !== "").length;
    const totalEnriched = allItems.filter((i: { z2data_enriched_at: string | null }) => i.z2data_enriched_at).length;

    await fetch(
      `${url}/rest/v1/assemblies?id=eq.${id}`,
      {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          z2data_enriched_count: totalEnriched,
          z2data_total_enrichable: enrichable,
        }),
      }
    );

    return NextResponse.json({
      status: "in_progress",
      enriched_in_batch: enrichedCount,
      errors_in_batch: errorCount,
      enriched_total: totalEnriched,
      enrichable_total: enrichable,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
