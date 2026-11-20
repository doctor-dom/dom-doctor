import type { APIRoute } from "astro";

export const prerender = false;

type WorkerEnv = {
	DB: D1Database;
};

export const GET: APIRoute = async ({ url, locals, redirect }) => {
	const env = (locals as { runtime?: { env?: WorkerEnv } }).runtime?.env;
	const token = url.searchParams.get("token");
	if (!env?.DB || !token) return redirect("/notes?error=confirm", 303);

	const row = await env.DB.prepare(
		"SELECT email FROM subscribers WHERE token = ? AND status = 'pending' LIMIT 1",
	)
		.bind(token)
		.first<{ email: string }>();

	if (!row?.email) return redirect("/notes?error=confirm", 303);

	await env.DB.prepare(
		`UPDATE subscribers SET status = 'confirmed', confirmed_at = datetime('now') WHERE token = ?`,
	)
		.bind(token)
		.run();

	return redirect("/notes?subscribed=1", 303);
};