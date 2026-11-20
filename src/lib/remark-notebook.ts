import type { Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/** Turn `++insertion++` into handwritten blue markup; flag `Margin:` paragraphs. */
export const remarkNotebook: Plugin<[], Root> = () => (tree) => {
	visit(tree, "text", (node, index, parent) => {
		if (!parent || index === undefined || !node.value.includes("++")) return;
		const parts = node.value.split(/(\+\+[^+]+\+\+)/g);
		if (parts.length === 1) return;

		const children: Array<{ type: "html"; value: string } | typeof node> = [];
		for (const part of parts) {
			const match = /^\+\+(.+)\+\+$/.exec(part);
			if (match) {
				children.push({
					type: "html",
					value: `<span class="handwritten">${escapeHtml(match[1])}</span>`,
				});
			} else if (part) {
				children.push({ type: "text", value: part });
			}
		}

		parent.children.splice(index, 1, ...children);
	});

	visit(tree, "paragraph", (node, index, parent) => {
		if (!parent || index === undefined) return;
		const first = node.children[0];
		if (first?.type !== "text") return;
		const trimmed = first.value.trim();
		if (!trimmed.startsWith("Margin:")) return;

		const note = trimmed.replace(/^Margin:\s*/, "");
		parent.children[index] = {
			type: "html",
			value: `<p class="margin-paragraph"><span class="margin-note-inline">${escapeHtml(note)}</span></p>`,
		};
	});
};

function escapeHtml(input: string): string {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}