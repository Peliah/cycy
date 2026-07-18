import { SideBar } from "@/components/layout/side-bar";
import { getAllServers, getCurrentProfile } from "@/lib/query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Cycy",
	description:
		"A Full-Featured Real Time (Video , Audio , Chat) Application",
	openGraph: {
		type: "website",
	},
};

export default async function Layout({ children }: { children: React.ReactNode }) {
	const profile = await getCurrentProfile();
	if (!profile || !("id" in profile)) {
		return redirect("/");
	}

	const servers = (await getAllServers(profile.id)) ?? [];

	return (
		<section className="h-full">
			<div className="fixed inset-y-0 z-30 hidden w-[72px] flex-col md:flex">
				<SideBar servers={servers} />
			</div>
			<main className="h-full md:pl-[72px]">{children}</main>
		</section>
	);
}
