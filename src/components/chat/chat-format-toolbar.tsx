"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { cn } from "@/lib/utils";
import {
	Bold,
	Code,
	Italic,
	Link2,
	List,
	ListOrdered,
	SquareCode,
	Strikethrough,
	TextQuote,
} from "lucide-react";
import type { RefObject } from "react";

import { wrapTextareaSelection } from "@/lib/chat/wrap-selection";

type ChatFormatToolbarProps = {
	textareaRef: RefObject<HTMLTextAreaElement | null>;
	value: string;
	disabled?: boolean;
	onChange: (value: string) => void;
};

type FormatAction = {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	run: () => void;
};

function ToolbarButton({
	label,
	icon: Icon,
	disabled,
	onClick,
}: {
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	disabled?: boolean;
	onClick: () => void;
}) {
	return (
		<ActionTooltip label={label}>
			<button
				type="button"
				disabled={disabled}
				onMouseDown={(event) => {
					// Keep textarea selection when clicking the toolbar.
					event.preventDefault();
				}}
				onClick={onClick}
				className="flex size-7 items-center justify-center rounded-md text-shell-muted transition hover:bg-shell-hover hover:text-foreground disabled:opacity-40"
				aria-label={label}
			>
				<Icon className="size-3.5" />
			</button>
		</ActionTooltip>
	);
}

function Separator() {
	return <div className="mx-1 h-4 w-px bg-shell-border" aria-hidden />;
}

export function ChatFormatToolbar({
	textareaRef,
	value,
	disabled,
	onChange,
}: ChatFormatToolbarProps) {
	const apply = (options: Parameters<typeof wrapTextareaSelection>[2]) => {
		const textarea = textareaRef.current;
		if (!textarea || disabled) return;

		const { next, selectionStart, selectionEnd } = wrapTextareaSelection(
			textarea,
			value,
			options,
		);
		onChange(next);
		requestAnimationFrame(() => {
			textarea.focus();
			textarea.setSelectionRange(selectionStart, selectionEnd);
		});
	};

	const groups: FormatAction[][] = [
		[
			{
				label: "Bold",
				icon: Bold,
				run: () => apply({ prefix: "**", suffix: "**", placeholder: "bold" }),
			},
			{
				label: "Italic",
				icon: Italic,
				run: () => apply({ prefix: "*", suffix: "*", placeholder: "italic" }),
			},
			{
				label: "Strikethrough",
				icon: Strikethrough,
				run: () => apply({ prefix: "~~", suffix: "~~", placeholder: "strike" }),
			},
			{
				label: "Link",
				icon: Link2,
				run: () =>
					apply({
						prefix: "[",
						suffix: "](url)",
						placeholder: "link text",
					}),
			},
		],
		[
			{
				label: "Bulleted list",
				icon: List,
				run: () =>
					apply({
						prefix: "- ",
						suffix: "",
						placeholder: "list item",
						block: true,
					}),
			},
			{
				label: "Numbered list",
				icon: ListOrdered,
				run: () =>
					apply({
						prefix: "1. ",
						suffix: "",
						placeholder: "list item",
						block: true,
					}),
			},
		],
		[
			{
				label: "Quote",
				icon: TextQuote,
				run: () =>
					apply({
						prefix: "> ",
						suffix: "",
						placeholder: "quote",
						block: true,
					}),
			},
			{
				label: "Inline code",
				icon: Code,
				run: () => apply({ prefix: "`", suffix: "`", placeholder: "" }),
			},
			{
				label: "Code block",
				icon: SquareCode,
				run: () =>
					apply({
						prefix: "```\n",
						suffix: "\n```",
						placeholder: "",
						block: true,
					}),
			},
		],
	];

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-0.5 border-b border-shell-border/70 px-2 py-1.5",
			)}
		>
			{groups.map((group, groupIndex) => (
				<div key={groupIndex} className="flex items-center">
					{groupIndex > 0 && <Separator />}
					{group.map((action) => (
						<ToolbarButton
							key={action.label}
							label={action.label}
							icon={action.icon}
							disabled={disabled}
							onClick={action.run}
						/>
					))}
				</div>
			))}
		</div>
	);
}
