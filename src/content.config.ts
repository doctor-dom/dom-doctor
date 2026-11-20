import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const profile = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/profile" }),
	schema: z.object({
		name: z.string().default(""),
		role: z.string().default(""),
		focus: z.string().default(""),
		shortBio: z.string().default(""),
		longBio: z.string().default(""),
		affiliations: z.array(z.string()).default([]),
		disclosures: z.array(z.string()).default([]),
		orcid: z.string().optional(),
		github: z.string().optional(),
		scholar: z.string().optional(),
		institution: z.string().optional(),
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		status: z.enum(["idea", "private", "public repo", "deployed"]),
		audience: z.enum(["me", "lab", "clinic", "public"]),
		role: z.enum(["author", "maintainer", "contributor"]),
		repo: z.string().url().optional(),
		live: z.string().url().optional(),
		docs: z.string().url().optional(),
		updated: z.coerce.date(),
		draft: z.boolean().default(false),
	}),
});

const reviews = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/reviews" }),
	schema: z.object({
		tool: z.string(),
		category: z.enum(["clinical workflow", "research", "personal"]),
		setting: z.string(),
		asOf: z.coerce.date(),
		stillUsing: z.enum(["yes", "sometimes", "no"]),
		conflicts: z.string().default("none"),
		summary: z.string(),
		wouldRepeat: z.boolean(),
		draft: z.boolean().default(false),
	}),
});

const notes = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/notes" }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		setting: z.string(),
		status: z.enum(["personal", "research", "operational"]),
		summary: z.string(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { profile, projects, reviews, notes };