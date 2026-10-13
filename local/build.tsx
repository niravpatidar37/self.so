import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import baseConfig from '../tailwind.config';
import { toPublicResume } from './publicResume';
import { renderHtml } from './render';

const SITE_JSON = 'site/resume.json';
const EXTRAS_JSON = 'site/extras.json';
const THEME_CSS = 'local/theme/vibe.css';
const FONTS_DIR = 'local/theme/fonts';
const OUT_DIR = 'site-dist';
const SOURCE_URL = process.env.SITE_SOURCE_URL ?? 'https://github.com/niravpatidar37/self.so';

async function main() {
  const resume = toPublicResume(JSON.parse(await readFile(SITE_JSON, 'utf8')));
  const extras = existsSync(EXTRAS_JSON) ? JSON.parse(await readFile(EXTRAS_JSON, 'utf8')) : {};
  const siteUrl = process.env.SITE_URL || undefined;
  if (siteUrl && !/^https:\/\//.test(siteUrl)) throw new Error('SITE_URL must be https');

  const html = renderHtml(resume, { siteUrl, sourceUrl: SOURCE_URL, extras });

  // Purge Tailwind against the exact rendered HTML, so the CSS holds only used classes.
  const theme = await readFile(THEME_CSS, 'utf8');
  const { css } = await postcss([
    tailwindcss({ ...baseConfig, content: [{ raw: html, extension: 'html' }] }),
  ]).process(theme, { from: THEME_CSS });

  await mkdir(path.join(OUT_DIR, 'fonts'), { recursive: true });
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
