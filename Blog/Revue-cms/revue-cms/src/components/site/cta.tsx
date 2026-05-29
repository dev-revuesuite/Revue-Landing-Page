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
        <a
          href="https://revuesuite.com/join-beta.html"
          className="rounded-full bg-highlight px-[22px] py-2.5 text-[13px] font-medium text-ink transition-opacity hover:opacity-90"
        >
          Join the waitlist →
        </a>
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
        <a href="https://revuesuite.com/join-beta.html" className="btn-mock-dark shrink-0">
          Join the beta →
        </a>
      </div>
    </aside>
  );
}
