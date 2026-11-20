import Link from "next/link";
import type { ResourceCategory } from "@/app/lib/resource-library";
import { categoryOrder, resourceLibrary } from "@/app/lib/resource-library";

export default function ResourceCategoryPage({ category }: { category: ResourceCategory }) {
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-slate-800">
      <header className="border-b border-slate-200 bg-[#112E46] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-lg font-bold tracking-[0.15em]">CERNA</p>
            <p className="text-[10px] tracking-[0.22em] text-slate-300">HOME CARE · FRANCHISE RESOURCE CENTER</p>
          </div>
          <Link href="/dashboard" className="rounded-lg border border-white/25 px-4 py-2 text-sm hover:bg-white/10">
            ← Back to Dashboard
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-7 px-5 py-8 md:px-8">
        <div>
          <Link href="/dashboard" className="text-sm font-medium text-[#98743F] hover:underline">← Resource Library / Dashboard</Link>
          <h1 className="mt-3 text-3xl font-bold">{category.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{category.description}</p>
        </div>
        <nav aria-label="Resource categories" className="flex flex-wrap gap-2">
          {categoryOrder.map((slug) => (
            <Link key={slug} href={`/resources/${slug}`} aria-current={slug === category.slug ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${slug === category.slug ? "bg-[#112E46] text-white" : "border border-slate-200 bg-white text-slate-600 hover:border-[#B28B4E]"}`}>
              {resourceLibrary[slug].title}
            </Link>
          ))}
        </nav>
        <div className="grid gap-5 md:grid-cols-2">
          {category.groups.map((group) => (
            <section key={group.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="border-b border-slate-100 pb-4 text-lg font-semibold text-[#112E46]">{group.title}</h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {group.items.map((item) => (
                  <li key={item.title} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.note && <p className="mt-1 text-xs leading-5 text-slate-500">{item.note}</p>}
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                      {item.status ?? "Needs content"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="text-xs text-slate-500">The categories are ready for use. Document links and integrations will become available after their files and destinations are configured.</p>
      </div>
    </main>
  );
}
