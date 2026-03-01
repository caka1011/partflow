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

export interface PartSearchItem {
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

/**
 * Generate candidate search terms for an MPN using progressive shortening
 * and character-stripping strategies.
 */
function generateMpnVariants(mpn: string): string[] {
  const variants: string[] = [];

  // 1. Strip special characters (dashes, dots, spaces, slashes)
  const stripped = mpn.replace(/[-.\s/]/g, "");
  if (stripped !== mpn && stripped.length > 0) {
    variants.push(stripped);
  }

  // 2. Progressive shortening — remove 1-char at a time from the end,
  //    down to a minimum of 5 characters (to avoid overly broad matches)
  const minLen = Math.max(5, Math.floor(mpn.length * 0.5));
  for (let len = mpn.length - 1; len >= minLen; len--) {
    const shortened = mpn.slice(0, len);
    if (!variants.includes(shortened)) {
      variants.push(shortened);
    }
  }

  // 3. Also try shortened versions of the stripped form
  if (stripped !== mpn && stripped.length > 5) {
    const strippedMin = Math.max(5, Math.floor(stripped.length * 0.5));
    for (let len = stripped.length - 1; len >= strippedMin; len--) {
      const shortened = stripped.slice(0, len);
      if (!variants.includes(shortened)) {
        variants.push(shortened);
      }
    }
  }

  return variants;
}

/** Enrich a single MPN — chains search + details, returns combined result.
 *  Tries exact MPN first, then stripped (no dashes/dots/spaces). If the
 *  stripped search returns exactly one match it's used automatically.
 *  Zero or multiple matches → throws so the item goes to manual resolution. */
export async function enrichPart(mpn: string): Promise<Z2DataEnrichmentResult> {
  // Step 1: search by exact MPN
  let searchResult = await searchPart(mpn);

  // Step 2: if exact fails, try stripped version (remove dashes, dots, spaces, slashes)
  if (!searchResult) {
    const stripped = mpn.replace(/[-.\s/]/g, "");
    if (stripped !== mpn && stripped.length > 0) {
      const strippedResults = await searchAllParts(stripped);
      if (strippedResults.length === 1) {
        // Unambiguous match — use it
        searchResult = strippedResults[0];
      } else if (strippedResults.length > 1) {
        throw new Error(
          `Multiple Z2Data matches for MPN: ${mpn} (${strippedResults.length} results) — resolve manually`
        );
      }
    }
  }

  if (!searchResult) {
    throw new Error(`No Z2Data results for MPN: ${mpn}`);
  }

  // Step 3: get full details by PartID
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

// ---------------------------------------------------------------------------
// Candidate search — used by the manual resolution flow
// ---------------------------------------------------------------------------

/** Search Z2Data and return ALL matching parts (not just the first) */
async function searchAllParts(query: string): Promise<PartSearchItem[]> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/GetPartDetailsBySearch?ApiKey=${encodeURIComponent(apiKey)}&Z2MPN=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = await res.json();
  if (data.statusCode === 401) {
    throw new Error(`Z2Data auth failed: ${data.status}`);
  }
  if (data.statusCode !== 200) return [];
  return data.results?.PartSearch?.Result ?? [];
}

/**
 * Search Z2Data using multiple strategies and return all unique candidates.
 * Strategies: exact MPN → stripped MPN → shortened variants → shorttext.
 */
export async function searchPartCandidates(
  mpn: string,
  shorttext?: string
): Promise<PartSearchItem[]> {
  const seen = new Set<number>();
  const candidates: PartSearchItem[] = [];
  const MAX_CANDIDATES = 20;

  function addResults(items: PartSearchItem[]) {
    for (const item of items) {
      if (!seen.has(item.PartID)) {
        seen.add(item.PartID);
        candidates.push(item);
      }
    }
  }

  // Strategy 1: exact MPN (return all results)
  addResults(await searchAllParts(mpn));
  if (candidates.length >= MAX_CANDIDATES) return candidates.slice(0, MAX_CANDIDATES);

  // Strategy 2: MPN variants (stripped chars + progressive shortening)
  const variants = generateMpnVariants(mpn);
  for (const variant of variants) {
    addResults(await searchAllParts(variant));
    if (candidates.length >= MAX_CANDIDATES) break;
  }
  if (candidates.length >= MAX_CANDIDATES) return candidates.slice(0, MAX_CANDIDATES);

  // Strategy 3: search by shorttext (component description)
  if (shorttext && shorttext.trim()) {
    addResults(await searchAllParts(shorttext.trim()));
  }

  return candidates.slice(0, MAX_CANDIDATES);
}
