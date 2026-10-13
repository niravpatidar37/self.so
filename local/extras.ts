import { z } from 'zod';

/**
 * Hand-written site content that the resume schema has no place for (projects, hero copy).
 * It is public and committed, so it is validated as strictly as model output:
 * unknown keys are rejected and project links must be plain GitHub repository URLs.
 */
const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}$/;

const text = (max: number) => z.string().trim().min(1).max(max);

export const ProjectSchema = z
  .object({
    name: text(60),
    tagline: text(140),
    description: text(420),
    url: z.string().regex(GITHUB_REPO_URL, 'must be https://github.com/<owner>/<repo>'),
    language: text(30),
    tags: z.array(text(30)).max(6).default([]),
    featured: z.boolean().default(false),
  })
  .strict();

export const HighlightSchema = z.object({ value: text(16), label: text(70) }).strict();

export const SiteExtrasSchema = z
  .object({
    hero: z
      .object({
        kicker: text(70),
        tagline: text(160),
        emphasis: text(60).optional(),
      })
      .strict()
      .refine((h) => !h.emphasis || h.tagline.includes(h.emphasis), {
        message: 'hero.emphasis must be a substring of hero.tagline',
      })
      .optional(),
    focus: z.array(text(40)).max(8).default([]),
    highlightsCaption: text(60).optional(),
    highlights: z.array(HighlightSchema).max(4).default([]),
    projects: z.array(ProjectSchema).max(8).default([]),
    contactHeadline: text(90).optional(),
  })
  .strict();

export type SiteExtras = z.infer<typeof SiteExtrasSchema>;
export type Project = z.infer<typeof ProjectSchema>;
