import { UserButton } from "@clerk/nextjs";
import { UserDetails } from "@/components/user/user-details";
import { ModeToggle } from "@/components/mode-toggler";
import { initProfile, getFirstServer } from "@/lib/query";
import { InitialModel } from "@/components/modals/initial-model";
import { prisma } from "@/lib/prismadb";

export default async function Home() {
	const profile = await initProfile();
	if (!profile || !("id" in profile)) return null;

	const membership = await prisma.member.findFirst({
		where: { profileId: profile.id },
		select: { serverId: true },
	});

	if (membership && profile.onboardingComplete) {
		await getFirstServer(profile.id);
	}

	const showOnboarding = !membership || !profile.onboardingComplete;

	return (
		<main className="mx-auto w-full max-w-[75rem]">
			<div className="grid grid-cols-[1fr_20.5rem] gap-10 pb-10">
				<div>
					<header className="flex h-16 w-full items-center justify-between gap-4">
						<div className="flex gap-4">
							<ModeToggle />
						</div>
						<div className="flex items-center gap-2">
							<UserButton
								appearance={{
									elements: {
										userButtonAvatarBox: "size-6",
									},
								}}
							/>
						</div>
					</header>
					{showOnboarding && <InitialModel />}
					<UserDetails />
				</div>
			</div>
		</main>
	);
}
