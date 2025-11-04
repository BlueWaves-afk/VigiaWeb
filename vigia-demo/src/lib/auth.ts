// src/lib/auth.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    console.error('Sign up error:', error.message)
    return redirect('/auth/signup?error=' + error.message)
  }

  return redirect('/auth/signup?message=Check email to continue sign in process')
}

export async function signIn(formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error.message)
    return redirect('/auth/signin?error=' + error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// --- THIS IS THE FUNCTION YOUR SIDEBAR NEEDS ---
export async function signOut() {
  'use server'
  
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/auth/signin')
}