import type { Html, Paragraph, PhrasingContent, Root, RootContent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/** `++ink++`, `^((note))`, `^((#id))`. Avoid `[]`/`{}` so Markdown/Astro do not eat the marker. */
const INLINE = /\+\+([^+]+)\+\+|\^\(\(#([A-Za-z][\w-]*)\)\)|\^\(\(([\s\S]+?)\)\)/g;

export const remarkNotebook: Plugin<[], Root> = () => (tree) => {
	let autoId = 0;

	visit(tree, (node) => {
		if (!("children" in node) || !Array.isArray(node.children)) return;
		if (node.type === "paragraph" || node.type === "heading" || node.type === "emphasis" || node.type === "strong") {
			node.children = rewritePhrasing(node.children as PhrasingContent[], () => {
				autoId += 1;
				return `sn-${autoId}`;
			});
		}
	});

	visit(tree, "paragraph", (node, index, parent) => {
		if (!parent || index === undefined) return;
		const parsed = parseMarginParagraph(node);
		if (!parsed) return;

		if (parsed.id) {
			if (fillSidenote(tree, parsed.id, parsed.note)) {
				parent.children.splice(index, 1);
			}
			return;
		}

		const attached = fillNearestPending(parent.children, index, parsed.note);
		if (attached) {
			parent.children.splice(index, 1);
			return;
		}

		parent.children[index] = {
			type: "html",
			value: `<p class="margin-paragraph"><span class="sidenote-body is-loose">${escapeHtml(parsed.note)}</span></p>`,
		};
	});
};

function rewritePhrasing(
	children: PhrasingContent[],
	nextId: () => string,
): PhrasingContent[] {
	const out: PhrasingContent[] = [];

	for (let i = 0; i < children.length; i += 1) {
		const cur = children[i];
		const next = children[i + 1];

		if (cur.type === "text" && next && isExpressionNode(next) && cur.value.endsWith("^")) {
			const note = expressionValue(next).trim();
			if (cur.value.length > 1) {
				out.push({ type: "text", value: cur.value.slice(0, -1) });
			}
			out.push({ type: "html", value: sidenoteHtml(nextId(), note) });
			i += 1;
			continue;
		}

		if (cur.type === "text") {
			out.push(...splitText(cur.value, nextId));
			continue;
		}

		if ("children" in cur && Array.isArray(cur.children)) {
			out.push({
				...cur,
				children: rewritePhrasing(cur.children as PhrasingContent[], nextId),
			} as PhrasingContent);
			continue;
		}

		out.push(cur);
	}

	return out;
}

function splitText(value: string, nextId: () => string): PhrasingContent[] {
	if (!/\+\+|\^\(\(/.test(value)) {
		return [{ type: "text", value }];
	}

	const children: PhrasingContent[] = [];
	let last = 0;
	INLINE.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = INLINE.exec(value))) {
		if (match.index > last) {
			children.push({ type: "text", value: value.slice(last, match.index) });
		}

		if (match[1] !== undefined) {
			children.push({
				type: "html",
				value: `<span class="handwritten">${escapeHtml(match[1])}</span>`,
			});
		} else if (match[2] !== undefined) {
			children.push({ type: "html", value: sidenoteHtml(match[2], "", true) });
		} else if (match[3] !== undefined) {
			children.push({ type: "html", value: sidenoteHtml(nextId(), match[3].trim()) });
		}

		last = match.index + match[0].length;
	}

	if (last < value.length) {
		children.push({ type: "text", value: value.slice(last) });
	}

	return children;
}

function isExpressionNode(node: PhrasingContent): boolean {
	const type = (node as { type: string }).type;
	return type === "mdxTextExpression" || type === "mdxJsxTextExpression";
}

function expressionValue(node: PhrasingContent): string {
	if ("value" in node && typeof node.value === "string") return node.value;
	return "";
}

function sidenoteHtml(id: string, note: string, pending = false): string {
	const pendingAttr = pending && !note ? ' data-sidenote-pending="true"' : "";
	return `<span class="sidenote"${pendingAttr} data-sidenote="${escapeAttr(id)}"><sup class="sidenote-mark" aria-hidden="true">^</sup><span class="sidenote-body">${escapeHtml(note)}</span></span>`;
}

function parseMarginParagraph(node: Paragraph): { id?: string; note: string } | null {
	const raw = phrasingToText(node.children).trim();
	const labeled = /^Margin\[([^\]]+)\]:\s*(.*)$/s.exec(raw);
	if (labeled) return { id: labeled[1].trim(), note: labeled[2].trim() };
	const plain = /^Margin:\s*(.*)$/s.exec(raw);
	if (plain) return { note: plain[1].trim() };
	return null;
}

function phrasingToText(children: PhrasingContent[]): string {
	return children
		.map((child) => {
			if (child.type === "text") return child.value;
			if (child.type === "html") return "";
			if ("value" in child && typeof child.value === "string") return child.value;
			if ("children" in child && Array.isArray(child.children)) {
				return phrasingToText(child.children as PhrasingContent[]);
			}
			return "";
		})
		.join("");
}

function fillSidenote(tree: Root, id: string, note: string): boolean {
	let found = false;
	visit(tree, "html", (node: Html) => {
		if (found) return;
		if (!node.value.includes(`data-sidenote="${escapeAttr(id)}"`)) return;
		node.value = injectNote(node.value, note);
		found = true;
	});
	return found;
}

function fillNearestPending(siblings: RootContent[], beforeIndex: number, note: string): boolean {
	for (let i = beforeIndex - 1; i >= 0; i -= 1) {
		const sib = siblings[i];
		if (sib.type === "html" && sib.value.includes("data-sidenote-pending")) {
			sib.value = injectNote(sib.value, note);
			return true;
		}
		if (sib.type === "paragraph") {
			const html = findPendingHtml(sib.children);
			if (html) {
				html.value = injectNote(html.value, note);
				return true;
			}
		}
	}
	return false;
}

function findPendingHtml(children: PhrasingContent[]): Html | undefined {
	for (let i = children.length - 1; i >= 0; i -= 1) {
		const child = children[i];
		if (child.type === "html" && child.value.includes("data-sidenote-pending")) return child;
	}
	return undefined;
}

function injectNote(html: string, note: string): string {
	return html
		.replace(' data-sidenote-pending="true"', "")
		.replace(
			/<span class="sidenote-body">[\s\S]*?<\/span><\/span>$/,
			`<span class="sidenote-body">${escapeHtml(note)}</span></span>`,
		);
}

function escapeHtml(input: string): string {
	return input
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function escapeAttr(input: string): string {
	return escapeHtml(input);
}