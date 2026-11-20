import type { APIRoute } from "astro";
import { sendSiteEmail } from "../../lib/email";
import { verifyTurnstile } from "../../lib/turnstile";

export const prerender = false;

type WorkerEnv = {
	DB: D1Database;
	EMAIL: { send: Parameters<typeof sendSiteEmail>[0] };
	TURNSTILE_SECRET: string;
	CONTACT_TO: string;
	SITE_URL: string;
};

export const POST: APIRoute = async ({ request, clientAddress, locals, redirect }) => {
	const env = (locals as { runtime?: { env?: WorkerEnv } }).runtime?.env;
	if (!env?.DB || !env.EMAIL || !env.CONTACT_TO) {
		return redirect("/notes?error=server", 303);
	}

	const form = await request.formData();
	const token = String(form.get("cf-turnstile-response") ?? "");
	const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET ?? "", clientAddress);
	if (!ok) return redirect("/notes?error=turnstile", 303);

	const email = String(form.get("email") ?? "")
		.trim()
		.toLowerCase();
	if (!email || !email.includes("@")) return redirect("/notes?error=email", 303);

	const confirmToken = crypto.randomUUID();
	const siteUrl = (env.SITE_URL ?? "https://dom.doctor").replace(/\/$/, "");

	await env.DB.prepare(
		`INSERT INTO subscribers (email, status, token)
     VALUES (?, 'pending', ?)
     ON CONFLICT(email) DO UPDATE SET status = 'pending', token = excluded.token, created_at = datetime('now')`,
	)
		.bind(email, confirmToken)
		.run();

	const confirmUrl = `${siteUrl}/api/confirm?token=${encodeURIComponent(confirmToken)}`;
	const userText = [
		"Confirm your subscription to dom.doctor journal updates:",
		confirmUrl,
		"",
		"If you did not request this, ignore this message.",
	].join("\n");

	try {
		await sendSiteEmail(env.EMAIL, email, "Confirm dom.doctor journal", userText);
		await sendSiteEmail(
			env.EMAIL,
			env.CONTACT_TO,
			"dom.doctor · new subscribe request",
			`Pending confirmation for ${email}`,
		);
	} catch {
		return redirect("/notes?error=email", 303);
	}

	return redirect("/notes?pending=1", 303);
};