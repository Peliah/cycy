import { prisma } from "@/lib/prismadb";
import { getFirstServer } from "@/lib/query";
import { redirect } from "next/navigation";

type ProfileLike = {
	id: string;
	onboardingComplete: boolean;
};

/**
 * After sign-in / when an authenticated user hits `/`,
 * send them into onboarding or their first group.
 */
export async function redirectAuthenticatedHome(profile: ProfileLike) {
	const membership = await prisma.member.findFirst({
		where: { profileId: profile.id },
		select: { serverId: true },
	});

	if (membership && profile.onboardingComplete) {
		await getFirstServer(profile.id);
	}

	redirect("/onboarding");
}
