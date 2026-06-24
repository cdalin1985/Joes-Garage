import { isSupabaseConfigured } from "@/lib/env";
import { redirect } from "next/navigation";

export default function SetupPage() {
  if (isSupabaseConfigured()) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-12">
      <div className="card card-pad">
        <h1 className="text-2xl font-bold text-slate-900">Connect your Supabase project</h1>
        <p className="mt-2 text-sm text-slate-600">
          Joe&apos;s Garage is installed but not yet connected to a database. Add these environment
          variables (in <code className="rounded bg-slate-100 px-1">.env.local</code> for local dev,
          or in your Vercel project settings) and restart:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{`NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-publishable-key`}
        </pre>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Create a project at supabase.com.</li>
          <li>
            Run <code className="rounded bg-slate-100 px-1">supabase/schema.sql</code> in the
            project&apos;s SQL Editor.
          </li>
          <li>
            Copy the URL and anon key from <strong>Project Settings → API</strong> into the variables
            above.
          </li>
          <li>Reload this page and sign up — the first account becomes the shop owner.</li>
        </ol>
      </div>
    </main>
  );
}
