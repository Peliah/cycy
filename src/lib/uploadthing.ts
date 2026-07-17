import { generateReactHelpers, generateUploadButton, generateUploadDropzone } from "@uploadthing/react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type UploadedFileResult = {
	ufsUrl?: string;
	url?: string;
	appUrl?: string;
	key?: string;
};

function buildUrlFromFileKey(key: string) {
	const appId = process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID;
	if (appId) {
		return `https://${appId}.ufs.sh/f/${key}`;
	}
	return `https://utfs.io/f/${key}`;
}

export function getUploadedFileUrl(res: UploadedFileResult[] | undefined) {
	const file = res?.[0];
	if (!file) return "";

	return file.ufsUrl ?? file.url ?? file.appUrl ?? (file.key ? buildUrlFromFileKey(file.key) : "");
}
