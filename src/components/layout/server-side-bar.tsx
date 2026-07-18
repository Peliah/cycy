import { ServerHeader } from "@/components/layout/server-header";
import { ServerChannel } from "@/components/server-channel";
import { ServerMember } from "@/components/server-member";
import { ServerSearch } from "@/components/server-search";
import { ServerSection } from "@/components/server-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getCurrentProfile, getServer } from "@/lib/query";
import { ChannelType, MemberRole } from "@prisma/client";
import { Hash, Mic, ShieldAlert, ShieldCheck, Video } from "lucide-react";
import { redirect } from "next/navigation";

type ServerPayload = NonNullable<Awaited<ReturnType<typeof getServer>>>;

interface ServerSideBarProps {
	serverId: string;
	/** When provided (from layout), skips a second getServer in this tree. */
	server?: ServerPayload;
	profileId?: string;
}

const iconMap = {
	[ChannelType.TEXT]: <Hash className="mr-2 h-4 w-4" />,
	[ChannelType.AUDIO]: <Mic className="mr-2 h-4 w-4" />,
	[ChannelType.VIDEO]: <Video className="mr-2 h-4 w-4" />,
};

const roleIconMap = {
	[MemberRole.GUEST]: null,
	[MemberRole.ADMIN]: <ShieldAlert className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />,
	[MemberRole.MODERATOR]: <ShieldCheck className="mr-2 h-4 w-4 text-shell-accent" />,
};

export async function ServerSideBar({
	serverId,
	server: serverProp,
	profileId: profileIdProp,
}: ServerSideBarProps) {
	let profileId = profileIdProp;
	let server = serverProp;

	if (!server || !profileId) {
		const profile = await getCurrentProfile();
		if (!profile || !("id" in profile)) {
			return redirect("/");
		}
		profileId = profile.id;
		server = server ?? (await getServer(serverId, profileId));
	}

	if (!server || !profileId) {
		return redirect("/");
	}

	const textChannels = server.channels.filter(
		(channel) => channel.type === ChannelType.TEXT,
	);
	const audioChannels = server.channels.filter(
		(channel) => channel.type === ChannelType.AUDIO,
	);
	const videoChannels = server.channels.filter(
		(channel) => channel.type === ChannelType.VIDEO,
	);
	const members = server.members.filter(
		(member) => member.profileId !== profileId,
	);

	const role = server.members.find(
		(member) => member.profileId === profileId,
	)?.role;

	return (
		<div className="flex h-full w-full flex-col bg-shell-nav text-foreground">
			<ServerHeader server={server} role={role} />
			<ScrollArea className="w-full flex-1 px-2 py-3">
				<div className="px-1 pb-2">
					<ServerSearch
						data={[
							{
								label: "Text Channels",
								type: "channel",
								data: textChannels?.map((channel) => ({
									icon: iconMap[channel.type],
									id: channel.id,
									name: channel.name,
								})),
							},
							{
								label: "Voice Channels",
								type: "channel",
								data: audioChannels?.map((channel) => ({
									icon: iconMap[channel.type],
									id: channel.id,
									name: channel.name,
								})),
							},
							{
								label: "Video Channels",
								type: "channel",
								data: videoChannels?.map((channel) => ({
									icon: iconMap[channel.type],
									id: channel.id,
									name: channel.name,
								})),
							},
							{
								label: "Members",
								type: "member",
								data: members?.map((member) => ({
									icon: roleIconMap[member.role],
									id: member.id,
									name: member.profile.name,
								})),
							},
						]}
					/>
				</div>
				<Separator className="my-2 bg-shell-border" />
				{!!textChannels?.length && (
					<div className="mb-3">
						<ServerSection
							sectionType="channels"
							channelType={ChannelType.TEXT}
							role={role}
							label="Text Channels"
						/>
						<div className="mt-1 flex flex-col gap-0.5">
							{textChannels.map((channel) => (
								<ServerChannel
									key={channel.id}
									channel={channel}
									server={server}
									role={role}
								/>
							))}
						</div>
					</div>
				)}
				{!!audioChannels?.length && (
					<div className="mb-3">
						<ServerSection
							sectionType="channels"
							channelType={ChannelType.AUDIO}
							role={role}
							label="Voice Channels"
						/>
						<div className="mt-1 flex flex-col gap-0.5">
							{audioChannels.map((channel) => (
								<ServerChannel
									key={channel.id}
									channel={channel}
									server={server}
									role={role}
								/>
							))}
						</div>
					</div>
				)}
				{!!videoChannels?.length && (
					<div className="mb-3">
						<ServerSection
							sectionType="channels"
							channelType={ChannelType.VIDEO}
							role={role}
							label="Video Channels"
						/>
						<div className="mt-1 flex flex-col gap-0.5">
							{videoChannels.map((channel) => (
								<ServerChannel
									key={channel.id}
									channel={channel}
									server={server}
									role={role}
								/>
							))}
						</div>
					</div>
				)}
				{!!members?.length && (
					<div className="mb-3">
						<ServerSection
							sectionType="members"
							role={role}
							label="Members"
							server={server}
						/>
						<div className="mt-1 flex flex-col gap-0.5">
							{members.map((member) => (
								<ServerMember
									key={member.id}
									member={member}
									server={server}
								/>
							))}
						</div>
					</div>
				)}
			</ScrollArea>
		</div>
	);
}
