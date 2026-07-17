import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { prisma } from "@/lib/prismadb";
import { initProfile } from "@/lib/query";

export default async function OnboardingPage() {
	const profile = await initProfile();
	if (!profile || !("id" in profile)) return null;

	const membership = await prisma.member.findFirst({
		where: { profileId: profile.id },
		select: { serverId: true },
	});

	if (membership && profile.onboardingComplete) {
		redirect(`/servers/${membership.serverId}`);
	}

	return <OnboardingWizard />;
}
