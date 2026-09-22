export default function ArticleSections({
  items,
}: {
  items: { id: string; title: string; intro: string; paragraphs: string[] }[];
}) {
  return (
    <div className="mt-16 space-y-8">
      {items.map((item, i) => (
        <article
          id={item.id}
          key={item.id}
          className="scroll-mt-28 rounded-[1.8rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm sm:p-10"
        >
          <div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <span className="text-xs font-semibold tracking-[.18em] text-[rgb(108,76,243)]">
                READ / 0{i + 1}
              </span>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                {item.intro}
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold leading-tight tracking-[-.04em] text-slate-950 sm:text-3xl">
                {item.title}
              </h2>
              {item.paragraphs.map((p) => (
                <p
                  key={p}
                  className="mt-5 max-w-3xl text-base leading-8 text-slate-600"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
