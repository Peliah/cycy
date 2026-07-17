import { prisma } from "@/lib/prismadb";
import { getCurrentProfile, getServerByInviteCode } from "@/lib/query";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function InviteCodePage({
	params,
}: {
	params: Promise<{ inviteCode: string }>;
}) {
	const { inviteCode } = await params;
	const profile = await getCurrentProfile();
	if (!profile) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}
	if (!inviteCode) {
		return redirect("/");
	}
	const existingServer = await getServerByInviteCode(inviteCode, profile.id);

	if (existingServer) {
		return redirect(`/servers/${existingServer.id}`);
	}

	const server = await prisma.server.update({
		where: {
			inviteCode,
		},
		data: {
			members: {
				create: [
					{
						profileId: profile.id,
					},
				],
			},
		},
	});

	if (server) {
		return redirect(`/servers/${server.id}`);
	}
	return <div>page</div>;
}
