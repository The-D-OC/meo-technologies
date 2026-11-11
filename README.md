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

## Before going live

1. Set your domain in `astro.config.mjs` (`site`).
2. Update emails and location in `src/site.ts`.
3. Review `/privacy` against what your apps actually collect — and have it checked by a legal professional.
