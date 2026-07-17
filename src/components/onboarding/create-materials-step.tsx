"use client";

import type { FormEvent } from "react";
import { ArrowRight, FileIcon, Loader2, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { getUploadedFileUrl, UploadDropzone } from "@/lib/uploadthing";

import type { CreateGroupValues, MaterialItem } from "@/lib/onboarding/schema";
import { StepHeading } from "./step-heading";

type CreateMaterialsStepProps = {
	form: UseFormReturn<CreateGroupValues>;
	materials: MaterialItem[];
	isSubmitting: boolean;
	onAddMaterials: (items: MaterialItem[]) => void;
	onRemoveMaterial: (url: string) => void;
	onUploadError: (message: string) => void;
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
	return (
		<section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
			<StepHeading
				title="Add learning materials"
				description="Upload PDF, Word, or text files. We'll use them to build your roadmap next."
			/>

			<Form {...form}>
				<form className="mt-10 space-y-6" onSubmit={onSubmit}>
					<div className="space-y-3">
						<UploadDropzone
							endpoint="learningMaterial"
							onClientUploadComplete={(res) => {
								const next: MaterialItem[] = [];
								for (const file of res ?? []) {
									const url = getUploadedFileUrl([file]);
									if (!url) continue;
									next.push({
										fileName: file.name,
										fileUrl: url,
										mimeType: file.type || "application/octet-stream",
									});
								}
								onAddMaterials(next);
							}}
							onUploadError={(err) => {
								onUploadError(err.message || "Upload failed");
							}}
							className="ut-button:bg-[#0A4D4A] ut-button:ut-readying:bg-[#0A4D4A]/80 ut-label:text-[#0A4D4A] ut-allowed-content:text-[#5C6B69] border-[#C5D4D2] bg-white"
						/>
						{form.formState.errors.materials && (
							<p className="text-sm font-medium text-destructive">
								{form.formState.errors.materials.message}
							</p>
						)}
					</div>

					{materials.length > 0 && (
						<ul className="space-y-2">
							{materials.map((m) => (
								<li key={m.fileUrl}>
									<Card className="border-[#D5E3E1] bg-white shadow-none">
										<CardContent className="flex items-center gap-3 px-4 py-3">
											<FileIcon className="size-4 shrink-0 text-[#0A4D4A]" />
											<span className="min-w-0 flex-1 truncate text-sm text-[#14201F]">
												{m.fileName}
											</span>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="size-8 shrink-0 text-[#5C6B69]"
												onClick={() => onRemoveMaterial(m.fileUrl)}
												disabled={isSubmitting}
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

					<div className="flex justify-end pt-2">
						<Button
							type="submit"
							disabled={isSubmitting}
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
