// ---------------------------------------------------------------------------
// Assembly actions — calls local API routes (which proxy to Supabase on the
// server side, avoiding browser ISO-8859-1 header restrictions).
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
    const res = await fetch("/api/assemblies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error ?? "Failed to create assembly");
    }
    const data = await res.json();
    return { success: true as const, data };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create assembly",
    };
  }
}

export async function listAssemblies() {
  try {
    const res = await fetch("/api/assemblies");
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error ?? "Failed to list assemblies");
    }
    const data = await res.json();
    return { success: true as const, data: data ?? [] };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to list assemblies",
      data: [] as never[],
    };
  }
}

export async function getAssembly(id: string) {
  try {
    const res = await fetch(`/api/assemblies/${id}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error ?? "Failed to load assembly");
    }
    const data = await res.json();
    return { success: true as const, data };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to load assembly",
    };
  }
}

export async function deleteAssembly(id: string) {
  try {
    const res = await fetch(`/api/assemblies/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      throw new Error(err.error ?? "Failed to delete assembly");
    }
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to delete assembly",
    };
  }
}
