import { renderToStaticMarkup } from 'react-dom/server';
import { SiteExtrasSchema } from './extras';
import { scrubPhones, toPublicResume } from './publicResume';
import { VibeSite } from './theme/VibeSite';

/**
 * The generated page ships zero JavaScript, so the CSP forbids scripts entirely.
 * (application/ld+json is a data block and is never executed.) Fonts and styles are
 * self-hosted, so nothing is loaded from a third party.
 */
export const CSP =
  "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'";

export const THEME_COLOR = '#05070a';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/** Scrub phone numbers from every string in the hand-written extras too. */
const scrubDeep = <T,>(v: T): T =>
  typeof v === 'string'
    ? (scrubPhones(v) as T)
    : Array.isArray(v)
      ? (v.map(scrubDeep) as T)
      : v && typeof v === 'object'
        ? (Object.fromEntries(Object.entries(v).map(([k, x]) => [k, scrubDeep(x)])) as T)
        : v;

export function renderHtml(
  input: unknown,
  opts: { siteUrl?: string; sourceUrl: string; extras?: unknown; year?: number },
): string {
  // Re-apply the publish filter at build time, so a hand-edited site/resume.json
  // can't reintroduce a phone number or an unsafe link.
  const r = toPublicResume(input);
  const extras = scrubDeep(SiteExtrasSchema.parse(opts.extras ?? {}));
  const { name, shortAbout, contacts } = r.header;

  const body = renderToStaticMarkup(
    <VibeSite
      resume={r}
      extras={extras}
      sourceUrl={opts.sourceUrl}
      year={opts.year ?? new Date().getUTCFullYear()}
    />,
  );

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    jobTitle: shortAbout,
    description: r.summary,
    email: contacts.email ? `mailto:${contacts.email}` : undefined,
    url: opts.siteUrl,
    sameAs: [
      contacts.github && `https://github.com/${contacts.github}`,
      contacts.linkedin && `https://www.linkedin.com/in/${contacts.linkedin}`,
    ].filter(Boolean),
    knowsAbout: r.header.skills,
  }).replace(/</g, '\\u003c');

  const title = shortAbout ? `${name} | ${shortAbout}` : name;
  const description = (extras.hero?.tagline ?? r.summary).slice(0, 300);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${esc(CSP)}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="${THEME_COLOR}">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="profile">
${opts.siteUrl ? `<link rel="canonical" href="${esc(opts.siteUrl)}">\n` : ''}<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preload" href="fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="styles.css">
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
${body}
</body>
</html>
`;
}
