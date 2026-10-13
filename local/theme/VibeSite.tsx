import type { ReactNode } from 'react';
import type { ResumeDataSchemaType } from '@/lib/resume';
import { getShortMonth, getYear } from '@/components/resume/resumeUtils';
import type { SiteExtras } from '../extras';

/*
 * "Dark and techy" theme. Server-rendered to static HTML with zero JavaScript:
 * every effect is CSS (local/theme/vibe.css), and no element carries an inline
 * style attribute, so the page works under a CSP that forbids scripts and inline styles.
 */

type Job = ResumeDataSchemaType['workExperience'][number];

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

export const formatRange = (start: string, end: string | null) =>
  `${getShortMonth(start)} ${getYear(start)} – ${end ? `${getShortMonth(end)} ${getYear(end)}` : 'Present'}`;

export const formatYears = (start: string, end?: string) =>
  !end || getYear(start) === getYear(end) ? `${getYear(start)}` : `${getYear(start)} – ${getYear(end)}`;

export const toBullets = (description: string) =>
  description
    .split('\n')
    .map((l) => l.replace(/^\s*[•*-]\s*/, '').trim())
    .filter(Boolean);

const splitLead = (summary: string) => {
  const m = summary.match(/^([\s\S]+?[.!?])\s+([\s\S]+)$/);
  return m ? { lead: m[1], rest: m[2] } : { lead: summary, rest: '' };
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

const Icon = ({ name }: { name: 'mail' | 'github' | 'linkedin' | 'arrow' }) => {
  const paths: Record<typeof name, ReactNode> = {
    mail: (
      <>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    github: (
      <>
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
      </>
    ),
    linkedin: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 7h10v10" />
        <path d="M7 17 17 7" />
      </>
    ),
  };
  return (
    <svg
      className={cx('icon', name === 'arrow' && 'arrow')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
};

const External = ({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) => (
  <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={label}>
    {children}
  </a>
);

const Section = ({ id, index, title, children }: { id: string; index: string; title: string; children: ReactNode }) => (
  <section id={id} className="section container" aria-labelledby={`${id}-title`}>
    <div className="section-head reveal">
      <span className="section-index">{index}</span>
      <h2 className="section-title" id={`${id}-title`}>
        {title}
      </h2>
      <span className="section-rule" aria-hidden="true" />
    </div>
    {children}
  </section>
);

const Emphasis = ({ text, emphasis }: { text: string; emphasis?: string }) => {
  if (!emphasis || !text.includes(emphasis)) return <>{text}</>;
  const i = text.indexOf(emphasis);
  return (
    <>
      {text.slice(0, i)}
      <em>{emphasis}</em>
      {text.slice(i + emphasis.length)}
    </>
  );
};

function JobCard({ job }: { job: Job }) {
  const bullets = toBullets(job.description);
  const shown = bullets.slice(0, 3);
  const hidden = bullets.slice(3);
  return (
    <li className={cx('tl-item reveal', !job.end && 'is-current')}>
      <span className="tl-node" aria-hidden="true" />
      <article className="tl-card">
        <div className="tl-head">
          <h3>{job.title}</h3>
          <span className="date">{formatRange(job.start, job.end)}</span>
        </div>
        <p className="tl-meta">
          <span className="company">{job.company}</span>
          {job.contract && <span className="sep">·</span>}
          {job.contract && <span>{job.contract}</span>}
          {job.location && <span className="chip">{job.location}</span>}
        </p>
        {shown.length > 0 && (
          <ul className="bullets">
            {shown.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
        {hidden.length > 0 && (
          <details className="more">
            <summary>
              <span className="open-label">Show {hidden.length} more</span>
              <span className="close-label">Show less</span>
            </summary>
            <ul className="bullets">
              {hidden.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </details>
        )}
      </article>
    </li>
  );
}

function SkillTrack({ skills, reverse }: { skills: string[]; reverse?: boolean }) {
  // Two copies side by side; translating by -50% loops seamlessly.
  return (
    <div className={cx('marquee-track', reverse && 'reverse')}>
      {[...skills, ...skills].map((s, i) => (
        <span key={`${s}-${i}`} className={cx('skill', i >= skills.length && 'dup')}>
          <span className="hash">#</span>
          {s}
        </span>
      ))}
    </div>
  );
}

export function VibeSite({
  resume,
  extras,
  sourceUrl,
  year,
}: {
  resume: ResumeDataSchemaType;
  extras: SiteExtras;
  sourceUrl: string;
  year: number;
}) {
  const { header } = resume;
  const c = header.contacts;
  const email = c.email ? `mailto:${c.email}` : undefined;
  const github = c.github ? `https://github.com/${c.github}` : undefined;
  const linkedin = c.linkedin ? `https://www.linkedin.com/in/${c.linkedin}` : undefined;
  const current = resume.workExperience.find((w) => !w.end);
  const { lead, rest } = splitLead(resume.summary);
  const initials = header.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const skills = header.skills;
  const half = Math.ceil(skills.length / 2);
  const nav = [
    ['about', 'About'],
    ['experience', 'Experience'],
    ...(extras.projects.length ? [['projects', 'Projects']] : []),
    ['skills', 'Skills'],
  ] as const;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <div className="backdrop" aria-hidden="true">
        <div className="grid-bg" />
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
      </div>

      <header className="nav-wrap">
        <nav className="nav glass" aria-label="Primary">
          <a href="#top" className="monogram" aria-label={`${header.name}, back to top`}>
            {initials}
          </a>
          <ul className="nav-links">
            {nav.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
          {email && (
            <a className="btn btn-primary btn-sm" href={email}>
              Get in touch
            </a>
          )}
        </nav>
      </header>

      <main id="main">
        <section id="top" className="hero container">
          <div className="hero-copy">
            {current && (
              <p className="status-pill rise d1">
                <span className="pulse" aria-hidden="true" />
                Now · {current.title} @ {current.company}
              </p>
            )}
            <p className="kicker rise d2">{extras.hero?.kicker ?? header.shortAbout}</p>
            <h1 className="hero-name rise d3">
              <span className="text-gradient">{header.name}</span>
            </h1>
            <p className="hero-tagline rise d4">
              <Emphasis text={extras.hero?.tagline ?? lead} emphasis={extras.hero?.emphasis} />
            </p>
            <div className="cta-row rise d5">
              {email && (
                <a className="btn btn-primary" href={email}>
                  <Icon name="mail" />
                  Email me
                </a>
              )}
              {github && (
                <External className="btn btn-ghost" href={github}>
                  <Icon name="github" />
                  GitHub
                </External>
              )}
              {linkedin && (
                <External className="btn btn-ghost" href={linkedin}>
                  <Icon name="linkedin" />
                  LinkedIn
                </External>
              )}
            </div>
          </div>

          <aside className="hero-card glass rise d6" aria-label="At a glance">
            <div className="card-chrome" aria-hidden="true">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="chrome-title">now.json</span>
            </div>
            <dl className="kv">
              {current && (
                <>
                  <dt>role</dt>
                  <dd>{current.title}</dd>
                  <dt>at</dt>
                  <dd>{current.company}</dd>
                  {current.location && (
                    <>
                      <dt>based</dt>
                      <dd>{current.location}</dd>
                    </>
                  )}
                </>
              )}
              {extras.focus.length > 0 && (
                <>
                  <dt>focus</dt>
                  <dd>{extras.focus.join(' · ')}</dd>
                </>
              )}
            </dl>
            {extras.highlights.length > 0 && (
              <>
                {extras.highlightsCaption && <p className="metrics-caption">{extras.highlightsCaption}</p>}
                <ul className="metrics">
                  {extras.highlights.map((h) => (
                    <li key={h.label}>
                      <span className="metric-value">{h.value}</span>
                      <span className="metric-label">{h.label}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        </section>

        <Section id="about" index="01" title="About">
          <div className="about-grid reveal">
            <p className="lead">{lead}</p>
            {rest && <p className="about-rest">{rest}</p>}
          </div>
        </Section>

        <Section id="experience" index="02" title="Experience">
          <ol className="timeline">
            {resume.workExperience
              .filter((w) => w.company && w.title)
              .map((job) => (
                <JobCard key={`${job.company}-${job.start}`} job={job} />
              ))}
          </ol>
        </Section>

        {extras.projects.length > 0 && (
          <Section id="projects" index="03" title="Projects">
            <ul className="bento">
              {extras.projects.map((p) => (
                <li key={p.url} className={cx('bento-cell reveal', p.featured && 'wide')}>
                  <External href={p.url} className="bento-card" label={`${p.name} on GitHub`}>
                    <span className="bento-top">
                      <span className="lang">
                        <span className={cx('lang-dot', `lang-${slug(p.language)}`)} aria-hidden="true" />
                        {p.language}
                      </span>
                      <Icon name="arrow" />
                    </span>
                    <span className="bento-body">
                      <span className="bento-name">{p.name}</span>
                      <span className="bento-tagline">{p.tagline}</span>
                      <span className="bento-desc">{p.description}</span>
                      {p.tags.length > 0 && (
                        <span className="tags">
                          {p.tags.map((t) => (
                            <span key={t} className="tag">
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </span>
                  </External>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section id="skills" index={extras.projects.length ? '04' : '03'} title="Skills">
          <ul className="sr-only">
            {skills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <div className="marquee reveal" aria-hidden="true">
            <SkillTrack skills={skills.slice(0, half)} />
            {skills.length > half && <SkillTrack skills={skills.slice(half)} reverse />}
          </div>
        </Section>

        {resume.education.length > 0 && (
          <Section id="education" index={extras.projects.length ? '05' : '04'} title="Education">
            <ul className="edu">
              {resume.education
                .filter((e) => e.school && e.degree)
                .map((e) => (
                  <li key={`${e.school}-${e.degree}`} className="edu-card reveal">
                    <span className="edu-years">{formatYears(e.start, e.end)}</span>
                    <span className="edu-degree">{e.degree}</span>
                    <span className="edu-school">{e.school}</span>
                  </li>
                ))}
            </ul>
          </Section>
        )}

        {email && (
          <section className="contact container reveal" aria-labelledby="contact-title">
            <p className="section-index">{'// contact'}</p>
            <h2 id="contact-title">{extras.contactHeadline ?? "Let's talk."}</h2>
            <a className="contact-email" href={email}>
              {c.email}
            </a>
          </section>
        )}
      </main>

      <footer className="footer container">
        <span>
          © {year} {header.name}
        </span>
        <span>
          Built from a fork of <External href={sourceUrl}>self.so</External> · zero JavaScript
        </span>
      </footer>
    </>
  );
}
