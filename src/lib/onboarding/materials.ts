import { getUploadedFileUrl } from "@/lib/uploadthing";

import type { MaterialItem } from "@/lib/onboarding/schema";

export const ACCEPTED_MATERIAL_EXTENSIONS = new Set(["pdf", "docx"]);

export const MATERIAL_ACCEPT_ATTR =
	".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function fileExtension(name: string) {
	return name.split(".").pop()?.toLowerCase() ?? "";
}

export function materialKind(mimeType: string, fileName: string) {
	if (mimeType === "application/pdf" || fileExtension(fileName) === "pdf") {
		return "PDF";
	}
	if (
		mimeType.includes("wordprocessingml") ||
		fileExtension(fileName) === "docx"
	) {
		return "Word";
	}
	return "Notes";
}

export function materialDisplayName(fileName: string) {
	return fileName.startsWith("notes-") ? "Pasted notes" : fileName;
}

type UploadedFileResult = {
	name: string;
	type: string;
	ufsUrl?: string;
	url?: string;
	appUrl?: string;
	key?: string;
};

export function toMaterialItems(files: UploadedFileResult[]): MaterialItem[] {
	const next: MaterialItem[] = [];
	for (const file of files) {
		const url = getUploadedFileUrl([file]);
		if (!url) continue;
		next.push({
			fileName: file.name,
			fileUrl: url,
			mimeType: file.type || "application/octet-stream",
		});
	}
	return next;
}
