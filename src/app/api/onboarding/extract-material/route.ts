import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiProfile } from "@/lib/api-auth";
import { extractMaterialText } from "@/lib/learning/extract-material-text";
import { shouldPreExtractOnUpload } from "@/lib/learning/material-preextract";

const bodySchema = z.object({
	fileName: z.string().min(1),
	fileUrl: z.string().url(),
	mimeType: z.string().min(1),
});

/** POST /api/onboarding/extract-material — optional pre-extract for notes/docx (PDF at bootstrap). */
export async function POST(req: Request) {
	try {
		const profile = await getApiProfile();
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const parsed = bodySchema.safeParse(await req.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Invalid input" },
				{ status: 400 },
			);
		}

		if (!shouldPreExtractOnUpload(parsed.data.fileName, parsed.data.mimeType)) {
			return NextResponse.json({
				skipped: true,
				message: "PDF text is extracted during curriculum generation on the server.",
			});
		}

		console.info(
			"[extract-material] pre-extract",
			parsed.data.fileName,
			parsed.data.mimeType,
		);

		const text = await extractMaterialText(parsed.data);
		const extractedText = text.trim().slice(0, 50_000);

		if (!extractedText) {
			return NextResponse.json(
				{ error: "Could not extract text from this file" },
				{ status: 422 },
			);
		}

		return NextResponse.json({ extractedText });
	} catch (error) {
		console.error(error, "EXTRACT MATERIAL ERROR");
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Could not extract text from this file",
			},
			{ status: 500 },
		);
	}
}
