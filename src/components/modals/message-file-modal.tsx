"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { UploadDropzone } from "@/lib/uploadthing";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Image from "next/image";
import qs from "query-string";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useStore } from "@/store/store";
import { FileIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function MessageFileModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();
	const isModalOpen = isOpen && type === "messageFile";

	const schema = z.object({
		fileUrl: z.string().min(1, { message: "Attachment is invalid" }),
	});
	const form = useForm({
		resolver: zodResolver(schema),
		defaultValues: {
			fileUrl: "",
		},
	});

	const { register, handleSubmit, formState, watch } = form;

	const isLoading = formState.isSubmitting;

	const onSubmit = async (values: z.infer<typeof schema>) => {
		try {
			const url = qs.stringifyUrl({
				url: data?.apiUrl || "",
				query: data?.query,
			});
			await axios.post(url, { ...values, content: values.fileUrl });
			router.refresh();
			form.reset();
			handleClose();
		} catch (error) {
			console.log(error);
		}
	};
	const handleClose = () => {
		form.reset();
		onClose();
	};
	return (
		<Dialog open={isModalOpen} onOpenChange={handleClose}>
			<DialogContent className="overflow-hidden bg-shell-chat p-0 text-foreground">
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">
						Add an attachment
					</DialogTitle>
					<DialogDescription className="text-center text-shell-muted">
						Upload an image or a document to share
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
						<div className="space-y-8 px-6">
							<div className="flex items-center justify-center text-center">
								<FormField
									control={form.control}
									name="fileUrl"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												{field?.value && field?.value?.split(".").pop() !== "pdf" ? (
													<div className="relative h-20 w-20">
														<Image
															fill
															objectFit="cover"
															src={field.value}
															className="rounded-full"
															alt="Server Image"
														/>
														<Button
															onClick={() => field.onChange("")}
															type="button"
															className="w-7 h-7  p-[.35rem] absolute bg-rose-500 hover:bg-rose-800 text-white top-0 right-0 rounded-full shadow-sm"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-6 w-6 "
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M6 18L18 6M6 6l12 12"
																/>
															</svg>
														</Button>
													</div>
												) : !field?.value ? (
													<UploadDropzone
														className="ut-button:bg-shell-accent ut-button:text-shell-accent-foreground ut-button:hover:bg-shell-accent/90 ut-button:ut-readying:bg-shell-accent/90 ut-button:ut-uploading:bg-shell-accent/90 ut-label:text-shell-accent ut-allowed-content:text-shell-muted mt-4 border-shell-border"
														endpoint="messageFile"
														onClientUploadComplete={(res) => {
															field.onChange(res?.[0].url);
															console.log("Files: ", res);
															alert("Upload Completed");
														}}
													/>
												) : (
													<div className="relative mt-2 flex items-center rounded-md border border-shell-border bg-shell-nav p-2">
														<FileIcon className="size-10 fill-shell-active stroke-shell-accent" />
														<a
															href={field?.value}
															target="_blank"
															rel="noopener noreferrer"
															className="ml-2 text-sm text-shell-accent hover:underline"
														>
															{field?.value}
														</a>
														<Button
															onClick={() => field.onChange("")}
															type="button"
															className="w-7 h-7  p-[.35rem] absolute bg-rose-500 hover:bg-rose-800 text-white -top-2 -right-2 rounded-full shadow-sm"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-6 w-6 "
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M6 18L18 6M6 6l12 12"
																/>
															</svg>
														</Button>
													</div>
												)}
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
						<DialogFooter className="bg-shell-nav px-6 py-4">
							<Button type="submit" variant="primary" disabled={isLoading} className="w-full sm:w-20">
								Send
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
