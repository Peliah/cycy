import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prismadb";

export type ApiProfile = {
	id: string;
	userId: string;
};

/**
 * Lightweight auth for Route Handlers — uses session cookie only (no Clerk API round-trip).
 * Prefer this over calling Clerk's currentUser() in hot paths.
 */
export async function getApiProfile(): Promise<ApiProfile | null> {
	const { userId } = await auth();
	if (!userId) return null;

	const profile = await prisma.profile.findUnique({
		where: { userId },
		select: { id: true, userId: true },
	});
	if (!profile) return null;

	return profile;
}
