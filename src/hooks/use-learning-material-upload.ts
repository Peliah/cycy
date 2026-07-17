"use client";

import { useState } from "react";

import { useUploadThing } from "@/lib/uploadthing";
import {
	ACCEPTED_MATERIAL_EXTENSIONS,
	fileExtension,
	toMaterialItems,
} from "@/lib/onboarding/materials";
import type { MaterialItem } from "@/lib/onboarding/schema";

type UseLearningMaterialUploadArgs = {
	disabled?: boolean;
	onAddMaterials: (items: MaterialItem[]) => void;
	onUploadError: (message: string | null) => void;
};

export function useLearningMaterialUpload({
	disabled,
	onAddMaterials,
	onUploadError,
}: UseLearningMaterialUploadArgs) {
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadingNames, setUploadingNames] = useState<string[]>([]);
	const [isAddingNotes, setIsAddingNotes] = useState(false);

	const { startUpload, isUploading } = useUploadThing("learningMaterial", {
		onUploadProgress: (p) => setUploadProgress(p),
		onUploadError: (err) => {
			setUploadingNames([]);
			setUploadProgress(0);
			onUploadError(err.message || "Upload failed. Try again.");
		},
	});

	const busy = Boolean(disabled) || isUploading || isAddingNotes;

	const resetUploadState = () => {
		setUploadingNames([]);
		setUploadProgress(0);
	};

	const uploadFiles = async (files: File[]) => {
		if (!files.length || busy) return;

		const valid = files.filter((file) =>
			ACCEPTED_MATERIAL_EXTENSIONS.has(fileExtension(file.name)),
		);
		if (!valid.length) {
			onUploadError("Only PDF and Word (.docx) files are supported.");
			return;
		}
		if (valid.length < files.length) {
			onUploadError(
				"Some files were skipped. Only PDF and Word (.docx) are allowed.",
			);
		} else {
			onUploadError(null);
		}

		setUploadingNames(valid.map((f) => f.name));
		setUploadProgress(0);

		try {
			const result = await startUpload(valid);
			if (!result?.length) return;
			onAddMaterials(toMaterialItems(result));
		} catch (err) {
			onUploadError(
				err instanceof Error ? err.message : "Upload failed. Try again.",
			);
		} finally {
			resetUploadState();
		}
	};

	const uploadNotes = async (text: string) => {
		const trimmed = text.trim();
		if (!trimmed || busy) return false;

		onUploadError(null);
		setIsAddingNotes(true);
		setUploadingNames(["Your notes"]);
		setUploadProgress(0);

		try {
			const file = new File([trimmed], `notes-${Date.now()}.txt`, {
				type: "text/plain",
			});
			const result = await startUpload([file]);
			if (!result?.length) {
				onUploadError("Could not save your notes. Try again.");
				return false;
			}
			onAddMaterials(toMaterialItems(result));
			return true;
		} catch (err) {
			onUploadError(
				err instanceof Error ? err.message : "Could not save your notes.",
			);
			return false;
		} finally {
			setIsAddingNotes(false);
			resetUploadState();
		}
	};

	return {
		busy,
		isUploading,
		isAddingNotes,
		uploadProgress,
		uploadingNames,
		uploadFiles,
		uploadNotes,
	};
}
