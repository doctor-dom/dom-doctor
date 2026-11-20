import type { APIRoute } from "astro";
import { sendSiteEmail } from "../../lib/email";
import { verifyTurnstile } from "../../lib/turnstile";

export const prerender = false;

type WorkerEnv = {
	EMAIL: { send: Parameters<typeof sendSiteEmail>[0] };
	TURNSTILE_SECRET: string;
	CONTACT_TO: string;
};

export const POST: APIRoute = async ({ request, clientAddress, locals, redirect }) => {
	const env = (locals as { runtime?: { env?: WorkerEnv } }).runtime?.env;
	if (!env?.EMAIL || !env.CONTACT_TO) {
		return redirect("/contact?error=server", 303);
	}

	const form = await request.formData();
	const token = String(form.get("cf-turnstile-response") ?? "");
	const ok = await verifyTurnstile(token, env.TURNSTILE_SECRET ?? "", clientAddress);
	if (!ok) return redirect("/contact?error=turnstile", 303);

	const name = String(form.get("name") ?? "").trim();
	const replyEmail = String(form.get("replyEmail") ?? "").trim();
	const message = String(form.get("message") ?? "").trim();
	if (!name || !replyEmail || !message) return redirect("/contact?error=missing", 303);

	const body = [`From: ${name}`, `Reply-To: ${replyEmail}`, "", message].join("\n");
	try {
		await sendSiteEmail(env.EMAIL, env.CONTACT_TO, `dom.doctor contact · ${name}`, body);
	} catch {
		return redirect("/contact?error=email", 303);
	}

	return redirect("/contact?sent=1", 303);
};