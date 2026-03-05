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

    // Map manufacturing locations
    const rawOrigin = details?.ManufacturingLocations?.CountryofOrigin;
    const countryOfOrigin = rawOrigin?.length
      ? rawOrigin.map((o: { CountryName: string; TrustLevel: string }) => ({ countryName: o.CountryName, trustLevel: o.TrustLevel }))
      : null;

    const rawLocations = details?.ManufacturingLocations?.Locations;
    const manufacturingLocations = rawLocations?.length
      ? rawLocations.map((l: { FacilityType: string; CountryName: string; CityName: string; SiteOwner: string; TrustLevel: string }) => ({
          facilityType: l.FacilityType,
          countryName: l.CountryName,
          cityName: l.CityName,
          siteOwner: l.SiteOwner,
          trustLevel: l.TrustLevel,
        }))
      : null;

    const rawTrades = details?.TradeCodes;
    const tradeCodes = rawTrades?.length
      ? rawTrades.map((t: { Name: string; Value: string }) => ({ name: t.Name, value: t.Value }))
      : null;

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
      z2data_lifecycle_source: details?.Lifecycle?.LifecycleSource ?? "",
      z2data_estimated_years_to_eol: details?.Lifecycle?.EstimatedYearsToEOL ?? null,
      z2data_lc_comment: details?.Lifecycle?.LCComment ?? "",
      z2data_forecasted_obsolescence_year: details?.Lifecycle?.ForecastedObsolescenceYear ?? null,
      z2data_rohs_version: details?.ComplianceDetails?.RoHSVersion ?? "",
      z2data_reach_version: details?.ComplianceDetails?.REACHVersion ?? "",
      z2data_china_rohs: details?.ComplianceDetails?.ChinaRoHS ?? "",
      z2data_tsca: details?.ComplianceDetails?.TSCA ?? "",
      z2data_ca_prop65: details?.ComplianceDetails?.CAProp65 ?? "",
      z2data_scip_id: details?.ComplianceDetails?.SCIPID ?? "",
      z2data_lead_free_status: details?.ComplianceDetails?.LeadFreeStatus ?? "",
      z2data_country_of_origin: countryOfOrigin,
      z2data_manufacturing_locations: manufacturingLocations,
      z2data_trade_codes: tradeCodes,
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
