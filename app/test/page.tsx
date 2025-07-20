import SupabaseTest from "@/components/supabase-test"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Supabase Connection Test</h1>
          <p className="text-muted-foreground mt-2">Test and debug your Supabase connection</p>
        </div>
        <SupabaseTest />
      </div>
    </div>
  )
}
