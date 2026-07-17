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
import { Form } from "@/components/ui/form";
import { CreateServerFormFields } from "@/components/modals/create-server-form-fields";
import {
	createServerSchema,
	type CreateServerFormValues,
} from "@/components/modals/create-server-schema";
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

export function CreateServerModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onClose = useStore.use.onClose();
	const [isUploading, setIsUploading] = useState(false);

	const isModelOpen = isOpen && type === "createServer";

	const form = useForm<CreateServerFormValues>({
		resolver: zodResolver(createServerSchema),
		defaultValues: {
			name: "",
			imageUrl: undefined,
		},
	});

	const isLoading = form.formState.isSubmitting;

	useEffect(() => {
		if (isModelOpen) {
			form.reset({ name: "", imageUrl: undefined });
			setIsUploading(false);
		}
	}, [isModelOpen, form]);

	const onSubmit = async (values: CreateServerFormValues) => {
		try {
			await axios.post("/api/servers", values);
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
					<DialogTitle className="text-2xl text-center font-bold">Create a server</DialogTitle>
					<DialogDescription className="text-center text-zinc-500">
						Give your server a name and an optional icon. You can change these anytime.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<CreateServerFormFields
							form={form}
							isSubmitting={isLoading}
							onUploadingChange={setIsUploading}
						/>
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
										Creating...
									</>
								) : (
									"Create server"
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
