import { z } from 'zod';

/**
 * Hand-written site content that the resume schema has no place for (hero copy, projects).
 * It is public and committed, so it is validated as strictly as model output:
 * unknown keys are rejected, project links must be plain GitHub repository URLs,
 * and image references must be bare .webp file names inside site/media.
 */
const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;
export const MEDIA_FILE = /^[a-z0-9][a-z0-9-]{0,39}\.webp$/;
/** Tech-stack icon ids map to site/stack/<id>-light.svg and <id>-dark.svg, so they must be bare slugs. */
export const STACK_ICON_ID = /^[a-z0-9]{1,24}$/;
export const STACK_THEMES = ['light', 'dark'] as const;
export const stackIconFile = (id: string, theme: (typeof STACK_THEMES)[number]) => `${id}-${theme}.svg`;

/**
 * Stack icons are third-party SVGs committed to the repo. They are shown through <img>, where a
 * browser runs no script and fetches nothing, but the build still rejects anything active or
 * external so a swapped-in file can't add script, links or remote fetches to the published site.
 */
const UNSAFE_SVG =
  /<script|<foreignObject|<iframe|<object|<embed|<image\b|<use\b|<!DOCTYPE|<!ENTITY|\son[a-z]+\s*=|(?:xlink:)?href\s*=|url\(\s*(?!['"]?#)|@import|javascript:/i;
export function assertSafeSvg(name: string, svg: string): void {
  if (svg.length > 64_000) throw new Error(`stack icon ${name} is larger than 64 kB`);
  if (!/^<svg[\s>]/.test(svg.trimStart())) throw new Error(`stack icon ${name} is not an SVG document`);
  const m = svg.match(UNSAFE_SVG);
  if (m) throw new Error(`stack icon ${name} contains a disallowed construct: ${m[0]}`);
}

const text = (max: number) => z.string().trim().min(1).max(max);

export const ProjectSchema = z
  .object({
    name: text(60),
    tagline: text(140),
    description: text(420),
    url: z.string().regex(GITHUB_REPO_URL, 'must be https://github.com/<owner>/<repo>'),
    language: text(30),
    tags: z.array(text(30)).max(6).default([]),
    status: z.enum(['open source', 'building', 'archived']).default('open source'),
    preview: z.string().regex(MEDIA_FILE, 'must be a .webp file name in site/media').optional(),
  })
  .strict();

export const StackGroupSchema = z
  .object({
    label: text(30),
    icons: z
      .array(
        z
          .object({
            id: z.string().regex(STACK_ICON_ID, 'must be a lowercase icon id like "py"'),
            name: text(30),
          })
          .strict(),
      )
      .min(1)
      .max(12),
  })
  .strict();

export const SiteExtrasSchema = z
  .object({
    hero: z
      .object({
        role: text(60),
        intro: text(160),
        stack: z.array(text(30)).max(6).default([]),
        outro: text(160),
        emphasis: text(60).optional(),
      })
      .strict()
      .refine((h) => !h.emphasis || h.outro.includes(h.emphasis), {
        message: 'hero.emphasis must be a substring of hero.outro',
      })
      .optional(),
    ring: text(80).optional(),
    basedIn: z.object({ city: text(40), code: text(6), timezone: text(40) }).strict().optional(),
    focus: z.array(text(40)).max(8).default([]),
    projects: z.array(ProjectSchema).max(8).default([]),
    stack: z.array(StackGroupSchema).max(6).default([]),
    contactHeadline: text(90).optional(),
  })
  .strict();

export type SiteExtras = z.infer<typeof SiteExtrasSchema>;
export type Project = z.infer<typeof ProjectSchema>;
