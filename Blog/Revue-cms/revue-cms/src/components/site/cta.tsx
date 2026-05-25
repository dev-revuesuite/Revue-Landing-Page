export function NewsletterCTA() {
  return (
    <section className="mx-auto max-w-[1200px] px-7 pb-7">
      <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-ink px-10 py-10 text-white md:flex-row md:items-center">
        <div className="flex-1">
          <p className="eyebrow eyebrow-dot text-highlight">Join the beta</p>
          <h3 className="headline-serif mt-3 text-[26px] leading-tight">
            The newsletter for creative agency operators.
          </h3>
          <p className="mt-2 text-sm text-[#b4b2a9]">One essay every Thursday. No fluff, no roundups.</p>
        </div>
        <form
          action="https://revuesuite.com/api/beta"
          method="POST"
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <input
            required
            type="email"
            name="email"
            placeholder="you@studio.com"
            className="w-full rounded-full border border-white/20 bg-white/[0.08] px-4 py-2.5 text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-highlight sm:w-[220px]"
          />
          <button
            type="submit"
            className="rounded-full bg-highlight px-[18px] py-2.5 text-[13px] font-medium text-ink transition-opacity hover:opacity-90"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}

export function InlineCTA() {
  return (
    <aside className="my-12 rounded-xl border-l-4 border-brand bg-warm/60 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="headline-serif text-lg">Build with Revue</p>
          <p className="text-sm text-stone">A modern workspace built for creative agencies.</p>
        </div>
        <a href="https://revuesuite.com/beta" className="btn-mock-dark shrink-0">
          Join the beta →
        </a>
      </div>
    </aside>
  );
}
