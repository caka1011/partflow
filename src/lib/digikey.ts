// ---------------------------------------------------------------------------
// DigiKey Product Information V4 API client — server-side only
// Uses 3-legged OAuth2 (authorization code + refresh token)
// Docs: https://developer.digikey.com/products/product-information-v4
// ---------------------------------------------------------------------------

const SANDBOX = process.env.DIGIKEY_SANDBOX !== "false"; // default to sandbox
const API_BASE = SANDBOX
  ? "https://sandbox-api.digikey.com"
  : "https://api.digikey.com";
const TOKEN_URL = `${API_BASE}/v1/oauth2/token`;
const AUTHORIZE_URL = `${API_BASE}/v1/oauth2/authorize`;
const PRODUCTS_BASE = `${API_BASE}/products/v4`;

// -- Supabase REST helper (same pattern as enrich/route.ts) --

function ascii(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[^\x20-\x7E]/g, "");
}

function getSupabaseConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) {
    throw new Error("Missing Supabase env vars");
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

function getRedirectUri(): string {
  const uri = process.env.DIGIKEY_REDIRECT_URI;
  if (!uri) {
    throw new Error("DIGIKEY_REDIRECT_URI must be configured");
  }
  return uri;
}

// -- OAuth2 token management (3-legged) --

/** Build the DigiKey authorization URL for the browser redirect. */
export function getAuthorizationUrl(): string {
  const { clientId } = getCredentials();
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/** Check if a token row exists in Supabase. */
export async function isDigikeyAuthorized(): Promise<boolean> {
  const { url, headers } = getSupabaseConfig();
  const res = await fetch(
    `${url}/rest/v1/digikey_oauth_tokens?select=id&id=eq.1`,
    { method: "GET", headers }
  );
  if (!res.ok) return false;
  const rows = await res.json();
  return rows.length > 0;
}

/** Exchange an authorization code for access + refresh tokens, store in Supabase. */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const { clientId, clientSecret } = getCredentials();
  const redirectUri = getRedirectUri();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiKey token exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  await upsertTokens(data.access_token, data.refresh_token, data.expires_in);
}

/** Refresh the access token using the stored refresh token. */
async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = getCredentials();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiKey token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  await upsertTokens(data.access_token, data.refresh_token, data.expires_in);

  return data.access_token;
}

/** Upsert token pair into Supabase (single-row table). */
async function upsertTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const { url, headers } = getSupabaseConfig();
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const res = await fetch(`${url}/rest/v1/digikey_oauth_tokens`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id: 1,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to store DigiKey tokens: ${text}`);
  }

  // Update in-memory cache
  cachedToken = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}

/** Load token from cache or Supabase, refresh if expired. */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  // Load from Supabase
  const { url, headers } = getSupabaseConfig();
  const res = await fetch(
    `${url}/rest/v1/digikey_oauth_tokens?select=access_token,refresh_token,expires_at&id=eq.1`,
    { method: "GET", headers }
  );

  if (!res.ok) {
    throw new Error("Failed to load DigiKey tokens from database");
  }

  const rows = await res.json();
  if (rows.length === 0) {
    throw new Error(
      "DigiKey not authorized. Please connect your DigiKey account first."
    );
  }

  const row = rows[0];
  const expiresAt = new Date(row.expires_at).getTime();

  // If token is still valid, cache and return it
  if (Date.now() < expiresAt - 60_000) {
    cachedToken = { accessToken: row.access_token, expiresAt };
    return row.access_token;
  }

  // Token expired — refresh it
  return refreshAccessToken(row.refresh_token);
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
