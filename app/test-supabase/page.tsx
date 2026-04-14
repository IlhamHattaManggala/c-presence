import { createClient } from '@/lib/supabase/server'

export default async function TestSupabase() {
  const supabase = await createClient()
  
  // Test 1: Try to get current user (even if not logged in)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  // Test 2: Try a simple query to a table (if you have one)
  // For now, let's just check the auth response status
  
  return (
    <div className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      
      <div className="space-y-4">
        <section className="p-4 border rounded bg-zinc-50 dark:bg-zinc-900">
          <h2 className="font-semibold text-lg">Status:</h2>
          <div className="mt-2">
            {!authError ? (
              <span className="text-green-600 font-medium">✅ Terhubung & Login (User: {user?.email})</span>
            ) : authError.message.includes("session missing") ? (
              <span className="text-blue-600 font-medium">🌐 Koneksi Aktif (Siap digunakan, Anda belum login)</span>
            ) : (
              <span className="text-red-600 font-medium">❌ Gagal Terhubung: {authError.message}</span>
            )}
          </div>
        </section>

        <section className="p-4 border rounded bg-zinc-50 dark:bg-zinc-900">
          <h2 className="font-semibold text-lg">Detail:</h2>
          <pre className="mt-2 p-2 bg-black text-white text-xs overflow-auto rounded">
            {JSON.stringify({ 
              url: process.env.NEXT_PUBLIC_SUPABASE_URL,
              hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
              userStatus: user ? "Logged In" : "Not Logged In",
              authError: authError ? authError.message : "None"
            }, null, 2)}
          </pre>
        </section>
      </div>

      <div className="mt-8">
        <p className="text-sm text-zinc-500">
          Halaman ini mengetes koneksi dasar ke Supabase menggunakan Server Component.
        </p>
      </div>
    </div>
  )
}
