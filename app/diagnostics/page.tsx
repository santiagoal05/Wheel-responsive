import ConnectionDiagnostics from "@/components/connection-diagnostics"

export default function DiagnosticsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Connection Diagnostics</h1>
          <p className="text-muted-foreground mt-2">Test and troubleshoot your Supabase connection</p>
        </div>
        <ConnectionDiagnostics />
      </div>
    </div>
  )
}
