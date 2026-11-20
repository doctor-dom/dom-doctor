# dom.doctor

Physician-scientist lab notebook: about page, project catalog, tool reviews, and a dated journal. Markdown in `src/content/`; Astro + Cloudflare Workers for deploy.

## Edit content

- `src/content/profile/index.md` — home and about
- `src/content/projects/*.md` — repository catalog
- `src/content/reviews/*.md` — first-person tool notes
- `src/content/notes/*.md` — journal / build log

See [DESIGN.md](./DESIGN.md) for typography and markdown conventions (`~~strike~~`, `++ink++`, `Margin:` notes).

## Local dev

```bash
npm install
cp .env.example .env
cp .dev.vars.example .dev.vars   # add secrets locally; never commit
npm run dev
```

## Deploy (Cloudflare Workers)

```bash
npm run build
npx wrangler deploy
```

Worker name: `dom-doctor`. Production domain: `https://dom.doctor` (custom domain attached in the dashboard or `wrangler.jsonc` routes).

Secrets (not in git): `TURNSTILE_SECRET`, `CONTACT_TO`. Public env: `PUBLIC_TURNSTILE_SITEKEY`, optional `PUBLIC_CF_WEB_ANALYTICS_TOKEN`.

Interactive tools with their own repos deploy as separate Workers on subdomains; link them from project `live` URLs.