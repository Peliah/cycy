import { getCurrentProfile, getGeneralServer } from "@/lib/query";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface ServerIdPageProps {
	params: Promise<{
		serverId: string;
	}>;
}

export default async function ServerIdPage({ params }: ServerIdPageProps) {
	const { serverId } = await params;
	const profile = await getCurrentProfile();
	if (!profile) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}
	const generalServer = await getGeneralServer(serverId, profile.id);

	if (generalServer) {
		redirect(`/servers/${serverId}/channels/${generalServer?.channels?.[0]?.id}`);
	}
	if (!generalServer) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}
	return <div>New server</div>;
}
