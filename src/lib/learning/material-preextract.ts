/** Client-safe — no Node-only deps. PDF text is extracted on the backend at bootstrap. */
export function shouldPreExtractOnUpload(
	fileName: string,
	mimeType: string,
): boolean {
	if (fileName.startsWith("notes-") || mimeType.startsWith("text/")) {
		return true;
	}
	if (mimeType.includes("wordprocessingml")) {
		return true;
	}
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	return ext === "docx";
}
