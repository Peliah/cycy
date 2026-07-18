import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { CapstonePanel } from "@/components/learning/capstone-panel";
import { LearningRoadmapPanel } from "@/components/learning/learning-roadmap";
import { ModuleLockedNotice } from "@/components/learning/module-locked-notice";
import { ModuleStudyPanel } from "@/components/learning/module-study-panel";
import { MediaRoom } from "@/components/media-room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@/lib/prismadb";
import { getChannel, getCurrentProfile, getMember } from "@/lib/query";
import { cn } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { ChannelType, ModuleProgressStatus } from "@prisma/client";
import { redirect } from "next/navigation";

interface ChannelIdPageProps {
	params: Promise<{
		serverId: string;
		channelId: string;
	}>;
}

export default async function ChannelIdPage({ params }: ChannelIdPageProps) {
	const { serverId, channelId } = await params;
	const profile = await getCurrentProfile();
	if (!profile) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}

	const channel = await getChannel(channelId);
	const member = await getMember(serverId, profile.id);

	if (!channel || !member) {
		return redirect("/");
	}
	const isMedia =
		channel.type === ChannelType.VIDEO || channel.type === ChannelType.AUDIO;

	const isModuleChannel = Boolean(channel.externalModuleId);
	const isGeneralHub =
		channel.type === ChannelType.TEXT &&
		!isModuleChannel &&
		channel.name.toLowerCase() === "general";

	let moduleId: string | null = null;
	let moduleLocked = false;
	let moduleTitle = channel.name;
	let previousModuleTitle: string | null = null;
	let previousChannelId: string | null = null;

	const serverMeta = await prisma.server.findUnique({
		where: { id: serverId },
		select: { agentHandle: true },
	});
	const agentHandle = serverMeta?.agentHandle ?? null;

	if (isModuleChannel && channel.externalModuleId) {
		const mod = await prisma.module.findFirst({
			where: {
				externalId: channel.externalModuleId,
				curriculum: { serverId },
			},
			select: {
				id: true,
				title: true,
				order: true,
				curriculumId: true,
				progress: {
					where: { memberId: member.id },
					select: { status: true },
					take: 1,
				},
			},
		});
		moduleId = mod?.id ?? null;
		moduleTitle = mod?.title ?? channel.name;

		const status = mod?.progress[0]?.status;
		moduleLocked =
			!status || status === ModuleProgressStatus.LOCKED;

		if (moduleLocked && mod) {
			const previous = await prisma.module.findFirst({
				where: {
					curriculumId: mod.curriculumId,
					order: { lt: mod.order },
				},
				orderBy: { order: "desc" },
				select: { title: true, externalId: true },
			});
			previousModuleTitle = previous?.title ?? null;
			if (previous?.externalId) {
				const prevChannel = await prisma.channel.findFirst({
					where: {
						serverId,
						externalModuleId: previous.externalId,
					},
					select: { id: true },
				});
				previousChannelId = prevChannel?.id ?? null;
			}
		}
	}

	const chatBlock = (
		<>
			<ChatMessages
				chatId={channel.id}
				member={member}
				name={channel.name}
				type="channel"
				apiUrl="/api/messages"
				socketUrl="/api/socket/messages"
				socketQuery={{
					channelId: channel.id,
					serverId: channel.serverId,
				}}
				paramKey="channelId"
				paramValue={channel.id}
			/>
			<ChatInput
				name={channel.name}
				type="channel"
				apiUrl="/api/socket/messages"
				query={{
					channelId: channel.id,
					serverId: channel.serverId,
				}}
				placeholder={
					agentHandle
						? `Message #${channel.name} · Ask ${agentHandle}`
						: undefined
				}
			/>
		</>
	);

	return (
		<div
			className={cn(
				"flex h-full flex-col bg-shell-chat",
				isMedia && "overflow-hidden",
			)}
		>
			<ChatHeader name={channel?.name} serverId={channel?.serverId} type="channel" />
			{channel.type === ChannelType.TEXT &&
			isModuleChannel &&
			moduleId &&
			moduleLocked ? (
				<ModuleLockedNotice
					serverId={serverId}
					moduleTitle={moduleTitle}
					previousModuleTitle={previousModuleTitle}
					previousChannelId={previousChannelId}
				/>
			) : channel.type === ChannelType.TEXT &&
			  isModuleChannel &&
			  moduleId ? (
				<Tabs defaultValue="study" className="flex min-h-0 flex-1 flex-col">
					<div className="border-b border-shell-border px-4">
						<TabsList className="h-10 bg-transparent">
							<TabsTrigger value="study">Study</TabsTrigger>
							<TabsTrigger value="chat">Chat</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent
						value="study"
						className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
					>
						<ModuleStudyPanel serverId={serverId} moduleId={moduleId} />
					</TabsContent>
					<TabsContent
						value="chat"
						className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
					>
						{chatBlock}
					</TabsContent>
				</Tabs>
			) : isGeneralHub ? (
				<Tabs defaultValue="roadmap" className="flex min-h-0 flex-1 flex-col">
					<div className="border-b border-shell-border px-4">
						<TabsList className="h-10 bg-transparent">
							<TabsTrigger value="roadmap">Roadmap</TabsTrigger>
							<TabsTrigger value="capstone">Capstone</TabsTrigger>
							<TabsTrigger value="chat">Chat</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent
						value="roadmap"
						className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
					>
						<LearningRoadmapPanel serverId={serverId} />
					</TabsContent>
					<TabsContent
						value="capstone"
						className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
					>
						<CapstonePanel serverId={serverId} />
					</TabsContent>
					<TabsContent
						value="chat"
						className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
					>
						{chatBlock}
					</TabsContent>
				</Tabs>
			) : channel.type === ChannelType.TEXT ? (
				chatBlock
			) : null}
			{channel.type === ChannelType.AUDIO && (
				<MediaRoom chatId={channel.id} serverId={serverId} video={false} audio={true} />
			)}
			{channel.type === ChannelType.VIDEO && (
				<MediaRoom chatId={channel.id} serverId={serverId} video={true} audio={true} />
			)}
		</div>
	);
}
