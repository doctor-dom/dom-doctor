// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { remarkNotebook } from "./src/lib/remark-notebook.ts";

// https://astro.build/config
export default defineConfig({
	site: "https://dom.doctor",
	adapter: cloudflare({
		imageService: "compile",
	}),
	markdown: {
		remarkPlugins: [remarkNotebook],
	},
});