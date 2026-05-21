// app/more/blog/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import PageShell from "@/components/site/PageShell";

type BlogCategory =
  | "All"
  | "Temporary cover"
  | "Learners"
  | "Vans"
  | "Impound"
  | "Guides";

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: Exclude<BlogCategory, "All">;
  readMins: number;
  dateLabel: string;
  featured?: boolean;
};

const POSTS: readonly Post[] = [
  {
    slug: "how-temp-car-insurance-works",
    title: "How temporary car insurance works and when it makes sense",
    excerpt:
      "A clearer breakdown of what temporary cover is, who it is usually for, and how to choose the right timing.",
    category: "Temporary cover",
    readMins: 4,
    dateLabel: "Updated recently",
    featured: true,
  },
  {
    slug: "hourly-vs-daily-cover",
    title: "Hourly vs daily cover: choosing the better fit",
    excerpt:
      "When hourly cover can work well, when daily cover makes more sense, and how to avoid paying for time you do not need.",
    category: "Temporary cover",
    readMins: 3,
    dateLabel: "New",
  },
  {
    slug: "learner-insurance-basics",
    title: "Learner insurance basics for supervised practice",
    excerpt:
      "What learner cover is usually for, what to prepare before you start, and how to keep the journey simple.",
    category: "Learners",
    readMins: 5,
    dateLabel: "Popular",
  },
  {
    slug: "temporary-van-cover-for-moves",
    title: "Temporary van cover for moves and short jobs",
    excerpt:
      "A practical guide for van borrowing, moving house or short-term use, plus a few common things to check first.",
    category: "Vans",
    readMins: 4,
    dateLabel: "Popular",
  },
  {
    slug: "impound-insurance-checklist",
    title: "Impound insurance checklist: what you may need",
    excerpt:
      "A step-by-step checklist to help you prepare for release requirements, next steps and document access.",
    category: "Impound",
    readMins: 6,
    dateLabel: "Essential",
  },
  {
    slug: "retrieve-policy-documents",
    title: "How to retrieve your policy documents quickly",
    excerpt:
      "Where to find your policy details, what to do if you cannot locate them, and how retrieval works.",
    category: "Guides",
    readMins: 3,
    dateLabel: "Quick read",
  },
] as const;

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: BlogCategory;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
        active
          ? "border-[rgba(108,76,243,0.18)] bg-[rgba(108,76,243,0.08)] text-slate-950"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full transition",
          active ? "bg-[rgb(108,76,243)]" : "bg-slate-300",
        ].join(" ")}
        aria-hidden="true"
      />
      {label}
    </button>
  );
}

function PreviewTile({
  post,
  featured = false,
}: {
  post: Post;
  featured?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm",
        featured ? "bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.96))]" : "",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {post.category}
        </span>
        <span className="text-[12px] text-slate-500">{post.dateLabel}</span>
        <span className="text-[12px] text-slate-400">•</span>
        <span className="text-[12px] text-slate-500">{post.readMins} min read</span>
        {featured ? (
          <>
            <span className="text-[12px] text-slate-400">•</span>
            <span className="text-[12px] font-semibold text-[rgb(108,76,243)]">Featured</span>
          </>
        ) : null}
      </div>

      <h3
        className={[
          "mt-4 font-semibold tracking-[-0.02em] text-slate-950",
          featured ? "text-[1.25rem] sm:text-[1.45rem]" : "text-[1.08rem] sm:text-[1.14rem]",
        ].join(" ")}
      >
        {post.title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.98rem]">
        {post.excerpt}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-950">Article page coming soon</div>
        <div className="text-[12px] text-slate-500">Preview</div>
      </div>
    </div>
  );
}

function TopicLink({
  title,
  href,
}: {
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-[1.2rem] border border-slate-200/80 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span
        className="text-slate-400 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}

export default function BlogPage() {
  const [cat, setCat] = useState<BlogCategory>("All");

  const categories: BlogCategory[] = [
    "All",
    "Temporary cover",
    "Learners",
    "Vans",
    "Impound",
    "Guides",
  ];

  const featured = useMemo(() => POSTS.find((p) => p.featured) ?? POSTS[0], []);
  const filtered = useMemo(() => {
    const rest = POSTS.filter((p) => !p.featured);
    if (cat === "All") return rest;
    return rest.filter((p) => p.category === cat);
  }, [cat]);

  return (
    <PageShell
      hideHero
      crumbs={[
        { label: "Home", href: "/" },
        { label: "More", href: "/more" },
        { label: "Blog" },
      ]}
    >
      {/* HERO */}
      <section className="pt-2 sm:pt-4 lg:pt-6">
        <div className="max-w-[76rem]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.14)] bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
            Blog
          </div>

          <div className="relative mt-6 max-w-[70rem]">
            <div className="pointer-events-none absolute inset-x-0 top-[8%] -z-10 opacity-55 sm:top-[12%]">
              <svg
                viewBox="0 0 1200 260"
                className="h-[220px] w-full sm:h-[260px] lg:h-[300px]"
                fill="none"
                aria-hidden="true"
                preserveAspectRatio="none"
              >
                <path
                  d="M18 152C114 62 222 227 338 152C446 82 548 216 676 142C794 72 906 201 1026 132C1090 96 1142 105 1182 122"
                  stroke="rgba(108,76,243,0.14)"
                  strokeWidth="34"
                  strokeLinecap="round"
                />
                <path
                  d="M10 154C108 66 216 224 334 150C444 80 544 214 672 140C792 70 904 198 1024 130C1088 95 1140 103 1190 120"
                  stroke="rgba(108,76,243,0.28)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="heading-unbalanced relative max-w-[11ch] text-[3.25rem] font-extrabold leading-[0.9] tracking-[-0.07em] text-slate-950 sm:max-w-[10ch] sm:text-[4.55rem] lg:max-w-[9.5ch] lg:text-[5.85rem]">
              Insights, explainers and practical reads
            </h1>
          </div>

          <p className="mt-10 max-w-[54rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.14rem]">
            Browse preview articles across temporary cover, learner journeys, vans,
            impound situations and practical guides. Full article pages are coming soon.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/get-quote" className="btn-primary btn-primary-lg !text-white">
              Get a quote
            </Link>

            <Link href="/help-support" className="btn-ghost">
              Help & Support
            </Link>

            <Link href="/retrieve-policy" className="btn-ghost">
              Retrieve policy
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-700">
            {["Preview mode", "Practical reads", "Built around real journeys"].map((item) => (
              <div key={item} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 h-px w-full bg-[linear-gradient(90deg,rgba(226,232,240,0),rgba(226,232,240,0.95),rgba(226,232,240,0))]" />
        </div>
      </section>

      {/* PREVIEW NOTICE + CATEGORIES */}
      <section className="mt-16">
        <div className="rounded-[1.9rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,242,255,0.88),rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Blog preview
              </div>

              <h2 className="mt-3 max-w-[16ch] text-[1.9rem] font-extrabold leading-[0.96] tracking-[-0.045em] text-slate-950 sm:text-[2.35rem]">
                The full article library is coming soon
              </h2>

              <p className="mt-4 max-w-[38rem] text-[1rem] leading-8 text-slate-600">
                This page is live as a preview, so you can browse the themes and
                article directions already planned across the Connect Cover journeys.
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200/80 bg-white/84 p-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Filter by topic
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <CategoryChip
                    key={category}
                    label={category}
                    active={cat === category}
                    onClick={() => setCat(category)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED + SIDEBAR */}
      <section className="mt-16">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <PreviewTile post={featured} featured />

          <div className="rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Most read topics
            </div>

            <div className="mt-3 text-[1.08rem] font-semibold tracking-[-0.02em] text-slate-950">
              Quick starting points
            </div>

            <p className="mt-2 text-sm leading-7 text-slate-600">
              Start with the topics customers most often want to understand more clearly.
            </p>

            <div className="mt-5 grid gap-3">
              {[
                { title: "How cover timings work", href: "/get-quote" },
                { title: "Learner practice cover", href: "/learner" },
                { title: "Van cover for moves", href: "/van" },
                { title: "Retrieve documents", href: "/retrieve-policy" },
              ].map((item) => (
                <TopicLink key={item.title} title={item.title} href={item.href} />
              ))}
            </div>

            <div className="mt-6 rounded-[1.2rem] border border-slate-200/80 bg-slate-50/60 px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Quick route
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-950">
                Already bought cover?
              </div>
              <div className="mt-1 text-sm leading-6 text-slate-600">
                Retrieve your policy documents without starting over.
              </div>
              <div className="mt-4">
                <Link href="/retrieve-policy" className="btn-ghost w-full justify-center">
                  Retrieve policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POSTS GRID */}
      <section className="mt-16">
        <div className="max-w-[56rem]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(108,76,243)]">
            Articles
          </div>

          <h2 className="mt-4 max-w-[14ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:max-w-[13ch] lg:text-[4rem]">
            {cat === "All" ? "Preview posts across the library" : `Preview posts: ${cat}`}
          </h2>

          <p className="mt-4 max-w-[44rem] text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
            A first look at the articles planned for the Connect Cover content library.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <PreviewTile key={post.slug} post={post} />
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mt-16">
        <div className="rounded-[2rem] border border-[rgba(108,76,243,0.10)] bg-[linear-gradient(180deg,rgba(245,242,255,0.72),rgba(255,255,255,0.94))] px-6 py-10 shadow-sm sm:px-8 sm:py-12 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="heading-unbalanced text-center text-3xl font-extrabold leading-[0.95] tracking-[-0.055em] text-slate-950 sm:text-4xl lg:text-[3.8rem]">
              Ready to move into a quote?
            </h2>

            <div className="mx-auto mt-5 max-w-[38rem]">
              <p className="text-center text-[1.02rem] leading-8 text-slate-600 sm:text-[1.08rem]">
                Choose your cover timing, review the option that fits, and continue
                through the Connect Cover journey.
              </p>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/get-quote" className="btn-primary !text-white">
                Get a quote
              </Link>

              <Link href="/more/guides" className="btn-ghost">
                Browse guides
              </Link>
            </div>

            <div className="mt-5 text-[12px] leading-6 text-slate-500">
              Clear routes, practical reading, and support when needed.
            </div>
          </div>
        </div>
      </section>

      {/* REASSURANCE */}
      <section className="mt-16">
        <div className="flex flex-col gap-2 text-[12px] text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          {[
            "Eligibility and underwriting apply",
            "Always read your policy documents carefully",
            "You’ll review details before payment",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}