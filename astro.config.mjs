// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { unified } from "@astrojs/markdown-remark";
import { remarkNotebook } from "./src/lib/remark-notebook.ts";

export default defineConfig({
	site: "https://dom.doctor",
	adapter: cloudflare({
		imageService: "compile",
	}),
	markdown: {
		processor: unified({
			remarkPlugins: [remarkNotebook],
		}),
	},
});