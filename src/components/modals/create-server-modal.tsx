"use client";

import { CreateServerFormFields } from "@/components/modals/create-server-form-fields";
import { CreateServerMaterialsFields } from "@/components/modals/create-server-materials-fields";
import {
	CREATE_SERVER_DEFAULTS,
	createServerSchema,
	joinServerSchema,
	type CreateServerFormValues,
	type JoinServerFormValues,
	type MaterialItem,
} from "@/components/modals/create-server-schema";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type ModalTab = "create" | "join";
type CreateStep = "details" | "materials";

export function CreateServerModal() {
	const router = useRouter();
	const type = useStore.use.type();
	const isOpen = useStore.use.isOpen();
	const onClose = useStore.use.onClose();

	const [tab, setTab] = useState<ModalTab>("create");
	const [createStep, setCreateStep] = useState<CreateStep>("details");
	const [isUploading, setIsUploading] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);

	const isModelOpen = isOpen && type === "createServer";

	const createForm = useForm<CreateServerFormValues>({
		resolver: zodResolver(createServerSchema),
		defaultValues: CREATE_SERVER_DEFAULTS,
	});

	const joinForm = useForm<JoinServerFormValues>({
		resolver: zodResolver(joinServerSchema),
		defaultValues: { inviteCode: "" },
	});

	const materials = createForm.watch("materials");
	const isCreateSubmitting = createForm.formState.isSubmitting;
	const isJoinSubmitting = joinForm.formState.isSubmitting;

	useEffect(() => {
		if (!isModelOpen) return;
		setTab("create");
		setCreateStep("details");
		setIsUploading(false);
		setFormError(null);
		createForm.reset(CREATE_SERVER_DEFAULTS);
		joinForm.reset({ inviteCode: "" });
	}, [isModelOpen, createForm, joinForm]);

	const handleClose = () => {
		createForm.reset(CREATE_SERVER_DEFAULTS);
		joinForm.reset({ inviteCode: "" });
		setIsUploading(false);
		setFormError(null);
		onClose();
	};

	const goToMaterials = async () => {
		setFormError(null);
		const ok = await createForm.trigger([
			"name",
			"imageUrl",
			"learningGoal",
			"learningReason",
		]);
		if (ok) setCreateStep("materials");
	};

	const onCreate = createForm.handleSubmit(async (values) => {
		setFormError(null);
		try {
			const { data } = await axios.post<{ id: string }>(
				"/api/onboarding/create-group",
				values,
			);
			handleClose();
			router.push(`/servers/${data.id}`);
			router.refresh();
		} catch (error) {
			console.error(error);
			setFormError("Could not create group. Try again.");
		}
	});

	const onJoin = joinForm.handleSubmit(async (values) => {
		setFormError(null);
		try {
			const { data } = await axios.post<{ inviteCode: string }>(
				"/api/onboarding/join",
				values,
			);
			handleClose();
			router.push(`/invite/${data.inviteCode}`);
			router.refresh();
		} catch (error) {
			console.error(error);
			setFormError("Could not join with that invite. Check the code and try again.");
		}
	});

	const addMaterials = (items: MaterialItem[]) => {
		createForm.setValue("materials", [...materials, ...items], {
			shouldValidate: true,
		});
	};

	const removeMaterial = (url: string) => {
		createForm.setValue(
			"materials",
			materials.filter((item) => item.fileUrl !== url),
			{ shouldValidate: true },
		);
	};

	return (
		<Dialog open={isModelOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent
				className="max-h-[90vh] overflow-y-auto bg-shell-chat p-0 text-foreground sm:max-w-lg"
				onPointerDownOutside={(event) => isUploading && event.preventDefault()}
				onInteractOutside={(event) => isUploading && event.preventDefault()}
			>
				<DialogHeader className="px-6 pt-8">
					<DialogTitle className="text-center text-2xl font-bold">
						Add a study group
					</DialogTitle>
					<DialogDescription className="text-center text-shell-muted">
						Create a new group with materials, or join with an invite.
					</DialogDescription>
				</DialogHeader>

				<Tabs
					value={tab}
					onValueChange={(value) => {
						setTab(value as ModalTab);
						setFormError(null);
					}}
					className="mt-2"
				>
					<div className="px-6">
						<TabsList className="grid h-10 w-full grid-cols-2 rounded-lg border border-shell-border bg-shell-nav p-1">
							<TabsTrigger value="create">Create</TabsTrigger>
							<TabsTrigger value="join">Join</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="create" className="mt-6 outline-none">
						<Form {...createForm}>
							<form onSubmit={onCreate} className="space-y-6">
								{createStep === "details" ? (
									<>
										<CreateServerFormFields
											form={createForm}
											isSubmitting={isCreateSubmitting}
											onUploadingChange={setIsUploading}
										/>
										<DialogFooter className="bg-shell-nav px-6 py-4">
											<Button
												type="button"
												variant="primary"
												disabled={isCreateSubmitting || isUploading}
												className="w-full"
												onClick={() => void goToMaterials()}
											>
												Continue
											</Button>
										</DialogFooter>
									</>
								) : (
									<>
										<CreateServerMaterialsFields
											materials={materials}
											disabled={isCreateSubmitting}
											error={
												createForm.formState.errors.materials?.message ??
												undefined
											}
											onAddMaterials={addMaterials}
											onRemoveMaterial={removeMaterial}
											onUploadError={setFormError}
										/>
										{formError && (
											<p className="px-6 text-sm text-destructive">{formError}</p>
										)}
										<DialogFooter className="flex-col gap-2 bg-shell-nav px-6 py-4 sm:flex-col">
											<Button
												type="submit"
												variant="primary"
												disabled={isCreateSubmitting || isUploading}
												className="w-full"
											>
												{isCreateSubmitting ? (
													<>
														<Loader2 className="mr-2 size-4 animate-spin" />
														Creating...
													</>
												) : (
													"Create group"
												)}
											</Button>
											<Button
												type="button"
												variant="ghost"
												disabled={isCreateSubmitting}
												className="w-full"
												onClick={() => setCreateStep("details")}
											>
												Back
											</Button>
										</DialogFooter>
									</>
								)}
							</form>
						</Form>
					</TabsContent>

					<TabsContent value="join" className="mt-6 outline-none">
						<Form {...joinForm}>
							<form onSubmit={onJoin} className="space-y-6">
								<div className="px-6">
									<FormField
										control={joinForm.control}
										name="inviteCode"
										render={({ field }) => (
											<FormItem>
												<FormLabel className="text-xs font-bold uppercase text-shell-muted">
													Invite code
												</FormLabel>
												<FormControl>
													<Input
														disabled={isJoinSubmitting}
														className="border-shell-border bg-shell-nav text-foreground focus-visible:ring-shell-accent"
														placeholder="Paste invite code or link"
														autoFocus
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								{formError && (
									<p className="px-6 text-sm text-destructive">{formError}</p>
								)}
								<DialogFooter className="bg-shell-nav px-6 py-4">
									<Button
										type="submit"
										variant="primary"
										disabled={isJoinSubmitting}
										className="w-full"
									>
										{isJoinSubmitting ? (
											<>
												<Loader2 className="mr-2 size-4 animate-spin" />
												Joining...
											</>
										) : (
											"Join group"
										)}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
