import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import baseConfig from '../tailwind.config';
import { MEDIA_FILE, STACK_THEMES, SiteExtrasSchema, assertSafeSvg, stackIconFile } from './extras';
import { toPublicResume } from './publicResume';
import { renderHtml } from './render';

const SITE_JSON = 'site/resume.json';
const EXTRAS_JSON = 'site/extras.json';
const THEME_CSS = 'local/theme/site.css';
const MEDIA_DIR = 'site/media';
const STACK_DIR = 'site/stack';
const PHOTO = 'photo.webp';
const OG_CARD = 'og.png';
const FONTS_DIR = 'local/theme/fonts';
const OUT_DIR = 'site-dist';
const SOURCE_URL = process.env.SITE_SOURCE_URL ?? 'https://github.com/niravpatidar37/self.so';

async function main() {
  const resume = toPublicResume(JSON.parse(await readFile(SITE_JSON, 'utf8')));
  const extras = existsSync(EXTRAS_JSON) ? JSON.parse(await readFile(EXTRAS_JSON, 'utf8')) : {};
  const siteUrl = process.env.SITE_URL || undefined;
  if (siteUrl && !/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL must be https');

  // Only files the page actually references are published, and every name is validated.
  const parsed = SiteExtrasSchema.parse(extras);
  const photo = existsSync(path.join(MEDIA_DIR, PHOTO)) ? PHOTO : undefined;
  const ogCard = existsSync(path.join(MEDIA_DIR, OG_CARD)) ? OG_CARD : undefined;
  const media = [photo, ...parsed.projects.map((p) => p.preview)].filter((f): f is string => !!f);
  for (const f of media) {
    if (!MEDIA_FILE.test(f)) throw new Error(`invalid media file name: ${f}`);
    if (!existsSync(path.join(MEDIA_DIR, f))) throw new Error(`missing media file: ${MEDIA_DIR}/${f}`);
  }

  const stackFiles = [
    ...new Set(parsed.stack.flatMap((g) => g.icons.flatMap((i) => STACK_THEMES.map((t) => stackIconFile(i.id, t))))),
  ];
  const stackSvgs = new Map<string, string>();
  for (const f of stackFiles) {
    const p = path.join(STACK_DIR, f);
    if (!existsSync(p)) throw new Error(`missing stack icon: ${p}`);
    const svg = await readFile(p, 'utf8');
    assertSafeSvg(f, svg);
    stackSvgs.set(f, svg);
  }

  const html = renderHtml(resume, { siteUrl, sourceUrl: SOURCE_URL, extras, photo, ogCard });

  // Purge Tailwind against the exact rendered HTML, so the CSS holds only used classes.
  const theme = await readFile(THEME_CSS, 'utf8');
  const { css } = await postcss([
    tailwindcss({ ...baseConfig, content: [{ raw: html, extension: 'html' }] }),
  ]).process(theme, { from: THEME_CSS });

  // Clear old output (not the folder itself, which a local preview server may hold open).
  await mkdir(OUT_DIR, { recursive: true });
  for (const f of await readdir(OUT_DIR)) await rm(path.join(OUT_DIR, f), { recursive: true, force: true });
  await mkdir(path.join(OUT_DIR, 'fonts'), { recursive: true });
  await mkdir(path.join(OUT_DIR, 'media'), { recursive: true });
  if (stackSvgs.size) await mkdir(path.join(OUT_DIR, 'stack'), { recursive: true });
  for (const [f, svg] of stackSvgs) await writeFile(path.join(OUT_DIR, 'stack', f), svg);
  for (const f of new Set(media)) await copyFile(path.join(MEDIA_DIR, f), path.join(OUT_DIR, 'media', f));
  if (ogCard) await copyFile(path.join(MEDIA_DIR, ogCard), path.join(OUT_DIR, 'media', ogCard));
  for (const f of await readdir(FONTS_DIR)) {
    if (/\.(woff2|txt)$/.test(f)) await copyFile(path.join(FONTS_DIR, f), path.join(OUT_DIR, 'fonts', f));
  }
  await writeFile(path.join(OUT_DIR, 'index.html'), html);
  await copyFile('local/theme/favicon.svg', path.join(OUT_DIR, 'favicon.svg'));
  await writeFile(path.join(OUT_DIR, 'styles.css'), css);
  await writeFile(path.join(OUT_DIR, '.nojekyll'), '');
  console.log(`Built ${OUT_DIR}/index.html (${html.length} B) and styles.css (${css.length} B)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
