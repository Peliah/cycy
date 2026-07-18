"use client";

import { MaterialsList } from "@/components/onboarding/materials-list";
import { MaterialsPasteNotes } from "@/components/onboarding/materials-paste-notes";
import { MaterialsUploadZone } from "@/components/onboarding/materials-upload-zone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLearningMaterialUpload } from "@/hooks/use-learning-material-upload";
import type { MaterialItem } from "@/components/modals/create-server-schema";

type CreateServerMaterialsFieldsProps = {
	materials: MaterialItem[];
	disabled?: boolean;
	error?: string;
	onAddMaterials: (items: MaterialItem[]) => void;
	onRemoveMaterial: (url: string) => void;
	onUploadError: (message: string | null) => void;
};

export function CreateServerMaterialsFields({
	materials,
	disabled,
	error,
	onAddMaterials,
	onRemoveMaterial,
	onUploadError,
}: CreateServerMaterialsFieldsProps) {
	const {
		busy,
		isUploading,
		isAddingNotes,
		uploadProgress,
		uploadingNames,
		uploadFiles,
		uploadNotes,
	} = useLearningMaterialUpload({
		disabled,
		onAddMaterials,
		onUploadError,
	});

	return (
		<div className="space-y-4 px-6">
			<p className="text-sm text-shell-muted">
				Upload a PDF or Word doc, or paste notes. These shape your AI roadmap.
			</p>

			<Tabs defaultValue="upload" className="w-full">
				<TabsList className="grid h-10 w-full grid-cols-2 rounded-lg border border-shell-border bg-shell-nav p-1">
					<TabsTrigger
						value="upload"
						disabled={busy}
						className="rounded-md text-shell-muted data-[state=active]:bg-shell-chat data-[state=active]:text-foreground"
					>
						Upload a file
					</TabsTrigger>
					<TabsTrigger
						value="paste"
						disabled={busy}
						className="rounded-md text-shell-muted data-[state=active]:bg-shell-chat data-[state=active]:text-foreground"
					>
						Paste notes
					</TabsTrigger>
				</TabsList>

				<TabsContent value="upload" className="mt-4 outline-none">
					<MaterialsUploadZone
						busy={busy}
						isUploading={isUploading && !isAddingNotes}
						uploadProgress={uploadProgress}
						uploadingNames={uploadingNames}
						onUploadFiles={uploadFiles}
					/>
				</TabsContent>

				<TabsContent value="paste" className="mt-4 outline-none">
					<MaterialsPasteNotes
						busy={busy}
						isAddingNotes={isAddingNotes}
						uploadProgress={uploadProgress}
						onUploadNotes={uploadNotes}
					/>
				</TabsContent>
			</Tabs>

			{error && (
				<p className="text-sm font-medium text-destructive">{error}</p>
			)}

			<MaterialsList
				materials={materials}
				disabled={busy}
				onRemove={onRemoveMaterial}
			/>
		</div>
	);
}
