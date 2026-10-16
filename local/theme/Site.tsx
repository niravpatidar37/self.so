import type { ReactNode } from 'react';
import type { ResumeDataSchemaType } from '@/lib/resume';
import { getShortMonth, getYear } from '@/components/resume/resumeUtils';
import { stackIconFile, type Project, type SiteExtras } from '../extras';
import { MAP_BORDER, MAP_LAND, MAP_PIN, MAP_VIEWBOX } from './mapShape';

/*
 * Light "framed sheet" portfolio theme, server-rendered to static HTML with zero JavaScript.
 * Every effect lives in local/theme/site.css; no element carries an inline style attribute,
 * so the page works under a CSP that forbids scripts and inline styles.
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

const firstSentence = (s: string) => s.match(/^[\s\S]+?[.!?](?=\s|$)/)?.[0] ?? s;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');

type IconName = 'mail' | 'github' | 'linkedin' | 'arrow' | 'up' | 'pin';
const ICONS: Record<IconName, ReactNode> = {
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
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  pin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
};

const Icon = ({ name }: { name: IconName }) => (
  <svg
    className="icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {ICONS[name]}
  </svg>
);

/** Dot-matrix map: a dot pattern clipped to Natural Earth land (lakes cut out), plus the border and a pin. */
function DotMap({ code }: { code: string }) {
  return (
    <svg className="map" viewBox={MAP_VIEWBOX} role="img" aria-label={`Map of the Great Lakes region with a pin on ${MAP_PIN.name}`}>
      <defs>
        <pattern id="map-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle className="map-dot" cx="3.5" cy="3.5" r="2" />
        </pattern>
        <radialGradient id="map-fade" cx="50%" cy="55%" r="62%">
          <stop offset="55%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <mask id="map-vignette">
          <rect width="100%" height="100%" fill="url(#map-fade)" />
        </mask>
        <clipPath id="map-land">
          <path d={MAP_LAND} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g mask="url(#map-vignette)">
        <rect width="100%" height="100%" fill="url(#map-dots)" clipPath="url(#map-land)" />
        <path className="map-border" d={MAP_BORDER} fill="none" />
      </g>
      <g className="map-pin">
        <circle className="map-pulse" cx={MAP_PIN.x} cy={MAP_PIN.y} r="5" />
        <circle className="map-pin-dot" cx={MAP_PIN.x} cy={MAP_PIN.y} r="4.5" />
        <rect className="map-tag" x={MAP_PIN.x + 9} y={MAP_PIN.y - 9} width={code.length * 7.6 + 12} height="18" rx="9" />
        <text className="map-tag-text" x={MAP_PIN.x + 15} y={MAP_PIN.y + 3.8}>
          {code}
        </text>
      </g>
    </svg>
  );
}

const External = ({ href, className, children, label }: { href: string; className?: string; children: ReactNode; label?: string }) => (
  <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={label}>
    {children}
  </a>
);

const Card = ({ id, label, className, children }: { id?: string; label?: string; className?: string; children: ReactNode }) => (
  <section id={id} className={cx('card reveal', className)} aria-label={label}>
    {label && <p className="eyebrow">{label}</p>}
    {children}
  </section>
);

function Emphasis({ text, emphasis }: { text: string; emphasis?: string }) {
  if (!emphasis || !text.includes(emphasis)) return <>{text}</>;
  const i = text.indexOf(emphasis);
  return (
    <>
      {text.slice(0, i)}
      <span className="accent">{emphasis}</span>
      {text.slice(i + emphasis.length)}
    </>
  );
}

function Portrait({ photo, initials, ring, name }: { photo?: string; initials: string; ring?: string; name: string }) {
  return (
    <div className="portrait rise d3">
      {ring && (
        <svg className="ring" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <defs>
            <path id="ring-path" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
          </defs>
          <text>
            {/* fit one copy exactly to the circumference (2π·86 ≈ 540) so the seam never overlaps */}
            <textPath href="#ring-path" textLength={538} lengthAdjust="spacing">
              {ring}
            </textPath>
          </text>
        </svg>
      )}
      {photo ? (
        <img className="photo" src={photo} alt={`Portrait of ${name}`} width={512} height={512} decoding="async" />
      ) : (
        <span className="photo monogram" aria-hidden="true">
          {initials}
        </span>
      )}
    </div>
  );
}

function WorkCard({ p }: { p: Project }) {
  return (
    <article className="work reveal">
      <External href={p.url} className="work-shot" label={`${p.name} on GitHub`}>
        {p.preview ? (
          <img
            src={`media/${p.preview}`}
            alt={`${p.name} README preview`}
            width={1200}
            height={750}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="work-shot-fallback">{p.name}</span>
        )}
      </External>
      <div className="work-head">
        <h3>
          <External href={p.url}>{p.name}</External>
        </h3>
        <span className={cx('status', `status-${slug(p.status)}`)}>
          <span className="dot" aria-hidden="true" />
          {p.status}
        </span>
      </div>
      <p className="work-tagline">{p.tagline}</p>
      <p className="work-desc">{p.description}</p>
      <ul className="chips" aria-label={`${p.name} stack`}>
        <li className="chip">
          <span className={cx('lang-dot', `lang-${slug(p.language)}`)} aria-hidden="true" />
          {p.language}
        </li>
        {p.tags.map((t) => (
          <li key={t} className="chip">
            {t}
          </li>
        ))}
      </ul>
      <p className="work-links">
        <External href={p.url}>source ↗</External>
      </p>
    </article>
  );
}

function PathItem({ job }: { job: Job }) {
  const bullets = toBullets(job.description);
  const shown = bullets.slice(0, 2);
  const hidden = bullets.slice(2);
  return (
    <li className={cx('path-item', !job.end && 'is-current')}>
      <span className="path-date">{formatRange(job.start, job.end)}</span>
      <div className="path-body">
        <h3>
          {job.title} <span className="at">@</span> <span className="company">{job.company}</span>
        </h3>
        <p className="path-meta">
          {[job.contract, job.location].filter(Boolean).join(' · ')}
          {!job.end && <span className="now-tag">now</span>}
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
      </div>
    </li>
  );
}

const ContactTile = ({ href, icon, title, hint, external }: { href: string; icon: IconName; title: string; hint: string; external?: boolean }) => {
  const inner = (
    <>
      <Icon name={icon} />
      <span className="tile-text">
        <span className="tile-title">{title}</span>
        <span className="tile-hint">{hint}</span>
      </span>
      <span className="tile-arrow">
        <Icon name="arrow" />
      </span>
    </>
  );
  return external ? (
    <External href={href} className="tile">
      {inner}
    </External>
  ) : (
    <a href={href} className="tile">
      {inner}
    </a>
  );
};

export function Site({
  resume,
  extras,
  sourceUrl,
  year,
  photo,
}: {
  resume: ResumeDataSchemaType;
  extras: SiteExtras;
  sourceUrl: string;
  year: number;
  photo?: string;
}) {
  const { header } = resume;
  const c = header.contacts;
  const email = c.email ? `mailto:${c.email}` : undefined;
  const github = c.github ? `https://github.com/${c.github}` : undefined;
  const linkedin = c.linkedin ? `https://www.linkedin.com/in/${c.linkedin}` : undefined;
  const current = resume.workExperience.find((w) => !w.end);
  const firstName = header.name.split(/\s+/)[0];
  const initials = header.name
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  const hero = extras.hero;
  const jobs = resume.workExperience.filter((w) => w.company && w.title);
  const education = resume.education.filter((e) => e.school && e.degree);
  const nav = [
    ['about', 'about'],
    ...(extras.projects.length ? [['work', 'work']] : []),
    ['path', 'path'],
    ['contact', 'contact'],
  ] as const;

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="halftone" aria-hidden="true">
        <span className="ht ht-a" />
        <span className="ht ht-b" />
      </div>

      <div className="frame" id="top">
        <span className="tick tl" aria-hidden="true" />
        <span className="tick tr" aria-hidden="true" />
        <span className="tick bl" aria-hidden="true" />
        <span className="tick br" aria-hidden="true" />

        <main id="main" className="sheet">
          {/* hero */}
          <section id="about" className="card hero" aria-labelledby="hero-title">
            <div className="hero-top rise d1">
              <span className="wordmark">{header.name}</span>
              {current && (
                <span className="status status-live">
                  <span className="dot" aria-hidden="true" />
                  Now at {current.company}
                </span>
              )}
            </div>
            <div className="hero-grid">
              <div className="hero-copy">
                <h1 id="hero-title" className="rise d2">
                  Hi, I&apos;m {firstName}
                </h1>
                <p className="role rise d2">{hero?.role ?? header.shortAbout}</p>
                <p className="intro rise d3">
                  {hero ? (
                    <>
                      {hero.intro}{' '}
                      {hero.stack.map((s, i) => (
                        <span key={s}>
                          <strong>{s}</strong>
                          {i < hero.stack.length - 1 ? ', ' : ' '}
                        </span>
                      ))}
                      <Emphasis text={hero.outro} emphasis={hero.emphasis} />
                    </>
                  ) : (
                    firstSentence(resume.summary)
                  )}
                </p>
                <div className="cta-row rise d4">
                  {email && (
                    <a className="btn btn-dark" href={email}>
                      Drop me a mail
                      <Icon name="arrow" />
                    </a>
                  )}
                  {linkedin && (
                    <External className="btn btn-line" href={linkedin}>
                      <Icon name="linkedin" />
                      LinkedIn
                    </External>
                  )}
                  {github && (
                    <External className="btn btn-line" href={github}>
                      <Icon name="github" />
                      GitHub
                    </External>
                  )}
                </div>
              </div>
              <Portrait photo={photo} initials={initials} ring={extras.ring} name={header.name} />
            </div>
          </section>

          {/* based-in + tools */}
          <div className="row row-split">
            {extras.basedIn && (
              <Card className="based" label="based in">
                <DotMap code={extras.basedIn.code} />
                <p className="based-foot">
                  <span>
                    <Icon name="pin" /> {extras.basedIn.city}
                  </span>
                  <span>{extras.basedIn.timezone}</span>
                </p>
              </Card>
            )}
            <Card className="tools" label="the tools">
              <ul className="chips chips-lg">
                {header.skills.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* stack: same-origin icons, swapped for dark tiles when the OS is in dark mode */}
          {extras.stack.length > 0 && (
            <Card id="stack" label="the stack" className="stack">
              <div className="stack-rows">
                {extras.stack.map((g) => (
                  <div key={g.label} className="stack-row">
                    <p className="stack-label">{g.label}</p>
                    <ul className="stack-icons" aria-label={g.label}>
                      {g.icons.map((i) => (
                        <li key={i.id} title={i.name}>
                          <picture>
                            <source srcSet={`stack/${stackIconFile(i.id, 'dark')}`} media="(prefers-color-scheme: dark)" />
                            <img
                              src={`stack/${stackIconFile(i.id, 'light')}`}
                              alt={i.name}
                              width={44}
                              height={44}
                              loading="lazy"
                              decoding="async"
                            />
                          </picture>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* work */}
          {extras.projects.length > 0 && (
            <Card id="work" label="the work">
              <div className="work-grid">
                {extras.projects.map((p) => (
                  <WorkCard key={p.url} p={p} />
                ))}
              </div>
            </Card>
          )}

          {/* path */}
          <Card id="path" label="the path">
            <ol className="path">
              {jobs.map((job) => (
                <PathItem key={`${job.company}-${job.start}`} job={job} />
              ))}
            </ol>
            {education.length > 0 && (
              <>
                <p className="eyebrow eyebrow-sub">the schooling</p>
                <ul className="edu">
                  {education.map((e) => (
                    <li key={`${e.school}-${e.degree}`}>
                      <span className="path-date">{formatYears(e.start, e.end)}</span>
                      <span className="edu-degree">{e.degree}</span>
                      <span className="edu-school">{e.school}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card>

          {/* signal + now */}
          <div className="row row-signal">
            <Card id="contact" label="the signal" className="signal">
              <h2>{extras.contactHeadline ?? "Let's talk."}</h2>
              <div className="tiles">
                {email && <ContactTile href={email} icon="mail" title="Drop me a mail" hint="Roles, projects, or a quick question" />}
                {linkedin && <ContactTile href={linkedin} icon="linkedin" title="Connect on LinkedIn" hint="Recruiters and formal intros" external />}
                {github && <ContactTile href={github} icon="github" title="Browse the GitHub" hint="The code behind the projects" external />}
                <ContactTile href={sourceUrl} icon="github" title="Read this site's code" hint="Zero JavaScript, local-only AI" external />
              </div>
            </Card>
            {extras.focus.length > 0 && (
              <Card label="currently into" className="now">
                <ul className="now-list">
                  {extras.focus.map((f) => (
                    <li key={f}>
                      <span className="dot" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                {current && (
                  <p className="now-foot">
                    {current.title} · {current.company}
                  </p>
                )}
              </Card>
            )}
          </div>
        </main>
      </div>

      <footer className="footer">
        <span>
          © {year} {header.name}
        </span>
        <span>
          built from a fork of <External href={sourceUrl}>self.so</External> · zero javascript
        </span>
        <span className="footer-links">
          {github && <External href={github}>GitHub</External>}
          {linkedin && <External href={linkedin}>LinkedIn</External>}
        </span>
      </footer>
      <p className="watermark" aria-hidden="true">
        {firstName}
      </p>

      <nav className="dock" aria-label="Sections">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
        {extras.basedIn && (
          <span className="dock-meta">
            {extras.basedIn.code} · {extras.basedIn.timezone.replace(' Time', '')}
          </span>
        )}
        <a href="#top" className="dock-up" aria-label="Back to top">
          <Icon name="up" />
        </a>
      </nav>
    </>
  );
}
