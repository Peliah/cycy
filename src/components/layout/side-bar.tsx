import { SideBarActions } from "@/components/layout/side-bar-actions";
import { SideBarItem } from "@/components/layout/side-bar-item";
import { ModeToggle } from "@/components/mode-toggler";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAllServers, getCurrentProfile } from "@/lib/query";
import { UserButton } from "@clerk/nextjs";
import type { Server } from "@prisma/client";
import { redirect } from "next/navigation";

interface SideBarProps {
	servers?: Server[];
}

export async function SideBar({ servers: serversProp }: SideBarProps = {}) {
	const profile = await getCurrentProfile();
	if (!profile || !("id" in profile)) {
		return redirect("/");
	}

	const servers = serversProp ?? (await getAllServers(profile.id));

	return (
		<div className="flex h-full w-full flex-col items-center space-y-4 bg-shell-rail py-3 text-foreground">
			<SideBarActions />
			<Separator className="mx-auto h-0.5 w-10 rounded-full bg-shell-border" />
			<ScrollArea className="w-full flex-1">
				{servers?.map((server) => (
					<div key={server.id} className="mb-3">
						<SideBarItem
							name={server.name}
							id={server.id}
							imageUrl={server.imageUrl}
						/>
					</div>
				))}
			</ScrollArea>
			<div className="mt-auto flex flex-col items-center gap-y-4 pb-3">
				<ModeToggle />
				<UserButton
					appearance={{
						elements: {
							avatarBox: "h-[48px] w-[48px]",
						},
					}}
				/>
			</div>
		</div>
	);
}
