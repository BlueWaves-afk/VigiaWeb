import { NextResponse } from "next/server";
// 1. Import the correct function
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // 2. Instantiate the client asynchronously
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  return NextResponse.json({ 
    session: session ? "ok" : null, 
    user: user?.id ?? null 
  });
}
