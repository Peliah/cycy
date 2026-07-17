"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { FileIcon, Loader2, X } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getUploadedFileUrl, UploadDropzone } from "@/lib/uploadthing";

const createSchema = z.object({
	name: z.string().min(1, "Group name is required"),
	learningGoal: z.string().min(1, "Describe what you want to learn"),
	learningReason: z.string().min(1, "Tell us why you're learning this"),
	materials: z
		.array(
			z.object({
				fileName: z.string(),
				fileUrl: z.string().url(),
				mimeType: z.string(),
			}),
		)
		.min(1, "Upload at least one PDF, Word, or text file"),
});

const joinSchema = z.object({
	inviteCode: z.string().min(1, "Invite code is required"),
});

type CreateValues = z.infer<typeof createSchema>;
type JoinValues = z.infer<typeof joinSchema>;

type MaterialItem = CreateValues["materials"][number];

export function InitialModel() {
	const router = useRouter();
	const [mode, setMode] = useState<"create" | "join">("create");
	const [error, setError] = useState<string | null>(null);

	const createForm = useForm<CreateValues>({
		resolver: zodResolver(createSchema),
		defaultValues: {
			name: "",
			learningGoal: "",
			learningReason: "",
			materials: [],
		},
	});

	const joinForm = useForm<JoinValues>({
		resolver: zodResolver(joinSchema),
		defaultValues: {
			inviteCode: "",
		},
	});

	const materials = createForm.watch("materials");
	const isCreateLoading = createForm.formState.isSubmitting;
	const isJoinLoading = joinForm.formState.isSubmitting;

	const onCreate = async (values: CreateValues) => {
		setError(null);
		try {
			const server = await axios.post("/api/onboarding/create-group", values);
			createForm.reset();
			router.push(`/servers/${server.data.id}`);
			router.refresh();
		} catch (err) {
			const message =
				axios.isAxiosError(err) && err.response?.data?.error
					? String(err.response.data.error)
					: "Could not create group. Try again.";
			setError(message);
		}
	};

	const onJoin = async (values: JoinValues) => {
		setError(null);
		try {
			const res = await axios.post("/api/onboarding/join", values);
			joinForm.reset();
			router.push(`/invite/${res.data.inviteCode}`);
			router.refresh();
		} catch (err) {
			const message =
				axios.isAxiosError(err) && err.response?.data?.error
					? String(err.response.data.error)
					: "Could not join group. Check the invite code.";
			setError(message);
		}
	};

	const removeMaterial = (url: string) => {
		createForm.setValue(
			"materials",
			materials.filter((m) => m.fileUrl !== url),
			{ shouldValidate: true },
		);
	};

	return (
		<Dialog open>
			<DialogContent
				className="max-h-[90vh] overflow-y-auto bg-white p-0 text-black sm:max-w-lg"
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader className="space-y-2 px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">
						Set up your study group
					</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Create a new group with learning materials, or join one with an invite
						code.
					</DialogDescription>
				</DialogHeader>

				<div className="px-6 pb-8">
					<Tabs
						value={mode}
						onValueChange={(v) => {
							setMode(v as "create" | "join");
							setError(null);
						}}
						className="w-full"
					>
						<TabsList className="mb-6 grid w-full grid-cols-2">
							<TabsTrigger value="create">Create group</TabsTrigger>
							<TabsTrigger value="join">Join group</TabsTrigger>
						</TabsList>

						{error && (
							<p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
								{error}
							</p>
						)}

						<TabsContent value="create" className="mt-0 space-y-4">
							<Form {...createForm}>
								<form
									onSubmit={createForm.handleSubmit(onCreate)}
									className="space-y-4"
								>
									<FormField
										control={createForm.control}
										name="name"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Group name</FormLabel>
												<FormControl>
													<Input
														placeholder="e.g. Calculus study circle"
														disabled={isCreateLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={createForm.control}
										name="learningGoal"
										render={({ field }) => (
											<FormItem>
												<FormLabel>What do you want to learn?</FormLabel>
												<FormControl>
													<Textarea
														placeholder="Short description of the topic or course"
														rows={2}
														disabled={isCreateLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={createForm.control}
										name="learningReason"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Why are you learning this?</FormLabel>
												<FormControl>
													<Textarea
														placeholder="e.g. Exam prep, retaking a course, self-study"
														rows={2}
														disabled={isCreateLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<div className="space-y-2">
										<FormLabel>Learning materials</FormLabel>
										<p className="text-xs text-muted-foreground">
											PDF, Word (.docx), or text files. Extraction happens later —
											we just need the files for now.
										</p>
										<UploadDropzone
											endpoint="learningMaterial"
											onClientUploadComplete={(res) => {
												const next: MaterialItem[] = [...materials];
												for (const file of res ?? []) {
													const url = getUploadedFileUrl([file]);
													if (!url) continue;
													next.push({
														fileName: file.name,
														fileUrl: url,
														mimeType: file.type || "application/octet-stream",
													});
												}
												createForm.setValue("materials", next, {
													shouldValidate: true,
												});
											}}
											onUploadError={(err) => {
												setError(err.message || "Upload failed");
											}}
											className="ut-button:bg-[#0A4D4A] ut-button:ut-readying:bg-[#0A4D4A]/80 ut-label:text-[#0A4D4A] border-zinc-200"
										/>
										{createForm.formState.errors.materials && (
											<p className="text-sm font-medium text-destructive">
												{createForm.formState.errors.materials.message}
											</p>
										)}
										{materials.length > 0 && (
											<ul className="space-y-2">
												{materials.map((m) => (
													<li key={m.fileUrl}>
														<Card className="py-0 shadow-none">
															<CardContent className="flex items-center gap-3 px-3 py-2">
																<FileIcon className="size-4 shrink-0 text-zinc-500" />
																<span className="min-w-0 flex-1 truncate text-sm">
																	{m.fileName}
																</span>
																<Button
																	type="button"
																	variant="ghost"
																	size="icon"
																	className="size-8 shrink-0"
																	onClick={() => removeMaterial(m.fileUrl)}
																	disabled={isCreateLoading}
																>
																	<X className="size-4" />
																	<span className="sr-only">Remove</span>
																</Button>
															</CardContent>
														</Card>
													</li>
												))}
											</ul>
										)}
									</div>

									<Button
										type="submit"
										className="w-full bg-[#0A4D4A] text-white hover:bg-[#083D3B]"
										disabled={isCreateLoading}
									>
										{isCreateLoading ? (
											<>
												<Loader2 className="mr-2 size-4 animate-spin" />
												Creating…
											</>
										) : (
											"Create group"
										)}
									</Button>
								</form>
							</Form>
						</TabsContent>

						<TabsContent value="join" className="mt-0">
							<Card className="mb-4 border-dashed shadow-none">
								<CardHeader className="pb-2">
									<CardTitle className="text-base">Have an invite?</CardTitle>
									<CardDescription>
										Paste the invite code or full invite link to join an existing
										group. Goal and reason come from the group.
									</CardDescription>
								</CardHeader>
							</Card>
							<Form {...joinForm}>
								<form
									onSubmit={joinForm.handleSubmit(onJoin)}
									className="space-y-4"
								>
									<FormField
										control={joinForm.control}
										name="inviteCode"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Invite code</FormLabel>
												<FormControl>
													<Input
														placeholder="Paste invite code or link"
														disabled={isJoinLoading}
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<Button
										type="submit"
										className="w-full bg-[#0A4D4A] text-white hover:bg-[#083D3B]"
										disabled={isJoinLoading}
									>
										{isJoinLoading ? (
											<>
												<Loader2 className="mr-2 size-4 animate-spin" />
												Joining…
											</>
										) : (
											"Join group"
										)}
									</Button>
								</form>
							</Form>
						</TabsContent>
					</Tabs>
				</div>
			</DialogContent>
		</Dialog>
	);
}
