import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';
import type { Plugin } from 'vite';

const ROOT = join(import.meta.dirname, '../../..');

const PAGES = [
  { file: 'docs/user-guide.md', out: 'docs/index.html', title: 'User guide' },
  { file: 'docs/privacy-policy.md', out: 'docs/privacy/index.html', title: 'Privacy policy' },
];

function page(title: string, body: string, base: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<title>${title} · Tajdîn</title>
<link rel="icon" href="${base}favicon.svg" type="image/svg+xml" />
<style>
  :root { --bg:#faf9f5; --fg:#1d1b3a; --muted:#5b5a76; --line:#e4e3ee; --accent:#c26a0a; --code:#f0eff7; }
  @media (prefers-color-scheme: dark) { :root { --bg:#16162e; --fg:#f3f3f8; --muted:#a9a8c4; --line:#2b2a4a; --accent:#f7c548; --code:#222242; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font:16px/1.65 system-ui, -apple-system, 'Segoe UI', sans-serif; }
  header { border-bottom:1px solid var(--line); }
  header div, main { max-width: 760px; margin: 0 auto; padding: 16px; }
  header a { color: var(--fg); text-decoration: none; font-weight: 600; display:flex; align-items:center; gap:10px; }
  header img { width: 28px; height: 28px; border-radius: 8px; }
  main { padding-bottom: 64px; }
  h1, h2, h3 { line-height: 1.25; letter-spacing: -0.01em; }
  h2 { margin-top: 2.2em; padding-top: .4em; border-top: 1px solid var(--line); }
  a { color: var(--accent); }
  code { background: var(--code); padding: .1em .35em; border-radius: 4px; font-size: .9em; }
  pre { background: var(--code); padding: 12px 14px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; }
  th, td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; }
  img { max-width: 100%; border-radius: 8px; }
  kbd { border: 1px solid var(--line); border-bottom-width: 2px; border-radius: 4px; padding: 0 .35em; font-size: .85em; }
  blockquote { margin: 0; padding: 4px 16px; border-left: 3px solid var(--accent); color: var(--muted); }
</style>
</head>
<body>
<header><div><a href="${base}"><img src="${base}icon-192.png" alt="" />Tajdîn</a></div></header>
<main>${body}</main>
</body>
</html>`;
}

/** Renders the Markdown docs in /docs into static pages under the site's /docs/ path. */
export function docsPlugin(): Plugin {
  let base = '/';
  return {
    name: 'tajdin-docs',
    configResolved(config) {
      base = config.base;
    },
    generateBundle() {
      for (const p of PAGES) {
        const markdown = readFileSync(join(ROOT, p.file), 'utf8')
          // Links between docs point at their rendered pages; images resolve to the repo on GitHub.
          .replace(/\]\(\.\/privacy-policy\.md\)/g, `](${base}docs/privacy/)`)
          .replace(
            /\]\((\.\.\/)?assets\//g,
            '](https://raw.githubusercontent.com/0xdolan/tajdin/main/assets/',
          );
        this.emitFile({
          type: 'asset',
          fileName: p.out,
          source: page(p.title, marked.parse(markdown, { async: false }), base),
        });
      }
    },
  };
}
