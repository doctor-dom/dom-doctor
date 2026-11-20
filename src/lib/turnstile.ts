export async function verifyTurnstile(
	token: string,
	secret: string,
	remoteip?: string,
): Promise<boolean> {
	if (!token || !secret) return false;
	const body = new URLSearchParams({ secret, response: token });
	if (remoteip) body.set("remoteip", remoteip);

	const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body,
	});

	const result = (await response.json()) as { success?: boolean };
	return result.success === true;
}