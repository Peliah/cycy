"use client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { useForm } from "react-hook-form";
import z from "zod";

interface ChatInputProps {
	apiUrl: string;
	query: Record<string, string>;
	name: string;
	type: "conversation" | "channel";
}

const formSchema = z.object({
	content: z.string().min(1),
});

export function ChatInput({ apiUrl, query, name, type }: ChatInputProps) {
	const router = useRouter();
	const onOpen = useStore.use.onOpen();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: "",
		},
	});
	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: apiUrl,
				query,
			});
			await axios.post(url, values);
			form.reset();
			router.refresh();
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="relative px-4 pb-5 pt-3">
									<button
										type="button"
										onClick={() => onOpen("messageFile", { apiUrl, query })}
										className="absolute left-8 top-6 flex size-6 items-center justify-center rounded-full bg-shell-accent text-shell-accent-foreground transition hover:bg-shell-accent/90"
									>
										<Plus className="size-4" />
									</button>
									<Input
										disabled={isLoading}
										className="border-shell-border bg-shell-nav py-6 pl-14 pr-14 text-foreground placeholder:text-shell-muted focus-visible:ring-shell-accent"
										placeholder={`Message ${type === "conversation" ? name : `#${name}`}`}
										{...field}
									/>
									<div className="absolute right-8 top-6">
										<EmojiPicker
											onChange={(value) =>
												form.setValue("content", `${field.value} ${value}`)
											}
										/>
									</div>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
