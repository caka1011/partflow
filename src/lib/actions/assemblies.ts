// ---------------------------------------------------------------------------
// Assembly actions — uses XMLHttpRequest to avoid browser fetch ByteString
// header restrictions that were causing ISO-8859-1 errors.
// ---------------------------------------------------------------------------

function xhrRequest(
  method: string,
  url: string,
  body?: unknown
): Promise<{ ok: boolean; status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    if (body) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }
    xhr.onload = () => {
      let data: unknown = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(body ? JSON.stringify(body) : null);
  });
}

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
    const res = await xhrRequest("POST", "/api/assemblies", input);
    if (!res.ok) {
      const err = res.data as { error?: string } | null;
      throw new Error(err?.error ?? "Failed to create assembly");
    }
    return { success: true as const, data: res.data };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to create assembly",
    };
  }
}

export async function listAssemblies() {
  try {
    const res = await xhrRequest("GET", "/api/assemblies");
    if (!res.ok) {
      const err = res.data as { error?: string } | null;
      throw new Error(err?.error ?? "Failed to list assemblies");
    }
    return { success: true as const, data: (res.data ?? []) as Record<string, unknown>[] };
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
    const res = await xhrRequest("GET", `/api/assemblies/${id}`);
    if (!res.ok) {
      const err = res.data as { error?: string } | null;
      throw new Error(err?.error ?? "Failed to load assembly");
    }
    return { success: true as const, data: res.data };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to load assembly",
    };
  }
}

export async function deleteAssembly(id: string) {
  try {
    const res = await xhrRequest("DELETE", `/api/assemblies/${id}`);
    if (!res.ok) {
      const err = res.data as { error?: string } | null;
      throw new Error(err?.error ?? "Failed to delete assembly");
    }
    return { success: true as const };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to delete assembly",
    };
  }
}
