import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: "return=representation",
};

// GET /api/assemblies — list all assemblies
export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/assemblies?select=*&order=created_at.desc`,
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
}

// POST /api/assemblies — create assembly + BOM line items
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, customer, items } = body;

  const totalQuantity = (items as { quantity: number }[]).reduce(
    (sum: number, i: { quantity: number }) => sum + i.quantity,
    0
  );

  // 1. Insert assembly
  const assemblyRes = await fetch(`${SUPABASE_URL}/rest/v1/assemblies`, {
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
    const bomRes = await fetch(`${SUPABASE_URL}/rest/v1/bom_line_items`, {
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
}
