import { NextRequest, NextResponse } from "next/server";

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(`Missing env vars: URL=${!!url}, KEY=${!!key}`);
  }
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=representation",
    },
  };
}

// GET /api/assemblies — list all assemblies
export async function GET() {
  try {
    const { url, headers } = getConfig();
    const res = await fetch(
      `${url}/rest/v1/assemblies?select=*&order=created_at.desc`,
      { method: "GET", headers }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      return NextResponse.json(
        { error: err.message ?? "Failed to list assemblies" },
        { status: res.status }
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/assemblies — create assembly + BOM line items
export async function POST(req: NextRequest) {
  try {
    const { url, headers } = getConfig();
    const body = await req.json();
    const { name, customer, items } = body;

    const totalQuantity = (items as { quantity: number }[]).reduce(
      (sum: number, i: { quantity: number }) => sum + i.quantity,
      0
    );

    // 1. Insert assembly
    const assemblyRes = await fetch(`${url}/rest/v1/assemblies`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name,
        customer,
        status: "Draft",
        line_item_count: items.length,
        total_quantity: totalQuantity,
      }),
    });
    if (!assemblyRes.ok) {
      const err = await assemblyRes
        .json()
        .catch(() => ({ message: assemblyRes.statusText }));
      return NextResponse.json(
        { error: err.message ?? "Failed to create assembly" },
        { status: assemblyRes.status }
      );
    }
    const [assembly] = await assemblyRes.json();

    // 2. Insert BOM line items in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE).map(
        (item: Record<string, unknown>) => ({
          assembly_id: assembly.id,
          ...item,
        })
      );
      const bomRes = await fetch(`${url}/rest/v1/bom_line_items`, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
      });
      if (!bomRes.ok) {
        const err = await bomRes
          .json()
          .catch(() => ({ message: bomRes.statusText }));
        return NextResponse.json(
          { error: err.message ?? "Failed to insert BOM items" },
          { status: bomRes.status }
        );
      }
    }

    return NextResponse.json(assembly, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 }
    );
  }
}
