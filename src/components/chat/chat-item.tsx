"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member, MemberRole, Profile } from "@prisma/client";
import axios from "axios";
import { Edit, FileText, ShieldAlert, ShieldCheck, Trash } from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import qs from "query-string";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface ChatItemProps {
	id: string;
	content: string;
	member: Member & { profile: Profile };
	timestamp: string;
	fileUrl: string | null;
	deleted: boolean;
	currentMember: Member;
	isUpdated: boolean;
	socketUrl: string;
	socketQuery: Record<string, string>;
}

const roleIconMap = {
	GUEST: null,
	ADMIN: <ShieldAlert className="ml-2 size-4 text-amber-600 dark:text-amber-400" />,
	MODERATOR: <ShieldCheck className="ml-2 size-4 text-shell-accent" />,
};

const formSchema = z.object({
	content: z.string().min(1),
});

export function ChatItem({
	id,
	content,
	member,
	timestamp,
	fileUrl,
	deleted,
	currentMember,
	isUpdated,
	socketUrl,
	socketQuery,
}: ChatItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const onOpen = useStore.use.onOpen();
	const router = useRouter();
	const params = useParams();

	const isAdmin = currentMember.role === MemberRole.ADMIN;
	const isModerator = currentMember.role === MemberRole.MODERATOR;
	const isOwner = currentMember.id === member.id;
	const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
	const canEditMessage = !deleted && isOwner && !fileUrl;
	const isPDF = fileUrl?.endsWith(".pdf") && fileUrl;
	const isImage = fileUrl && !isPDF;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: content,
		},
	});

	useEffect(() => {
		form.reset({
			content: content,
		});
	}, [content, form]);

	useEffect(() => {
		const handleKeyDown = (event: any) => {
			if (event.key === "Escape" || event.keyCode === 27) {
				setIsEditing(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: `${socketUrl}/${id}`,
				query: socketQuery,
			});
			await axios.patch(url, values);
			form.reset();
			setIsEditing(false);
			// router.refresh();
		} catch (error) {
			console.error(error);
		}
	};

	const onMemberClick = () => {
		if(member?.id === currentMember.id) return;
		router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
	}

	return (
		<div className="group relative flex w-full items-center p-4 transition hover:bg-shell-hover/60">
			<div className="group flex w-full items-start gap-x-2">
				<div
					onClick={onMemberClick}
					className="cursor-pointer transition hover:opacity-90"
				>
					<UserAvatar src={member.profile.imageUrl ?? undefined} />
				</div>
				<div className="flex w-full flex-col">
					<div className="flex items-center gap-x-2">
						<div className="flex items-center">
							<p
								onClick={onMemberClick}
								className="cursor-pointer text-sm font-semibold text-foreground hover:underline"
							>
								{member.profile.name}
							</p>
							<ActionTooltip label={member.role}>
								{roleIconMap[member.role]}
							</ActionTooltip>
						</div>
						<span className="text-xs text-shell-muted">{timestamp}</span>
					</div>
					{isImage && (
						<a
							href={fileUrl}
							target="_blank"
							rel="noreferrer noopener"
							className="relative mt-2 flex aspect-square h-48 w-48 items-center overflow-hidden rounded-md border border-shell-border bg-shell-nav"
						>
							<Image src={fileUrl} alt={content} fill className="object-cover" />
						</a>
					)}
					{isPDF && (
						<a
							href={fileUrl}
							target="_blank"
							rel="noreferrer noopener"
							className="relative mt-2 flex aspect-square h-48 w-48 items-center overflow-hidden rounded-md border border-shell-border bg-shell-nav"
						>
							<FileText className="m-auto size-12 text-shell-muted" />
						</a>
					)}
					{!fileUrl && !isEditing && (
						<p
							className={cn(
								"text-sm text-foreground/90",
								deleted && "mt-1 text-xs italic text-shell-muted",
							)}
						>
							{content}
							{isUpdated && !deleted && (
								<span className="ml-1 text-[10px] text-shell-muted">(edited)</span>
							)}
						</p>
					)}
					{!fileUrl && isEditing && (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex w-full items-center gap-x-2 pt-2"
							>
								<FormField
									control={form.control}
									name="content"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<div className="relative w-full">
													<Input
														disabled={isLoading}
														className="border-shell-border bg-shell-nav p-2 text-foreground focus-visible:ring-shell-accent"
														placeholder="Edited message"
														{...field}
													/>
												</div>
											</FormControl>
										</FormItem>
									)}
								/>
								<Button disabled={isLoading} size="sm" variant="primary">
									Save
								</Button>
							</form>
							<span className="mt-1 text-[10px] text-shell-muted">
								Press escape to cancel, enter to save
							</span>
						</Form>
					)}
				</div>
			</div>
			{canDeleteMessage && (
				<div className="absolute -top-2 right-5 hidden items-center gap-x-2 rounded-md border border-shell-border bg-shell-chat p-1 shadow-sm group-hover:flex">
					{canEditMessage && (
						<ActionTooltip label="Edit">
							<Edit
								onClick={() => setIsEditing(true)}
								className="ml-auto size-4 cursor-pointer text-shell-muted transition hover:text-foreground"
							/>
						</ActionTooltip>
					)}
					<ActionTooltip label="Delete">
						<Trash
							onClick={() =>
								onOpen("deleteMessage", {
									apiUrl: `${socketUrl}/${id}`,
									query: socketQuery,
								})
							}
							className="ml-auto size-4 cursor-pointer text-shell-muted transition hover:text-destructive"
						/>
					</ActionTooltip>
				</div>
			)}
		</div>
	);
}
