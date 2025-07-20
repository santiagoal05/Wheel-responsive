import { createClient } from "@supabase/supabase-js"

// Hardcode the values for now since .env isn't working in v0
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yjgpsqhqacbnilsatccc.supabase.co"
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqZ3BzcWhxYWNibmlsc2F0Y2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTIzMzQsImV4cCI6MjA2ODQyODMzNH0.FEHIqMppOnrIwbYzQ9p1uhbPpyyyUwAKHtwp_JOhqqA"

console.log("🔍 Supabase Environment Check:")
console.log("URL:", supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "❌ Missing")
console.log("Key:", supabaseKey ? `${supabaseKey.substring(0, 20)}...` : "❌ Missing")

let supabase: any = null
let hasSupabase = false

if (supabaseUrl && supabaseKey) {
  try {
    console.log("🚀 Creating Supabase client...")
    supabase = createClient(supabaseUrl, supabaseKey)
    hasSupabase = true
    console.log("✅ Supabase client created successfully")
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    hasSupabase = false
  }
} else {
  console.log("⚠️ Supabase credentials not available")
}

export { supabase, hasSupabase }
