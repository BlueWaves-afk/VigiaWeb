// src/app/(dashboard)/datasets/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { getLocalDataset } from "./manifest";

/**
 * Returns the gated download URL for a dataset the user already owns.
 * Uses slug, not DB id.
 */
export async function getSignedDownload(slug: string) {
  const supa = await createClient();

  const { data: userRes, error: authErr } = await supa.auth.getUser();
  if (authErr || !userRes?.user) throw new Error("Unauthorized");

  const uid = userRes.user.id;

  // Check ownership (we store slug in dataset_purchases.dataset_id)
  const { data: own, error: eOwn } = await supa
    .from("dataset_purchases")
    .select("dataset_id")
    .eq("user_id", uid)
    .eq("dataset_id", slug)
    .maybeSingle();

  if (eOwn) throw new Error("Failed to check ownership");
  if (!own) throw new Error("Not purchased");

  // For local files served from public/
  return { url: `/datasets/${slug}.json` };
}

/**
 * Purchase (deduct DC) and return a gated download URL.
 * Uses slug and a local manifest; no datasets table dependency.
 */
export async function purchaseAndGetDownload(slug: string) {
  const supa = await createClient();

  const { data: userRes, error: authErr } = await supa.auth.getUser();
  if (authErr || !userRes?.user) throw new Error("Unauthorized");
  const uid = userRes.user.id;

  // Look up dataset from local manifest
  const ds = getLocalDataset(slug);
  if (!ds) throw new Error("Dataset not found");

  // See if already owned
  const { data: own } = await supa
    .from("dataset_purchases")
    .select("dataset_id")
    .eq("user_id", uid)
    .eq("dataset_id", slug)
    .maybeSingle();

  if (!own) {
    // Check credits
    const { data: bal, error: eBal } = await supa
      .from("user_balances")
      .select("data_credits")
      .eq("user_id", uid)
      .single();

    if (eBal) throw new Error("Failed to fetch balance");
    const dc = bal?.data_credits ?? 0;
    if (dc < ds.price_dc) throw new Error("Insufficient credits");

    // Deduct DC + record purchase (wrap in a transaction if you have an RPC; else do best-effort)
    const { error: eDec } = await supa
      .from("user_balances")
      .update({ data_credits: (dc - ds.price_dc) })
      .eq("user_id", uid);
    if (eDec) throw new Error("Failed to debit credits");

    const { error: eIns } = await supa.from("dataset_purchases").insert({
      user_id: uid,
      dataset_id: slug,   // store slug (text)
      amount_dc: ds.price_dc,
    });
    if (eIns) throw new Error("Failed to record purchase");
  }

  return { url: `/datasets/${slug}.json` };
}