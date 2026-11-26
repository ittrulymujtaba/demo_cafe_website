import { Suspense } from "react";
import { signIn } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="font-display text-3xl font-semibold">Café admin</h1>
      <p className="mt-2 text-sm text-espresso/70">Sign in to update your menu, hours and photos.</p>

      <form action={signIn} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-espresso/20 bg-white px-4 py-3 text-base"
          />
        </label>

        {error && <p className="text-sm text-terracotta">Email or password is wrong.</p>}

        <button
          type="submit"
          className="w-full rounded-xl bg-coffee px-4 py-3 text-base font-semibold text-cream"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
