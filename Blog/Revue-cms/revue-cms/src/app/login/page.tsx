import { login } from './actions';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export const metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-ink p-12 text-white md:flex md:flex-col md:justify-between">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">Revue</Link>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/60">CMS</p>
          <h2 className="mt-3 font-display text-4xl font-bold leading-tight">
            Write things<br />worth reading.
          </h2>
          <p className="mt-4 max-w-sm text-white/70">
            The Revue editorial workspace for the team.
          </p>
        </div>
        <div className="absolute right-12 top-12 h-24 w-24 rounded-full bg-highlight opacity-90" />
      </div>

      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold tracking-tight">Sign in to Revue CMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin access only. Sign in with your authorized account.
          </p>

          {sp.error && (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {sp.error}
            </div>
          )}
          {sp.message && (
            <div className="mt-6 rounded-md border border-brand/30 bg-brand/10 p-3 text-sm text-brand">
              {sp.message}
            </div>
          )}

          <form action={login} className="mt-8 space-y-4">
            <input type="hidden" name="next" value={sp.next || '/cms'} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full pt-2">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground">
            By signing in you agree to our{' '}
            <a className="underline" href="https://revuesuite.com/terms">terms</a> and{' '}
            <a className="underline" href="https://revuesuite.com/privacy">privacy policy</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
