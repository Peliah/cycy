"use client";

import { useState } from "react";

import { useUploadThing } from "@/lib/uploadthing";
import {
	ACCEPTED_MATERIAL_EXTENSIONS,
	fileExtension,
	toMaterialItems,
} from "@/lib/onboarding/materials";
import type { MaterialItem } from "@/lib/onboarding/schema";
import { shouldPreExtractOnUpload } from "@/lib/learning/material-preextract";

type UseLearningMaterialUploadArgs = {
	disabled?: boolean;
	onAddMaterials: (items: MaterialItem[]) => void;
	onUploadError: (message: string | null) => void;
};

const EXTRACT_TIMEOUT_MS = 8_000;

async function extractMaterialTextWithTimeout(
	item: MaterialItem,
): Promise<MaterialItem> {
	if (!shouldPreExtractOnUpload(item.fileName, item.mimeType)) {
		return item;
	}

	const controller = new AbortController();
	const timer = window.setTimeout(() => controller.abort(), EXTRACT_TIMEOUT_MS);

	try {
		const res = await fetch("/api/onboarding/extract-material", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				fileName: item.fileName,
				fileUrl: item.fileUrl,
				mimeType: item.mimeType,
			}),
			signal: controller.signal,
		});
		if (!res.ok) return item;
		const body = (await res.json()) as { extractedText?: string };
		if (!body.extractedText?.trim()) return item;
		return { ...item, extractedText: body.extractedText };
	} catch {
		return item;
	} finally {
		window.clearTimeout(timer);
	}
}

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

	const finishUpload = (items: MaterialItem[]) => {
		onAddMaterials(items);
		void Promise.all(items.map(extractMaterialTextWithTimeout)).then(
			(withText) => {
				const changed = withText.some(
					(item, index) => item.extractedText !== items[index]?.extractedText,
				);
				if (changed) onAddMaterials(withText);
			},
		);
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
			finishUpload(toMaterialItems(result));
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
			finishUpload(toMaterialItems(result));
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
