import { CHAPTERS } from '../content/chapters'

/** No-WebGL fallback: the whole story as a readable article in brand style. */
export default function WebGLFallback() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <p className="rounded-lg border border-teal-deep/20 bg-white p-4 text-sm text-teal-deep/70">
        Your browser can&apos;t show the 3D visualization (WebGL unavailable) — here is the full
        story of the energy loop instead.
      </p>
      {CHAPTERS.map((c) => (
        <section key={c.id} className="mt-12">
          <span className="rounded-full border border-teal-mid/40 px-3 py-1 font-mono text-[11px] tracking-wider text-teal-mid">
            {c.badge}
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-teal-deep">{c.title}</h2>
          <p className="mt-3 leading-relaxed text-teal-deep/80">{c.body}</p>
          <dl className="mt-4 rounded-lg bg-teal-deep p-4 font-mono text-sm leading-7 text-lime-pale">
            {c.stats.map((s) => (
              <div key={s.label} className="flex justify-between gap-4">
                <dt className="text-offwhite/50">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </article>
  )
}
