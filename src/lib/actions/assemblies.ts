const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const JSON_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  Prefer: "return=representation",
};

async function supabasePost(table: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

async function supabaseGet(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

async function supabaseDelete(table: string, query: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
}

// ---------------------------------------------------------------------------
// Create Assembly + BOM line items
// ---------------------------------------------------------------------------

interface CreateAssemblyInput {
  name: string;
  customer: string;
  items: Array<{
    line_number: number;
    section: string;
    value: string;
    shorttext: string;
    quantity: number;
    supplier1_name: string | null;
    supplier1_order_number: string | null;
    supplier2_name: string | null;
    supplier2_order_number: string | null;
  }>;
}

export async function createAssembly(input: CreateAssemblyInput) {
  try {
    const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);

    // 1. Insert assembly
    const [assembly] = await supabasePost("assemblies", {
      name: input.name,
      customer: input.customer,
      status: "Draft",
      line_item_count: input.items.length,
      total_quantity: totalQuantity,
    });

    // 2. Insert BOM line items in batches
    const BATCH_SIZE = 500;
    for (let i = 0; i < input.items.length; i += BATCH_SIZE) {
      const batch = input.items.slice(i, i + BATCH_SIZE).map((item) => ({
        assembly_id: assembly.id,
        ...item,
      }));
      await supabasePost("bom_line_items", batch);
    }

    return { success: true as const, data: assembly };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create assembly",
    };
  }
}

// ---------------------------------------------------------------------------
// List Assemblies
// ---------------------------------------------------------------------------

export async function listAssemblies() {
  try {
    const data = await supabaseGet(
      "assemblies",
      "select=*&order=created_at.desc"
    );
    return { success: true as const, data: data ?? [] };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to list assemblies",
      data: [] as never[],
    };
  }
}

// ---------------------------------------------------------------------------
// Get Assembly Detail
// ---------------------------------------------------------------------------

export async function getAssembly(id: string) {
  try {
    const assemblies = await supabaseGet(
      "assemblies",
      `select=*&id=eq.${id}`
    );
    if (!assemblies?.length) {
      return { success: false as const, error: "Assembly not found" };
    }

    const lineItems = await supabaseGet(
      "bom_line_items",
      `select=*&assembly_id=eq.${id}&order=line_number.asc`
    );

    return {
      success: true as const,
      data: { ...assemblies[0], bom_line_items: lineItems ?? [] },
    };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to load assembly",
    };
  }
}

// ---------------------------------------------------------------------------
// Delete Assembly
// ---------------------------------------------------------------------------

export async function deleteAssembly(id: string) {
  try {
    await supabaseDelete("assemblies", `id=eq.${id}`);
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to delete assembly",
    };
  }
}
