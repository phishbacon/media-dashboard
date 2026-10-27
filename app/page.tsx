"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Clapperboard,
  Download,
  Headphones,
  Music,
  Tv,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { parseServices, type Card, type ServicesConfig } from "@/lib/services";

const ICONS: Record<string, LucideIcon> = {
  tv: Tv,
  film: Clapperboard,
  request: Download,
  audio: Headphones,
  book: BookOpen,
  music: Music,
};

function hostname(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * Card image: the `thumbnail` URL from services.json, fetched by the browser.
 * Returns null when there is no thumbnail; reports load failure upward so the
 * card can show the category icon instead (the icon never shows through a
 * transparent image).
 */
function CardImage({
  card,
  onError,
}: {
  card: Card;
  onError: () => void;
}) {
  if (!card.thumbnail) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={card.thumbnail}
      alt=""
      loading="lazy"
      className="absolute inset-0 h-full w-full object-contain"
      onError={onError}
    />
  );
}

function ServiceCard({ card }: { card: Card }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = ICONS[card.icon ?? ""] ?? Clapperboard;
  // Fallback icon only when there is no image or it failed to load.
  const showIcon = !card.thumbnail || imageFailed;
  return (
    <a
      href={card.url}
      className="group block overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
    >
      <div className="relative aspect-square w-full bg-gradient-to-br from-zinc-800 to-zinc-950">
        {showIcon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon
              aria-hidden
              className="h-14 w-14 text-zinc-600 transition group-hover:text-zinc-500"
              strokeWidth={1.5}
            />
          </div>
        )}
        <CardImage card={card} onError={() => setImageFailed(true)} />
      </div>
      <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
        <span className="truncate text-base font-semibold text-zinc-100">
          {card.name}
        </span>
        <span className="shrink-0 truncate text-xs text-zinc-500">
          {hostname(card.url)}
        </span>
      </div>
      {card.description && (
        <p className="px-4 pb-3 pt-1 text-sm text-zinc-500">{card.description}</p>
      )}
      {!card.description && <div className="pb-3" />}
    </a>
  );
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; config: ServicesConfig };

const CONFIG_SOURCES = [
  "/config/services.json", // container: operator-mounted config
  "/services-local.json", // dev only: untracked personal config, gitignored
  "/services-default.json", // baked placeholders shipped in the image
];

async function loadConfig(): Promise<ServicesConfig> {
  for (const source of CONFIG_SOURCES) {
    const res = await fetch(source, { cache: "no-store" });
    if (res.status === 404) continue;
    if (!res.ok) {
      throw new Error(`could not load ${source} (HTTP ${res.status})`);
    }
    return parseServices(await res.text());
  }
  throw new Error(`no services config found (tried ${CONFIG_SOURCES.join(", ")})`);
}

export default function Home() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    loadConfig()
      .then((config) => setState({ status: "ready", config }))
      .catch((error) =>
        setState({
          status: "error",
          message: error instanceof Error ? error.message : String(error),
        }),
      );
  }, []);

  if (state.status === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center px-4 py-10">
        <p className="text-center text-sm text-zinc-500">Loading…</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-10">
        <div
          role="alert"
          className="rounded-2xl border border-red-900 bg-red-950/40 p-6"
        >
          <h1 className="text-lg font-semibold text-red-200">
            Could not load services.json
          </h1>
          <p className="mt-3 break-words font-mono text-sm text-red-300">
            {state.message}
          </p>
          <p className="mt-4 text-sm text-zinc-400">
            Fix the config file and reload this page. In a container that is
            the file mounted at /config/services.json.
          </p>
        </div>
      </main>
    );
  }

  const { title, cards } = state.config;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 sm:mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Pick a service to get started.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <ServiceCard key={card.url + card.name} card={card} />
        ))}
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-zinc-600">
        {cards.length} services
      </footer>
    </main>
  );
}
