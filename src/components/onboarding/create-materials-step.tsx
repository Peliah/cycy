"use client";

import type { FormEvent } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLearningMaterialUpload } from "@/hooks/use-learning-material-upload";
import type { CreateGroupValues, MaterialItem } from "@/lib/onboarding/schema";

import { MaterialsList } from "./materials-list";
import { MaterialsPasteNotes } from "./materials-paste-notes";
import { MaterialsUploadZone } from "./materials-upload-zone";
import { StepHeading } from "./step-heading";

type CreateMaterialsStepProps = {
	form: UseFormReturn<CreateGroupValues>;
	materials: MaterialItem[];
	isSubmitting: boolean;
	onAddMaterials: (items: MaterialItem[]) => void;
	onRemoveMaterial: (url: string) => void;
	onUploadError: (message: string | null) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateMaterialsStep({
	form,
	materials,
	isSubmitting,
	onAddMaterials,
	onRemoveMaterial,
	onUploadError,
	onSubmit,
}: CreateMaterialsStepProps) {
	const {
		busy,
		isUploading,
		isAddingNotes,
		uploadProgress,
		uploadingNames,
		uploadFiles,
		uploadNotes,
	} = useLearningMaterialUpload({
		disabled: isSubmitting,
		onAddMaterials,
		onUploadError,
	});

	return (
		<section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
			<StepHeading
				title="Share your materials"
				description="Upload a PDF or Word doc, or paste notes. We'll turn them into your learning roadmap."
			/>

			<Form {...form}>
				<form className="mt-10 space-y-8" onSubmit={onSubmit}>
					<Tabs defaultValue="upload" className="w-full">
						<TabsList className="grid h-11 w-full grid-cols-2 rounded-lg border border-[#C5D4D2] bg-[#F4F8F7] p-1">
							<TabsTrigger
								value="upload"
								disabled={busy}
								className="rounded-md text-[#5C6B69] data-[state=active]:bg-white data-[state=active]:text-[#0A4D4A] data-[state=active]:shadow-none"
							>
								Upload a file
							</TabsTrigger>
							<TabsTrigger
								value="paste"
								disabled={busy}
								className="rounded-md text-[#5C6B69] data-[state=active]:bg-white data-[state=active]:text-[#0A4D4A] data-[state=active]:shadow-none"
							>
								Paste notes
							</TabsTrigger>
						</TabsList>

						<TabsContent value="upload" className="mt-5 outline-none">
							<MaterialsUploadZone
								busy={busy}
								isUploading={isUploading && !isAddingNotes}
								uploadProgress={uploadProgress}
								uploadingNames={uploadingNames}
								onUploadFiles={uploadFiles}
							/>
						</TabsContent>

						<TabsContent value="paste" className="mt-5 outline-none">
							<MaterialsPasteNotes
								busy={busy}
								isAddingNotes={isAddingNotes}
								uploadProgress={uploadProgress}
								onUploadNotes={uploadNotes}
							/>
						</TabsContent>
					</Tabs>

					{form.formState.errors.materials && (
						<p className="text-sm font-medium text-destructive">
							{form.formState.errors.materials.message}
						</p>
					)}

					<MaterialsList
						materials={materials}
						disabled={busy}
						onRemove={onRemoveMaterial}
					/>

					<div className="flex justify-end pt-2">
						<Button
							type="submit"
							disabled={busy}
							className="h-11 bg-[#0A4D4A] px-6 text-white hover:bg-[#083D3B]"
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Creating group…
								</>
							) : (
								<>
									Create group
									<ArrowRight className="ml-2 size-4" />
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>
		</section>
	);
}
