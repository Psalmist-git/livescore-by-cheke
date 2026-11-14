"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { NewsArticle } from "@/types/news";

interface NewsResponse {
  success?: boolean;
  articles?: NewsArticle[];
  error?: string;
  failedSources?: string[];
  updatedAt?: string;
}

type NewsCategory =
  | "All"
  | "Transfers"
  | "Premier League"
  | "Champions League"
  | "International"
  | "Other";

const categories: NewsCategory[] = [
  "All",
  "Transfers",
  "Premier League",
  "Champions League",
  "International",
  "Other",
];

function getCategory(article: NewsArticle): NewsCategory {
  const text =
    `${article.title} ${article.summary}`.toLowerCase();

  if (
    /transfer|signing|signed|loan deal|transfer window/.test(text)
  ) {
    return "Transfers";
  }

  if (
    /premier league|manchester city|manchester united|arsenal|liverpool|chelsea|tottenham/.test(
      text,
    )
  ) {
    return "Premier League";
  }

  if (
    /champions league|uefa champions league/.test(text)
  ) {
    return "Champions League";
  }

  if (
    /world cup|afcon|africa cup of nations|international|national team|euros|copa america/.test(
      text,
    )
  ) {
    return "International";
  }

  return "Other";
}

function formatPublishedDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

interface NewsFeedProps {
  limit?: number;
}

export default function NewsFeed({
  limit,
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<NewsCategory>("All");

  const loadNews = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/football/news", {
        cache: "no-store",
      });

      const data: NewsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to retrieve football news.",
        );
      }

      setArticles(data.articles || []);
      setFailedSources(data.failedSources || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load football news.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "All") {
      return articles;
    }

    return articles.filter(
      (article) => getCategory(article) === selectedCategory,
    );
  }, [articles, selectedCategory]);

  const visibleArticles =
    typeof limit === "number"
      ? filteredArticles.slice(0, limit)
      : filteredArticles;

  return (
    <section className="w-full px-0 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-green-400">
            Around the Football World
          </p>

          <h2 className="text-3xl font-black md:text-4xl">
            Latest Football News
          </h2>

          <p className="mt-3 max-w-2xl text-slate-400">
            Stay updated with the latest football headlines,
            stories and developments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadNews(true)}
            disabled={loading || refreshing}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold transition hover:border-green-500 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh News"}
          </button>

          {typeof limit === "number" && (
            <Link
              href="/news"
              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-green-400"
            >
              All News →
            </Link>
          )}
        </div>
      </div>

      {typeof limit !== "number" && (
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              aria-pressed={selectedCategory === category}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === category
                  ? "border-green-500 bg-green-500 text-slate-950"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-green-500 hover:text-green-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div
          className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center"
          role="status"
        >
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-green-400" />
          <p className="text-slate-400">
            Loading the latest football news...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h3 className="font-bold text-red-400">
            Unable to load football news
          </h3>

          <p className="mt-2 text-sm text-slate-300">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadNews(true)}
            className="mt-4 rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        visibleArticles.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <p className="text-4xl">📰</p>

            <h3 className="mt-4 text-xl font-bold">
              No Stories Available
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              There are no articles available in this category right now.
            </p>
          </div>
        )}

      {!loading && !error && visibleArticles.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {visibleArticles.map((article) => (
            <article
              key={article.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-green-500/60"
            >
              {article.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-48 w-full object-cover"
                />
              )}

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
                    {getCategory(article)}
                  </span>

                  <span className="text-xs text-slate-500">
                    {article.source}
                  </span>
                </div>

                <h3 className="text-lg font-bold leading-7">
                  {article.title}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                  {article.summary || "Read the original article for more details."}
                </p>

                <div className="mt-6 border-t border-slate-800 pt-4">
                  <p className="mb-4 text-xs text-slate-500">
                    {formatPublishedDate(article.publishedAt)}
                  </p>

                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-green-400 transition hover:text-green-300"
                  >
                    Read Original Story
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && failedSources.length > 0 && (
        <p className="mt-6 text-xs text-slate-500">
          Some publishers could not be reached:{" "}
          {failedSources.join(", ")}. Other available stories are still shown.
        </p>
      )}

      <p className="mt-8 text-xs leading-5 text-slate-500">
        Headlines and excerpts are provided for news discovery.
        All articles remain the property of their respective publishers.
        Follow the links to read the full stories from the original sources.
      </p>
    </section>
  );
}