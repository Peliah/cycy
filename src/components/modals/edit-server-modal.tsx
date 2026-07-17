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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ServerAvatarPicker } from "@/components/modals/server-avatar-picker";
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
	name: z.string().min(1, { message: "Server name is required" }),
	imageUrl: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function EditServerModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onClose = useStore.use.onClose();
	const data = useStore.use.data();
	const [isUploading, setIsUploading] = useState(false);

	const isModelOpen = isOpen && type === "editServer";

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			imageUrl: undefined,
		},
	});

	useEffect(() => {
		if (isModelOpen && data?.server) {
			form.reset({
				name: data.server.name,
				imageUrl: data.server.imageUrl ?? undefined,
			});
			setIsUploading(false);
		}
	}, [isModelOpen, data?.server, form]);

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: FormValues) => {
		try {
			await axios.patch(`/api/servers/${data?.server?.id}`, values);
			form.reset();
			router.refresh();
			onClose();
		} catch (error) {
			console.error(error);
		}
	};

	const handleClose = () => {
		form.reset();
		setIsUploading(false);
		onClose();
	};

	return (
		<Dialog open={isModelOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent
				className="bg-white text-black p-0 overflow-hidden"
				onPointerDownOutside={(event) => isUploading && event.preventDefault()}
				onInteractOutside={(event) => isUploading && event.preventDefault()}
			>
				<DialogHeader className="pt-8 px-6">
					<DialogTitle className="text-2xl text-center font-bold">Edit your server</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Update your server name and icon.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<div className="space-y-6 px-6">
							<FormField
								control={form.control}
								name="imageUrl"
								render={({ field }) => (
									<FormItem className="flex flex-col items-center">
										<ServerAvatarPicker
											value={field.value ?? ""}
											onChange={(url) => field.onChange(url || undefined)}
											onUploadingChange={setIsUploading}
											onError={(message) => {
												if (message) {
													form.setError("imageUrl", { message });
												} else {
													form.clearErrors("imageUrl");
												}
											}}
											disabled={isLoading}
										/>
										<FormMessage className="text-center" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="uppercase text-xs font-bold text-zinc-500">
											Server name
										</FormLabel>
										<FormControl>
											<Input
												disabled={isLoading}
												className="bg-zinc-300/50 border-0 focus-visible:ring-0 text-black focus-visible:ring-offset-0"
												placeholder="Enter server name"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<DialogFooter className="bg-gray-100 px-6 py-4">
							<Button
								type="submit"
								variant="primary"
								disabled={isLoading || isUploading}
								className="w-full"
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									"Save changes"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
