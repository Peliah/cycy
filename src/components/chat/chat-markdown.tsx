import { cn } from "@/lib/utils";

function escapeHtml(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

/** Lightweight markdown → HTML for chat messages (bold/italic/strike/code/links/lists). */
export function renderChatMarkdown(raw: string) {
	const escaped = escapeHtml(raw);

	const withCodeBlocks = escaped.replace(
		/```([\s\S]*?)```/g,
		(_match, code: string) =>
			`<pre class="my-1 overflow-x-auto rounded-md bg-shell-nav px-2 py-1.5 text-[13px]"><code>${code.trim()}</code></pre>`,
	);

	const lines = withCodeBlocks.split("\n");
	const htmlLines: string[] = [];
	let inUl = false;
	let inOl = false;

	const closeLists = () => {
		if (inUl) {
			htmlLines.push("</ul>");
			inUl = false;
		}
		if (inOl) {
			htmlLines.push("</ol>");
			inOl = false;
		}
	};

	for (const line of lines) {
		if (line.startsWith("<pre")) {
			closeLists();
			htmlLines.push(line);
			continue;
		}

		const ulMatch = line.match(/^[-*] (.+)$/);
		const olMatch = line.match(/^\d+\. (.+)$/);
		const quoteMatch = line.match(/^&gt; (.+)$/);

		if (ulMatch) {
			if (inOl) {
				htmlLines.push("</ol>");
				inOl = false;
			}
			if (!inUl) {
				htmlLines.push('<ul class="my-1 list-disc pl-5">');
				inUl = true;
			}
			htmlLines.push(`<li>${formatInline(ulMatch[1] ?? "")}</li>`);
			continue;
		}

		if (olMatch) {
			if (inUl) {
				htmlLines.push("</ul>");
				inUl = false;
			}
			if (!inOl) {
				htmlLines.push('<ol class="my-1 list-decimal pl-5">');
				inOl = true;
			}
			htmlLines.push(`<li>${formatInline(olMatch[1] ?? "")}</li>`);
			continue;
		}

		closeLists();

		if (quoteMatch) {
			htmlLines.push(
				`<blockquote class="my-1 border-l-2 border-shell-border pl-3 text-shell-muted">${formatInline(quoteMatch[1] ?? "")}</blockquote>`,
			);
			continue;
		}

		if (line.trim() === "") {
			htmlLines.push("<br />");
			continue;
		}

		htmlLines.push(`<p class="my-0.5">${formatInline(line)}</p>`);
	}

	closeLists();
	return htmlLines.join("");
}

function formatInline(value: string) {
	return value
		.replace(
			/`([^`]+)`/g,
			'<code class="rounded bg-shell-nav px-1 py-0.5 text-[13px]" >$1</code>',
		)
		.replace(
			/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
			'<a href="$2" target="_blank" rel="noreferrer noopener" class="text-shell-accent underline underline-offset-2">$1</a>',
		)
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>")
		.replace(/~~([^~]+)~~/g, "<s>$1</s>");
}

type ChatMarkdownProps = {
	content: string;
	className?: string;
};

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
	return (
		<div
			className={cn("break-words text-sm leading-relaxed", className)}
			dangerouslySetInnerHTML={{ __html: renderChatMarkdown(content) }}
		/>
	);
}
