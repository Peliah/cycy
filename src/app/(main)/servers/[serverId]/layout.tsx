import { ServerSideBar } from "@/components/layout/server-side-bar";
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
	if (!profile) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}
	const server = await getServer(serverId, profile.id);
	if (!server) {
		return redirect("/");
	}
	return (
		<section className="h-full">
			<div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
				<ServerSideBar serverId={serverId} />
			</div>
			<main className="h-full md:pl-60">{children}</main>
		</section>
	);
}
