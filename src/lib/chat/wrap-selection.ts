type WrapOptions = {
	prefix: string;
	suffix?: string;
	placeholder?: string;
	block?: boolean;
};

export function wrapTextareaSelection(
	textarea: HTMLTextAreaElement,
	value: string,
	options: WrapOptions,
): { next: string; selectionStart: number; selectionEnd: number } {
	const { prefix, suffix = prefix, placeholder = "text", block = false } = options;
	const start = textarea.selectionStart;
	const end = textarea.selectionEnd;
	const selected = value.slice(start, end);
	const hasSelection = selected.length > 0;
	const body = hasSelection ? selected : placeholder;

	let insertion: string;
	let selectStart: number;
	let selectEnd: number;

	if (block) {
		const before = value.slice(0, start);
		const needsLeadingNewline = before.length > 0 && !before.endsWith("\n");
		const lead = needsLeadingNewline ? "\n" : "";
		insertion = `${lead}${prefix}${body}${suffix}`;
		selectStart = start + lead.length + prefix.length;
		selectEnd = selectStart + body.length;
	} else {
		insertion = `${prefix}${body}${suffix}`;
		selectStart = start + prefix.length;
		selectEnd = selectStart + body.length;
	}

	const next = value.slice(0, start) + insertion + value.slice(end);
	return { next, selectionStart: selectStart, selectionEnd: selectEnd };
}
