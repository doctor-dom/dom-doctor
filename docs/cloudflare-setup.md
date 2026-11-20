# Cloudflare setup (dom.doctor)

Run these once if automated setup did not finish.

## D1 subscribers table

If subscribe fails, apply the migration:

```bash
npx wrangler d1 execute dom-doctor-subscribers --remote --file=migrations/0001_subscribers.sql
```

## Email Sending

Enable sending from `dom.doctor` in the dashboard (or retry when token includes `email_sending`):

```bash
npx wrangler email sending enable dom.doctor
```

Use `notebook@dom.doctor` as the from address in Worker code after the domain is enabled.

## Turnstile

Widget name: `dom-doctor`. Add the Workers hostname if forms fail on preview:

`dom-doctor.<account>.workers.dev`

## Web Analytics

Create a site in **Analytics & Logs → Web Analytics**, copy the beacon token into `.env` / Workers Builds as `PUBLIC_CF_WEB_ANALYTICS_TOKEN`, rebuild, and redeploy.

## Custom domain (`dom.doctor`)

If deploy reports existing DNS records on the apex, remove the current **A/CNAME** for `@` (and point **www** via redirect after the Worker is attached). Then either:

1. Dashboard → **Workers & Pages** → **dom-doctor** → **Settings** → **Domains & Routes** → **Add** → **Custom domain** → `dom.doctor`, or
2. Restore the `routes` block in `wrangler.jsonc` and redeploy:

```jsonc
"routes": [
  { "pattern": "dom.doctor", "custom_domain": true }
]
```

## www → apex

In **Rules → Redirect Rules**, redirect `www.dom.doctor` to `https://dom.doctor` (301).

## Workers Builds

Connect the GitHub repo, branch `main`, build command `npm run build`, deploy `npx wrangler deploy`. Set build environment variables: `PUBLIC_TURNSTILE_SITEKEY`, optional `PUBLIC_CF_WEB_ANALYTICS_TOKEN`. Worker secrets stay in the dashboard: `TURNSTILE_SECRET`, `CONTACT_TO`.