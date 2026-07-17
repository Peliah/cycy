import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
	const user = await auth();
	if (!user) throw new UploadThingError("Unauthorized");
	return { userId: user.userId };
};

export const ourFileRouter = {
	serverImage: f(
		{ image: { maxFileSize: "4MB", maxFileCount: 1 } },
		{ awaitServerData: false },
	)
		.middleware(() => handleAuth())
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Upload complete for userId:", metadata.userId);
			console.log("file url", file.ufsUrl ?? file.url);
		}),
	messageFile: f(["image", "pdf"], { awaitServerData: false })
		.middleware(() => handleAuth())
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Upload complete for userId:", metadata.userId);
			console.log("file url", file.ufsUrl ?? file.url);
		}),
	learningMaterial: f(
		{
			pdf: { maxFileSize: "16MB", maxFileCount: 5 },
			text: { maxFileSize: "4MB", maxFileCount: 5 },
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
				maxFileSize: "16MB",
				maxFileCount: 5,
			},
		},
		{ awaitServerData: false },
	)
		.middleware(() => handleAuth())
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("Learning material uploaded for userId:", metadata.userId);
			console.log("file url", file.ufsUrl ?? file.url);
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
