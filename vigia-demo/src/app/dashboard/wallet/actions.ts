"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Helper: get current authed user id (throws if unauthenticated). */
async function requireUserId() {
  const supa = await createClient();
  const {
    data: { user },
    error,
  } = await supa.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  return user.id;
}

/**
 * NOTE: This uses the session-bound server client created by createClient().
 * Ensure your `credit_vgt` and `credit_dc` functions are callable by the
 * authenticated user (e.g., via RLS or SECURITY DEFINER) since we’re not
 * using a service-role client here.
 */
export async function actionAirdropVGT(amount: number = 10) {
  const uid = await requireUserId();
  const supa = await createClient();

  const { error } = await supa.rpc("credit_vgt", {
    p_user: uid,
    p_amount: amount,
    p_memo: "demo airdrop",
  });
  if (error) throw error;

  revalidatePath("/wallet");
}

export async function actionBuyDC(amount: number = 500) {
  const uid = await requireUserId();
  const supa = await createClient();

  // requires the SQL function credit_dc (see section 0)
  const { error } = await supa.rpc("credit_dc", {
    p_user: uid,
    p_amount: amount,
    p_memo: "demo purchase",
  });
  if (error) throw error;

  revalidatePath("/wallet");
}