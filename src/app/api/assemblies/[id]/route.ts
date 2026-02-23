import { NextResponse } from "next/server";

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
  const url = ascii(rawUrl.trim());
  const key = ascii(rawKey.trim());
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  };
}

// GET /api/assemblies/[id] — get assembly + BOM line items
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { url, headers } = getConfig();

    // Fetch assembly
    const assemblyRes = await fetch(
      `${url}/rest/v1/assemblies?select=*&id=eq.${id}`,
      { method: "GET", headers }
    );
    if (!assemblyRes.ok) {
      const err = await assemblyRes
        .json()
        .catch(() => ({ message: assemblyRes.statusText }));
      return NextResponse.json(
        { error: err.message ?? "Failed to load assembly" },
        { status: assemblyRes.status }
      );
    }
    const assemblies = await assemblyRes.json();
    if (!assemblies?.length) {
      return NextResponse.json(
        { error: "Assembly not found" },
        { status: 404 }
      );
    }

    // Fetch BOM line items
    const bomRes = await fetch(
      `${url}/rest/v1/bom_line_items?select=*&assembly_id=eq.${id}&order=line_number.asc`,
      { method: "GET", headers }
    );
    if (!bomRes.ok) {
      const err = await bomRes
        .json()
        .catch(() => ({ message: bomRes.statusText }));
      return NextResponse.json(
        { error: err.message ?? "Failed to load BOM items" },
        { status: bomRes.status }
      );
    }
    const lineItems = await bomRes.json();

    return NextResponse.json({
      ...assemblies[0],
      bom_line_items: lineItems ?? [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/assemblies/[id] — delete assembly (cascade deletes BOM items)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { url, headers } = getConfig();

    const res = await fetch(
      `${url}/rest/v1/assemblies?id=eq.${id}`,
      { method: "DELETE", headers }
    );
    if (!res.ok) {
      const err = await res
        .json()
        .catch(() => ({ message: res.statusText }));
      return NextResponse.json(
        { error: err.message ?? "Failed to delete assembly" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
