import { getCollection } from "astro:content";

export async function getProfile() {
	const entries = await getCollection("profile");
	const entry = entries[0];
	if (!entry) {
		throw new Error("Missing src/content/profile/index.md");
	}
	return entry;
}

export type ProfileLinks = {
	orcid?: string;
	github?: string;
	scholar?: string;
	institution?: string;
};

export function profileLinks(data: ProfileLinks) {
	return [
		{ label: "ORCID", href: data.orcid },
		{ label: "GitHub", href: data.github },
		{ label: "Google Scholar", href: data.scholar },
		{ label: "Institution", href: data.institution },
	].filter((link): link is { label: string; href: string } => Boolean(link.href));
}