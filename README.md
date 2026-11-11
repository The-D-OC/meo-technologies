# Meo Technologies

Marketing website for **Meo Technologies** — software development and technology creator for businesses.
Built with [Astro](https://astro.build) and TypeScript.

## Pages

| Route      | Purpose                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `/`        | Home — hero, services, process, products, FAQ, contact                  |
| `/privacy` | Privacy Policy for App Store / Google Play listings (incl. account deletion) |
| `/404`     | Not found page                                                          |

Use `https://<your-domain>/privacy` as the **Privacy Policy URL** in App Store Connect and Google Play Console,
and `https://<your-domain>/privacy#deletion` as the **account deletion URL** Google Play asks for.

## Motion

- Astro View Transitions for smooth page-to-page navigation
- Word-by-word headline reveals, blur-up scroll reveals, animated counters
- Magnetic buttons, 3D tilt cards, cursor spotlight, parallax and scroll progress
- All motion respects `prefers-reduced-motion`

Motion lives in `src/scripts/motion.ts`; global styles in `src/styles/global.css`.

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-checks then builds to ./dist
npm run preview
```

## Deployment — Cloudflare Workers (rolling)

The site deploys to Cloudflare Workers as static assets (`wrangler.jsonc`) through GitHub Actions
(`.github/workflows/deploy.yml`):

- **Push to `main`** → build → upload a new Worker version with no traffic → smoke-test it on its own
  preview URL → shift traffic **10% → 50% → 100%**, health-checking at every stage. Any failure routes 100%
  back to the previous version automatically (`scripts/rollout.sh`).
- **Pull requests** → a preview version with its own URL, posted as a PR comment. Production is untouched.
- **Run workflow (manual)** → choose your own stages (e.g. `100` to ship immediately) and hold time.

The first deploy goes straight to 100%, because a gradual rollout needs an existing version to split traffic with.

### One-time setup

1. **Cloudflare API token:** in Cloudflare, go to *My Profile → API Tokens → Create Token* and use the
   **Edit Cloudflare Workers** template.
2. **GitHub repository secrets:** in *Settings → Secrets and variables → Actions*, add
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (shown on your Cloudflare dashboard home page).
3. **Repository variables (optional, same page, Variables tab):**
   - `PRODUCTION_URL`: your live URL (e.g. `https://meotechnologies.com`), which turns on production health checks
   - `ROLLOUT_STAGES`: default `10 50 100`
   - `ROLLOUT_WAIT`: seconds held at each stage, default `180`
4. **Custom domain:** uncomment `routes` in `wrangler.jsonc` and set your domain.
5. **Version affinity (recommended once on a custom domain):** during a split, a visitor could load HTML from one
   version and a hashed `/_astro/*` file from the other. To pin each visitor to one version, add a
   *Transform Rule → Modify Request Header* on your zone: expression `true`, header
   `Cloudflare-Workers-Version-Key`, dynamic value `ip.src`.

Deploy from your machine with `npx wrangler login`, then `npm run deploy` (rolling) or `npm run deploy:now` (instant).
Roll back at any time with `npx wrangler rollback`.

## Before going live

1. Set your domain in `astro.config.mjs` (`site`).
2. Update emails and location in `src/site.ts`.
3. Review `/privacy` against what your apps actually collect — and have it checked by a legal professional.
