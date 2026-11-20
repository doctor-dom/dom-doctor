type SendEmailBinding = {
	send: (message: {
		to: string;
		from: { email: string; name?: string };
		subject: string;
		text: string;
		html?: string;
	}) => Promise<unknown>;
};

export async function sendSiteEmail(
	email: SendEmailBinding,
	to: string,
	subject: string,
	text: string,
) {
	await email.send({
		to,
		from: { email: "notebook@dom.doctor", name: "dom.doctor notebook" },
		subject,
		text,
		html: `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
	});
}

function escapeHtml(input: string): string {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}