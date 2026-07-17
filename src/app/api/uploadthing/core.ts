import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

const handleAuth = async () => {
    const user = await auth();
    if (!user) throw new UploadThingError("Unauthorized");
    return { userId: user.userId };
}

// FileRouter for your app, can contain multiple FileRoutes
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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
