import {
  TAJDIN_EXTENSION_ISSUES_URL,
  TAJDIN_EXTENSION_REPO_URL,
} from "../../shared/constants/links";
import { tajdinMarkSvgUrl } from "../../shared/utils/tajdinMarkUrl";

const MEM_ZIN_WIKI = "https://en.wikipedia.org/wiki/Mem_and_Zin";
const RADIO_BROWSER = "https://www.radio-browser.info/";

export type AboutSectionSurface = "dark" | "light";

function aboutMarkUrl(surface: AboutSectionSurface): string {
  return tajdinMarkSvgUrl(surface === "light" ? "black" : "white");
}

function manifestVersion(): string {
  try {
    return chrome.runtime.getManifest().version ?? "—";
  } catch {
    return "—";
  }
}

function linkClass(surface: AboutSectionSurface): string {
  if (surface === "light") {
    return "font-medium text-sky-700 underline decoration-sky-700/35 underline-offset-2 hover:text-sky-900 hover:decoration-sky-900/50";
  }
  return "font-medium text-amber-400 underline decoration-amber-400/40 underline-offset-2 hover:text-amber-300 hover:decoration-amber-300";
}

const surfaceTokens: Record<
  AboutSectionSurface,
  {
    root: string;
    h2: string;
    versionMuted: string;
    versionMono: string;
    h3: string;
    bodyStrong: string;
    closing: string;
  }
> = {
  dark: {
    root: "mx-auto max-w-2xl space-y-6 text-neutral-300 sm:space-y-8",
    h2: "text-xl font-semibold text-neutral-50",
    versionMuted: "text-sm text-neutral-400",
    versionMono: "font-mono text-neutral-200",
    h3: "text-base font-semibold text-neutral-100",
    bodyStrong: "font-medium text-neutral-100",
    closing: "text-sm font-medium leading-relaxed text-neutral-200",
  },
  light: {
    root: "mx-auto max-w-2xl space-y-6 text-neutral-600 sm:space-y-8",
    h2: "text-xl font-semibold text-neutral-900",
    versionMuted: "text-sm text-neutral-500",
    versionMono: "font-mono text-neutral-800",
    h3: "text-base font-semibold text-neutral-800",
    bodyStrong: "font-medium text-neutral-900",
    closing: "text-sm font-medium leading-relaxed text-neutral-800",
  },
};

/**
 * Full About copy (settings page and popup About tab). {@link surface} defaults to dark for options UI.
 */
export function AboutSection({ surface = "dark" }: { surface?: AboutSectionSurface } = {}) {
  const version = manifestVersion();
  const iconUrl = aboutMarkUrl(surface);
  const linkBase = linkClass(surface);
  const t = surfaceTokens[surface];

  return (
    <div className={t.root}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <img
          src={iconUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-contain"
          width={80}
          height={80}
        />
        <div className="min-w-0 space-y-2">
          <h2 className={t.h2}>About Tajdîn</h2>
          <p className={t.versionMuted}>
            Version <span className={t.versionMono}>{version}</span>
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <li>
              <a href={TAJDIN_EXTENSION_REPO_URL} target="_blank" rel="noopener noreferrer" className={linkBase}>
                Source on GitHub
              </a>
            </li>
            <li>
              <a href={TAJDIN_EXTENSION_ISSUES_URL} target="_blank" rel="noopener noreferrer" className={linkBase}>
                Report an issue
              </a>
            </li>
            <li>
              <a href={RADIO_BROWSER} target="_blank" rel="noopener noreferrer" className={linkBase}>
                Radio Browser
              </a>
            </li>
          </ul>
        </div>
      </header>

      <section className="space-y-3" aria-labelledby="about-why-heading">
        <h3 id="about-why-heading" className={t.h3}>
          Why Tajdîn?
        </h3>
        <p className="text-sm leading-relaxed">
          The Kurdish epic{" "}
          <a href={MEM_ZIN_WIKI} target="_blank" rel="noopener noreferrer" className={linkBase}>
            <em>Mem û Zîn</em> (Mem and Zin)
          </a>{" "}
          is a story of love, exile, and faithfulness across impossible distance. Among its figures,{" "}
          <strong className={t.bodyStrong}>Tajdîn</strong> stands for loyalty and companionship (the friend who
          stays present when paths diverge and the world grows loud).
        </p>
        <p className="text-sm leading-relaxed">
          This extension borrows that name in spirit: a small, dependable companion for listening. Mem’s road is
          long and winding; Tajdîn is the steady voice at your side. Whether you open the popup for a single
          station or leave a stream running in the background, we hope Tajdîn feels like a familiar friend on your
          toolbar (powered by the open{" "}
          <a href={RADIO_BROWSER} target="_blank" rel="noopener noreferrer" className={linkBase}>
            Radio Browser
          </a>{" "}
          directory and the communities who curate stations worldwide).
        </p>
        <p className={t.closing}>
          Tune in a little every day, there is always another city, another language, another song worth hearing.
        </p>
      </section>
    </div>
  );
}
