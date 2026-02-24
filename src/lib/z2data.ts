// ---------------------------------------------------------------------------
// Z2Data API client — server-side only
// Docs: https://gateway.z2data.com/swagger/index.html
// ---------------------------------------------------------------------------

const BASE_URL = "https://gateway.z2data.com";

function getApiKey(): string {
  const key = process.env.Z2DATA_API_KEY;
  if (!key) throw new Error("Z2DATA_API_KEY is not configured");
  return key;
}

// -- Part Search types (GET /GetPartDetailsBySearch) --

interface PartSearchItem {
  Datasheet: string;
  PartID: number;
  MPN: string;
  Manufacturer: string;
  Description: string;
  ProductType?: string;
}

interface PartSearchResponse {
  statusCode: number;
  status: string;
  results: {
    PartSearch: {
      Result: PartSearchItem[];
      TotalCount: number;
      PageNum: number;
      Size: number;
    };
  };
}

// -- Part Details types (GET /GetPartDetailsbyPartID) --

interface PartDetailsResponse {
  statusCode: number;
  status: string;
  results: {
    MPNSummary: {
      PartID: number;
      SupplierID: number;
      MPN: string;
      Supplier: string;
      Description: string;
      DataSheet: string;
    };
    Lifecycle: {
      LifecycleStatus: string;
      LifecycleSource: string;
      EstimatedYearsToEOL: number;
      ForecastedObsolescenceYear: number;
    };
    ComplianceDetails: {
      RoHSStatus: string;
      REACHStatus: string;
      RoHSVersion: string;
      REACHVersion: string;
      HalogenFreeStatus: string;
      LeadFreeStatus: string;
    };
  };
}

export interface Z2DataEnrichmentResult {
  partId: string;
  manufacturer: string;
  description: string;
  lifecycleStatus: string;
  rohs: string;
  reach: string;
  datasheetUrl: string;
}

/** Search Z2Data by MPN — returns first matching part from PartSearch */
export async function searchPart(mpn: string): Promise<PartSearchItem | null> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/GetPartDetailsBySearch?ApiKey=${encodeURIComponent(apiKey)}&Z2MPN=${encodeURIComponent(mpn)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await res.json();

  // API returns statusCode 401 for invalid key
  if (data.statusCode === 401) {
    throw new Error(`Z2Data auth failed: ${data.status}`);
  }
  if (data.statusCode !== 200) {
    throw new Error(`Z2Data search error (${data.statusCode}): ${data.status}`);
  }

  const results = data.results?.PartSearch?.Result ?? [];
  if (!results.length) return null;

  return results[0];
}

/** Get full part details by PartID — lifecycle, compliance, etc. */
export async function getPartDetails(
  partId: number
): Promise<PartDetailsResponse["results"] | null> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/GetPartDetailsbyPartID?ApiKey=${encodeURIComponent(apiKey)}&PartID=${partId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const data = await res.json();

  if (data.statusCode !== 200) {
    throw new Error(`Z2Data details error (${data.statusCode}): ${data.status}`);
  }

  return data.results ?? null;
}

/** Enrich a single MPN — chains search + details, returns combined result */
export async function enrichPart(mpn: string): Promise<Z2DataEnrichmentResult> {
  // Step 1: search by MPN
  const searchResult = await searchPart(mpn);
  if (!searchResult) {
    throw new Error(`No Z2Data results for MPN: ${mpn}`);
  }

  // Step 2: get full details by PartID
  let details: PartDetailsResponse["results"] | null = null;
  if (searchResult.PartID) {
    try {
      details = await getPartDetails(searchResult.PartID);
    } catch {
      // Fall back to search-only data
    }
  }

  return {
    partId: String(searchResult.PartID),
    manufacturer: details?.MPNSummary?.Supplier ?? searchResult.Manufacturer ?? "",
    description: details?.MPNSummary?.Description ?? searchResult.Description ?? "",
    lifecycleStatus: details?.Lifecycle?.LifecycleStatus ?? "",
    rohs: details?.ComplianceDetails?.RoHSStatus ?? "",
    reach: details?.ComplianceDetails?.REACHStatus ?? "",
    datasheetUrl: details?.MPNSummary?.DataSheet ?? searchResult.Datasheet ?? "",
  };
}
