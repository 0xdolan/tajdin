import {
  TAJDIN_EXTENSION_ISSUES_URL,
  TAJDIN_EXTENSION_REPO_URL,
} from "../../shared/constants/links";

const MEM_ZIN_WIKI = "https://en.wikipedia.org/wiki/Mem_and_Zin";
const RADIO_BROWSER = "https://www.radio-browser.info/";

function extIconUrl(): string {
  return typeof chrome !== "undefined" && chrome.runtime?.getURL
    ? chrome.runtime.getURL("icons/tajdin-radio-100.png")
    : "/icons/tajdin-radio-100.png";
}

function manifestVersion(): string {
  try {
    return chrome.runtime.getManifest().version ?? "—";
  } catch {
    return "—";
  }
}

const linkBase =
  "font-medium text-amber-400 underline decoration-amber-400/40 underline-offset-2 hover:text-amber-300 hover:decoration-amber-300";

export function AboutSection() {
  const version = manifestVersion();
  const iconUrl = extIconUrl();

  return (
    <div className="mx-auto max-w-2xl space-y-8 text-neutral-300">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <img
          src={iconUrl}
          alt=""
          className="h-20 w-20 shrink-0 rounded-lg object-contain"
          width={80}
          height={80}
        />
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-semibold text-neutral-50">About Tajdîn</h2>
          <p className="text-sm text-neutral-400">
            Version <span className="font-mono text-neutral-200">{version}</span>
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
        <h3 id="about-why-heading" className="text-base font-semibold text-neutral-100">
          Why Tajdîn?
        </h3>
        <p className="text-sm leading-relaxed">
          The Kurdish epic{" "}
          <a href={MEM_ZIN_WIKI} target="_blank" rel="noopener noreferrer" className={linkBase}>
            <em>Mem û Zîn</em> (Mem and Zin)
          </a>{" "}
          is a story of love, exile, and faithfulness across impossible distance. Among its figures,{" "}
          <strong className="font-medium text-neutral-100">Tajdîn</strong> stands for loyalty and
          companionship—the friend who stays present when paths diverge and the world grows loud.
        </p>
        <p className="text-sm leading-relaxed">
          This extension borrows that name in spirit: a small, dependable companion for listening. Mem’s
          road is long and winding; Tajdîn is the steady voice at your side. Whether you open the popup
          for a single station or leave a stream running in the background, we hope Tajdîn feels like a
          familiar friend on your toolbar—powered by the open{" "}
          <a href={RADIO_BROWSER} target="_blank" rel="noopener noreferrer" className={linkBase}>
            Radio Browser
          </a>{" "}
          directory and the communities who curate stations worldwide.
        </p>
        <p className="text-sm font-medium leading-relaxed text-neutral-200">
          Tune in a little every day—there is always another city, another language, another song worth
          hearing.
        </p>
      </section>
    </div>
  );
}
