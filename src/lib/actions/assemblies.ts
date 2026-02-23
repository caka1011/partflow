"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
  const supabase = getSupabase();

  const totalQuantity = input.items.reduce((sum, i) => sum + i.quantity, 0);

  // 1. Insert the assembly row
  const { data: assembly, error: assemblyError } = await supabase
    .from("assemblies")
    .insert({
      name: input.name,
      customer: input.customer,
      status: "Draft",
      line_item_count: input.items.length,
      total_quantity: totalQuantity,
    })
    .select()
    .single();

  if (assemblyError || !assembly) {
    return {
      success: false as const,
      error: assemblyError?.message ?? "Failed to create assembly",
    };
  }

  // 2. Insert BOM line items in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < input.items.length; i += BATCH_SIZE) {
    const batch = input.items.slice(i, i + BATCH_SIZE).map((item) => ({
      assembly_id: assembly.id,
      ...item,
    }));

    const { error: itemsError } = await supabase
      .from("bom_line_items")
      .insert(batch);

    if (itemsError) {
      // Clean up: delete the assembly (cascade removes any inserted items)
      await supabase.from("assemblies").delete().eq("id", assembly.id);
      return { success: false as const, error: itemsError.message };
    }
  }

  revalidatePath("/assemblies");
  return { success: true as const, data: assembly };
}

// ---------------------------------------------------------------------------
// List Assemblies
// ---------------------------------------------------------------------------

export async function listAssemblies() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("assemblies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false as const, error: error.message, data: [] as never[] };
  }

  return { success: true as const, data: data ?? [] };
}

// ---------------------------------------------------------------------------
// Get Assembly Detail (with BOM line items)
// ---------------------------------------------------------------------------

export async function getAssembly(id: string) {
  const supabase = getSupabase();

  const { data: assembly, error: assemblyError } = await supabase
    .from("assemblies")
    .select("*")
    .eq("id", id)
    .single();

  if (assemblyError || !assembly) {
    return { success: false as const, error: "Assembly not found" };
  }

  const { data: lineItems, error: itemsError } = await supabase
    .from("bom_line_items")
    .select("*")
    .eq("assembly_id", id)
    .order("line_number", { ascending: true });

  if (itemsError) {
    return { success: false as const, error: itemsError.message };
  }

  return {
    success: true as const,
    data: { ...assembly, bom_line_items: lineItems ?? [] },
  };
}

// ---------------------------------------------------------------------------
// Delete Assembly
// ---------------------------------------------------------------------------

export async function deleteAssembly(id: string) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("assemblies")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false as const, error: error.message };
  }

  revalidatePath("/assemblies");
  return { success: true as const };
}
