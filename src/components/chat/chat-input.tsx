"use client";

import { ChatFormatToolbar } from "@/components/chat/chat-format-toolbar";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/store/store";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Plus, SendHorizonal, Type } from "lucide-react";
import qs from "query-string";
import {
	useLayoutEffect,
	useRef,
	useState,
	type MutableRefObject,
} from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface ChatInputProps {
	apiUrl: string;
	query: Record<string, string>;
	name: string;
	type: "conversation" | "channel";
	placeholder?: string;
}

const formSchema = z.object({
	content: z.string().min(1),
});

const TEXTAREA_MAX_HEIGHT = 160; // matches max-h-40

function resizeTextarea(textarea: HTMLTextAreaElement | null) {
	if (!textarea) return;
	textarea.style.height = "0px";
	const next = Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT);
	textarea.style.height = `${next}px`;
	textarea.style.overflowY =
		textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
}

export function ChatInput({
	apiUrl,
	query,
	name,
	type,
	placeholder: placeholderProp,
}: ChatInputProps) {
	const queryClient = useQueryClient();
	const onOpen = useStore.use.onOpen();
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [showFormatting, setShowFormatting] = useState(true);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: "",
		},
	});
	const isLoading = form.formState.isSubmitting;
	const content = form.watch("content");
	const canSend = content.trim().length > 0 && !isLoading;

	useLayoutEffect(() => {
		resizeTextarea(textareaRef.current);
	}, [content]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: apiUrl,
				query,
			});
			await axios.post(url, values);
			form.reset();
			requestAnimationFrame(() => resizeTextarea(textareaRef.current));

			// Ensure sender sees the message even if the socket emit is missed.
			const chatId = query.channelId ?? query.conversationId;
			if (chatId) {
				await queryClient.invalidateQueries({ queryKey: [`chat:${chatId}`] });
			}
		} catch (error) {
			console.error(error);
		}
	};

	const placeholder =
		placeholderProp ??
		(type === "conversation" ? `Message ${name}` : `Message #${name}`);

	return (
		<div className="bg-shell-chat px-4 pb-5 pt-2">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="content"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<div className="overflow-hidden rounded-xl border border-shell-border bg-shell-chat shadow-sm focus-within:border-shell-accent/50">
										{showFormatting && (
											<ChatFormatToolbar
												textareaRef={textareaRef}
												value={field.value ?? ""}
												disabled={isLoading}
												onChange={(next) => {
													field.onChange(next);
													requestAnimationFrame(() =>
														resizeTextarea(textareaRef.current),
													);
												}}
											/>
										)}
										<Textarea
											{...field}
											ref={(node) => {
												textareaRef.current = node;
												if (typeof field.ref === "function") {
													field.ref(node);
												} else if (field.ref) {
													(
														field.ref as MutableRefObject<HTMLTextAreaElement | null>
													).current = node;
												}
												resizeTextarea(node);
											}}
											disabled={isLoading}
											placeholder={placeholder}
											rows={1}
											onChange={(event) => {
												field.onChange(event);
												resizeTextarea(event.currentTarget);
											}}
											onKeyDown={(event) => {
												if (event.key === "Enter" && !event.shiftKey) {
													event.preventDefault();
													if (canSend) {
														void form.handleSubmit(onSubmit)();
													}
												}
											}}
											className="min-h-[44px] max-h-40 resize-none overflow-hidden rounded-none border-0 bg-transparent px-4 py-3 text-[15px] text-foreground shadow-none placeholder:text-shell-muted focus-visible:ring-0 focus-visible:ring-offset-0"
										/>
										<div className="flex items-center justify-between gap-2 border-t border-shell-border/70 px-2 py-1.5">
											<div className="flex items-center gap-0.5">
												<button
													type="button"
													disabled={isLoading}
													onClick={() =>
														onOpen("messageFile", { apiUrl, query })
													}
													className="flex size-8 items-center justify-center rounded-md text-shell-muted transition hover:bg-shell-hover hover:text-foreground disabled:opacity-50"
													aria-label="Add attachment"
												>
													<Plus className="size-[18px]" />
												</button>
												<button
													type="button"
													disabled={isLoading}
													onClick={() => setShowFormatting((v) => !v)}
													className={cn(
														"flex size-8 items-center justify-center rounded-md transition",
														showFormatting
															? "bg-shell-hover text-foreground"
															: "text-shell-muted hover:bg-shell-hover hover:text-foreground",
													)}
													aria-label="Toggle formatting"
													aria-pressed={showFormatting}
												>
													<Type className="size-[18px]" />
												</button>
												<div className="flex size-8 items-center justify-center rounded-md text-shell-muted transition hover:bg-shell-hover hover:text-foreground [&_svg]:size-[18px]">
													<EmojiPicker
														onChange={(value) =>
															form.setValue(
																"content",
																`${field.value ?? ""}${value}`,
																{ shouldDirty: true },
															)
														}
													/>
												</div>
											</div>
											<button
												type="submit"
												disabled={!canSend}
												className={cn(
													"flex size-8 items-center justify-center rounded-md transition",
													canSend
														? "bg-shell-accent text-shell-accent-foreground hover:bg-shell-accent/90"
														: "text-shell-muted opacity-40",
												)}
												aria-label="Send message"
											>
												<SendHorizonal className="size-4" />
											</button>
										</div>
									</div>
								</FormControl>
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	);
}
