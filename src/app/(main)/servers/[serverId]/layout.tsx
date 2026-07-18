import { ServerSideBar } from "@/components/layout/server-side-bar";
import { CurriculumStatusBanner } from "@/components/learning/curriculum-status-banner";
import type { CurriculumLifecycleStatus } from "@/lib/cycy/types";
import { loadCurriculumContentForServer } from "@/lib/learning/load-curriculum-content";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile, getServer } from "@/lib/query";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ServerIdLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ serverId: string }>;
}) {
	const { serverId } = await params;
	const profile = await getCurrentProfile();
	if (!profile || !("id" in profile)) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}
	let server = await getServer(serverId, profile.id);
	if (!server) {
		return redirect("/");
	}

	const curriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: { status: true },
	});

	// Pull Nest content only when READY (Nest returns 409/500 otherwise).
	// Syncs modules + channels; Nest errors never break the layout.
	if (curriculum?.status === "READY") {
		const contentResult = await loadCurriculumContentForServer(serverId);
		if (contentResult.loaded) {
			// Bypass getServer() React cache so sidebar sees newly upserted channels.
			const refreshed = await prisma.server.findUnique({
				where: {
					id: serverId,
					members: { some: { profileId: profile.id } },
				},
				include: {
					channels: { orderBy: { createdAt: "asc" } },
					members: {
						include: { profile: true },
						orderBy: { role: "asc" },
					},
				},
			});
			if (refreshed) server = refreshed;
		}
	}

	const latestCurriculum = await prisma.curriculum.findUnique({
		where: { serverId },
		select: { status: true },
	});

	return (
		<section className="h-full">
			<div className="fixed inset-y-0 z-20 hidden h-full w-60 flex-col md:flex">
				<ServerSideBar
					serverId={serverId}
					server={server}
					profileId={profile.id}
				/>
			</div>
			<main className="flex h-full flex-col md:pl-60">
				<CurriculumStatusBanner
					serverId={serverId}
					initialStatus={
						(latestCurriculum?.status as CurriculumLifecycleStatus | undefined) ??
						(curriculum?.status as CurriculumLifecycleStatus | undefined) ??
						"PENDING"
					}
				/>
				<div className="min-h-0 flex-1">{children}</div>
			</main>
		</section>
	);
}
