type Side = "left" | "right";

function ensureLayer(page: HTMLElement, className: string, tag: string): HTMLElement {
	let el = page.querySelector(`:scope > .${className}`);
	if (el instanceof HTMLElement || el instanceof SVGElement) return el as HTMLElement;
	el =
		tag === "svg"
			? document.createElementNS("http://www.w3.org/2000/svg", "svg")
			: document.createElement(tag);
	el.setAttribute("class", className);
	if (tag === "svg") el.setAttribute("aria-hidden", "true");
	page.prepend(el);
	return el as HTMLElement;
}

function hoistNotes(page: HTMLElement) {
	const gutter = ensureLayer(page, "sidenote-gutter", "div");
	page.querySelectorAll<HTMLElement>(".sidenote").forEach((sidenote, index) => {
		const body = sidenote.querySelector<HTMLElement>(".sidenote-body");
		if (!body || body.parentElement === gutter) return;
		body.dataset.sidenoteFor = String(index);
		sidenote.dataset.sidenoteIndex = String(index);
		gutter.append(body);
	});
}

function lastRect(el: Element): DOMRect | undefined {
	return [...el.getClientRects()].filter((r) => r.width > 0.5).at(-1);
}

function textEndRect(node: Text): DOMRect | undefined {
	const value = node.textContent ?? "";
	if (!value.trim()) return;
	const range = document.createRange();
	const end = value.trimEnd().length;
	const start = Math.max(0, value.lastIndexOf(" ", end - 1) + 1);
	range.setStart(node, start);
	range.setEnd(node, end);
	return [...range.getClientRects()].filter((r) => r.width > 0.5).at(-1);
}

function anchorRect(sidenote: HTMLElement, mark: HTMLElement): DOMRect {
	const prev = sidenote.previousSibling;
	if (prev instanceof Text) {
		const rect = textEndRect(prev);
		if (rect) return rect;
	}
	if (prev instanceof Element) {
		const rect = lastRect(prev);
		if (rect) return rect;
	}
	return lastRect(mark) ?? mark.getBoundingClientRect();
}

function contentEdges(page: HTMLElement) {
	const style = getComputedStyle(page);
	const padL = Number.parseFloat(style.paddingLeft) || 0;
	const padR = Number.parseFloat(style.paddingRight) || 0;
	return { padL, padR, innerLeft: padL, innerRight: page.offsetWidth - padR };
}

function chooseSide(markMid: number, innerLeft: number, innerRight: number): Side {
	return markMid - innerLeft <= innerRight - markMid ? "left" : "right";
}

function drawDefs(svg: SVGSVGElement) {
	const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
	marker.setAttribute("id", "sidenote-arrowhead");
	marker.setAttribute("markerWidth", "7");
	marker.setAttribute("markerHeight", "7");
	marker.setAttribute("refX", "6");
	marker.setAttribute("refY", "3.5");
	marker.setAttribute("orient", "auto");
	const head = document.createElementNS("http://www.w3.org/2000/svg", "path");
	head.setAttribute("d", "M0 0 L7 3.5 L0 7 Z");
	head.setAttribute("fill", "currentColor");
	marker.append(head);
	const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
	defs.append(marker);
	svg.append(defs);
}

function layoutPage(page: HTMLElement) {
	hoistNotes(page);
	const svg = ensureLayer(page, "sidenote-arrows", "svg") as unknown as SVGSVGElement;
	const pageBox = page.getBoundingClientRect();
	const gutter = page.querySelector<HTMLElement>(":scope > .sidenote-gutter");
	if (!gutter) return;
	const { padL, innerLeft, innerRight } = contentEdges(page);

	svg.replaceChildren();
	svg.setAttribute("width", String(page.offsetWidth));
	svg.setAttribute("height", String(page.offsetHeight));
	svg.setAttribute("viewBox", `0 0 ${page.offsetWidth} ${page.offsetHeight}`);
	drawDefs(svg);

	const lastBottom: Record<Side, number> = { left: 0, right: 0 };
	const notes = [...gutter.querySelectorAll<HTMLElement>(".sidenote-body")].filter(
		(note) => note.textContent?.trim(),
	);

	for (const note of notes) {
		if (note.classList.contains("is-loose")) {
			note.classList.add("is-left");
			note.classList.remove("is-right");
			continue;
		}
		const index = note.dataset.sidenoteFor;
		const sidenote = page.querySelector<HTMLElement>(`.sidenote[data-sidenote-index="${index}"]`);
		const mark = sidenote?.querySelector<HTMLElement>(".sidenote-mark");
		if (!sidenote || !mark) continue;

		const from = anchorRect(sidenote, mark);
		const markRect = lastRect(mark) ?? mark.getBoundingClientRect();
		const caretX =
			Math.abs(markRect.left - from.right) < 48 && Math.abs(markRect.top - from.top) < 28
				? markRect.left + markRect.width / 2 - pageBox.left
				: from.right - pageBox.left + 3;
		const side = chooseSide(caretX, innerLeft, innerRight);
		note.classList.toggle("is-left", side === "left");
		note.classList.toggle("is-right", side === "right");

		let top = from.top - pageBox.top - 2;
		if (top < lastBottom[side] + 8) top = lastBottom[side] + 8;
		if (top < 0) top = 0;
		note.style.top = `${top}px`;
		note.classList.add("is-placed");
		lastBottom[side] = top + note.offsetHeight;

		const noteBox = note.getBoundingClientRect();
		const x1 = caretX;
		const y1 = from.top - pageBox.top - 5;
		const x2 =
			(side === "left" ? noteBox.right + 4 : noteBox.left - 4) - pageBox.left;
		const y2 = noteBox.top + Math.min(14, noteBox.height * 0.38) - pageBox.top;
		const yGap = y1 - 4;
		const edgeX = side === "left" ? padL - 8 : innerRight + 8;
		const dir = side === "left" ? -1 : 1;
		const bend = x1 + dir * 8;

		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute(
			"d",
			`M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${yGap.toFixed(1)}, ${bend.toFixed(1)} ${yGap.toFixed(1)}, ${edgeX.toFixed(1)} ${yGap.toFixed(1)} Q ${((edgeX + x2) / 2).toFixed(1)} ${((yGap + y2) / 2).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
		);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke", "currentColor");
		path.setAttribute("stroke-width", "1.4");
		path.setAttribute("stroke-linecap", "round");
		path.setAttribute("stroke-linejoin", "round");
		path.setAttribute("marker-end", "url(#sidenote-arrowhead)");
		svg.append(path);
	}
}

export function initSidenotes() {
	const pages = [...document.querySelectorAll<HTMLElement>(".notebook-page")];
	const run = () => pages.forEach(layoutPage);

	run();
	requestAnimationFrame(run);
	document.fonts?.ready.then(run);
	addEventListener("resize", run);
	for (const page of pages) {
		new ResizeObserver(run).observe(page);
	}
}

initSidenotes();
