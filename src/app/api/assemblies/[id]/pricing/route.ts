import { NextResponse } from "next/server";
import { enrichPartPricing } from "@/lib/digikey";

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

// POST /api/assemblies/[id]/pricing — fetch DigiKey pricing for BOM items
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { url, headers } = getConfig();

    // 1. Fetch items that are Z2Data-enriched but not yet DigiKey-priced
    const itemsRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=id,value,shorttext&assembly_id=eq.${id}&value=neq.&z2data_enriched_at=not.is.null&digikey_enriched_at=is.null&digikey_error=is.null&limit=${BATCH_SIZE}`,
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
      const countRes = await fetch(
        `${url}/rest/v1/bom_line_items?select=id,digikey_enriched_at,digikey_error,z2data_enriched_at&assembly_id=eq.${id}`,
        { method: "GET", headers }
      );
      const allItems = countRes.ok ? await countRes.json() : [];
      const enrichable = allItems.filter(
        (i: { z2data_enriched_at: string | null }) => i.z2data_enriched_at
      ).length;
      const enriched = allItems.filter(
        (i: { digikey_enriched_at: string | null }) => i.digikey_enriched_at
      ).length;

      const finalStatus = enriched === enrichable ? "completed" : "partial";

      await fetch(`${url}/rest/v1/assemblies?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          digikey_enrichment_status: finalStatus,
          digikey_enriched_count: enriched,
          digikey_total_enrichable: enrichable,
        }),
      });

      return NextResponse.json({
        status: "done",
        enriched_in_batch: 0,
        errors_in_batch: 0,
        enriched_total: enriched,
        enrichable_total: enrichable,
      });
    }

    // 2. Mark assembly as in_progress
    await fetch(`${url}/rest/v1/assemblies?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ digikey_enrichment_status: "in_progress" }),
    });

    // 3. Fetch pricing for each item
    let enrichedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const result = await enrichPartPricing(item.value.trim());

        await fetch(`${url}/rest/v1/bom_line_items?id=eq.${item.id}`, {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({
            digikey_part_number: result.digiKeyPartNumber,
            digikey_unit_price: result.unitPrice,
            digikey_currency: result.currency,
            digikey_stock: result.stock,
            digikey_moq: result.moq,
            digikey_lead_weeks: result.leadWeeks,
            digikey_product_url: result.productUrl,
            digikey_enriched_at: new Date().toISOString(),
          }),
        });
        enrichedCount++;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Unknown error";
        await fetch(`${url}/rest/v1/bom_line_items?id=eq.${item.id}`, {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({ digikey_error: errorMsg }),
        });
        errorCount++;
      }
    }

    // 4. Update assembly progress counters
    const countRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=id,digikey_enriched_at,z2data_enriched_at&assembly_id=eq.${id}`,
      { method: "GET", headers }
    );
    const allItems = countRes.ok ? await countRes.json() : [];
    const enrichable = allItems.filter(
      (i: { z2data_enriched_at: string | null }) => i.z2data_enriched_at
    ).length;
    const totalEnriched = allItems.filter(
      (i: { digikey_enriched_at: string | null }) => i.digikey_enriched_at
    ).length;

    await fetch(`${url}/rest/v1/assemblies?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({
        digikey_enriched_count: totalEnriched,
        digikey_total_enrichable: enrichable,
      }),
    });

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
