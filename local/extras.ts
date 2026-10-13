import { z } from 'zod';

/**
 * Hand-written site content that the resume schema has no place for (hero copy, projects).
 * It is public and committed, so it is validated as strictly as model output:
 * unknown keys are rejected, project links must be plain GitHub repository URLs,
 * and image references must be bare .webp file names inside site/media.
 */
const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;
export const MEDIA_FILE = /^[a-z0-9][a-z0-9-]{0,39}\.webp$/;

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
    contactHeadline: text(90).optional(),
  })
  .strict();

export type SiteExtras = z.infer<typeof SiteExtrasSchema>;
export type Project = z.infer<typeof ProjectSchema>;
