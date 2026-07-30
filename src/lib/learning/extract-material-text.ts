import "server-only";

import mammoth from "mammoth";

async function fetchBuffer(
	fileUrl: string,
	timeoutMs = 20_000,
): Promise<Buffer> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetch(fileUrl, { signal: controller.signal });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status} fetching material`);
		}
		return Buffer.from(await response.arrayBuffer());
	} finally {
		clearTimeout(timer);
	}
}

/** Server-only pre-extract for notes/docx. PDFs are handled at bootstrap on the Nest backend. */
export async function extractMaterialText(input: {
	fileName: string;
	fileUrl: string;
	mimeType: string;
	buffer?: Buffer;
}): Promise<string> {
	const buffer = input.buffer ?? (await fetchBuffer(input.fileUrl));

	const ext = input.fileName.split(".").pop()?.toLowerCase() ?? "";
	const isNotes = input.fileName.startsWith("notes-");

	if (isNotes || input.mimeType.startsWith("text/")) {
		return buffer.toString("utf-8");
	}

	if (input.mimeType.includes("wordprocessingml") || ext === "docx") {
		const result = await mammoth.extractRawText({ buffer });
		return result.value ?? "";
	}

	return buffer.toString("utf-8");
}
