// ---------------------------------------------------------------------------
// DigiKey Product Information V4 API client — server-side only
// Uses 2-legged OAuth2 (client credentials)
// Docs: https://developer.digikey.com/products/product-information-v4
// ---------------------------------------------------------------------------

const API_BASE = "https://api.digikey.com";
const TOKEN_URL = `${API_BASE}/v1/oauth2/token`;
const PRODUCTS_BASE = `${API_BASE}/products/v4`;

// -- In-memory token cache --

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

// -- Credentials --

function getCredentials() {
  const clientId = process.env.DIGIKEY_CLIENT_ID;
  const clientSecret = process.env.DIGIKEY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("DIGIKEY_CLIENT_ID and DIGIKEY_CLIENT_SECRET must be configured");
  }
  return { clientId, clientSecret };
}

// -- OAuth2 token management (2-legged / client credentials) --

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiKey token request failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// -- API request helper --

async function digikeyGet(path: string): Promise<Response> {
  const { clientId } = getCredentials();
  const token = await getAccessToken();

  return fetch(`${PRODUCTS_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-DIGIKEY-Client-Id": clientId,
      "X-DIGIKEY-Locale-Site": "DE",
      "X-DIGIKEY-Locale-Language": "EN",
      "X-DIGIKEY-Locale-Currency": "EUR",
      Accept: "application/json",
    },
  });
}

// -- Types --

export interface DigiKeyPriceBreak {
  BreakQuantity: number;
  UnitPrice: number;
  TotalPrice: number;
}

export interface DigiKeyPricingResult {
  digiKeyPartNumber: string;
  manufacturerPartNumber: string;
  unitPrice: number;
  currency: string;
  stock: number;
  moq: number;
  leadWeeks: string;
  productUrl: string;
  priceBreaks: DigiKeyPriceBreak[];
}

interface ProductPricingVariation {
  DigiKeyProductNumber?: string;
  QuantityAvailableforPackageType?: number;
  MinimumOrderQuantity?: number;
  PackageType?: { Id?: number; Name?: string };
  MarketPlace?: boolean;
  StandardPricing?: DigiKeyPriceBreak[];
  MyPricing?: DigiKeyPriceBreak[];
}

interface ProductPricing {
  ManufacturerProductNumber?: string;
  Manufacturer?: { Id?: number; Name?: string };
  Description?: { ProductDescription?: string; DetailedDescription?: string };
  QuantityAvailable?: number;
  ProductUrl?: string;
  ManufacturerLeadWeeks?: string;
  ManufacturerPublicQuantity?: number;
  StandardPackage?: number;
  IsDiscontinued?: boolean;
  IsObsolete?: boolean;
  ProductVariations?: ProductPricingVariation[];
}

interface ProductPricingResponse {
  ProductPricings?: ProductPricing[];
  ProductsCount?: number;
}

// -- Public API --

/**
 * Search DigiKey pricing for a given part number.
 * Returns pricing info for the best match, or null if not found.
 */
export async function searchProductPricing(
  mpn: string
): Promise<DigiKeyPricingResult | null> {
  const encoded = encodeURIComponent(mpn);
  const res = await digikeyGet(
    `/search/${encoded}/pricing?limit=1&inStock=false&excludeMarketplace=true`
  );

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiKey pricing error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data: ProductPricingResponse = await res.json();

  const product = data.ProductPricings?.[0];
  if (!product) return null;

  // Find the best non-marketplace variation (prefer Tape & Reel or Cut Tape)
  const variation = product.ProductVariations?.[0];

  const priceBreaks =
    variation?.StandardPricing ?? [];
  const unitPrice = priceBreaks.length > 0 ? priceBreaks[0].UnitPrice : 0;

  return {
    digiKeyPartNumber: variation?.DigiKeyProductNumber ?? "",
    manufacturerPartNumber: product.ManufacturerProductNumber ?? mpn,
    unitPrice,
    currency: "EUR",
    stock: product.QuantityAvailable ?? 0,
    moq: variation?.MinimumOrderQuantity ?? 1,
    leadWeeks: product.ManufacturerLeadWeeks ?? "",
    productUrl: product.ProductUrl ?? "",
    priceBreaks,
  };
}

/**
 * Enrich a single MPN with DigiKey pricing.
 * Tries exact MPN first, then a stripped version (no dashes, dots, spaces).
 */
export async function enrichPartPricing(
  mpn: string
): Promise<DigiKeyPricingResult> {
  // Strategy 1: exact MPN
  let result = await searchProductPricing(mpn);
  if (result) return result;

  // Strategy 2: stripped MPN (remove dashes, dots, spaces, slashes)
  const stripped = mpn.replace(/[-.\s/]/g, "");
  if (stripped !== mpn && stripped.length > 0) {
    result = await searchProductPricing(stripped);
    if (result) return result;
  }

  throw new Error(`No DigiKey results for MPN: ${mpn}`);
}
