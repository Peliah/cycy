import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { getCurrentMember, getCurrentProfile, getOrCreateConversation } from "@/lib/query";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MediaRoom } from "@/components/media-room";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Cycy | Conversation",
	description: "Conversation between members",
	openGraph: {
		type: "website",
	},
};

interface MemberIdPageProps {
	params: Promise<{
		serverId: string;
		memberId: string;
	}>;
	searchParams: Promise<{
		video?: boolean;
	}>;
}

export default async function MemberIdPage({ params, searchParams }: MemberIdPageProps) {
	const { serverId, memberId } = await params;
	const { video } = await searchParams;
	const profile = await getCurrentProfile();
	if (!profile) {
		const { redirectToSignIn } = await auth();
		return redirectToSignIn();
	}

	const currentMember = await getCurrentMember(serverId, profile.id);
	if (!currentMember) {
		return redirect("/");
	}
	const conversation = await getOrCreateConversation(currentMember.id, memberId);
	if (!conversation) {
		return redirect(`/servers/${serverId}`);
	}
	const { memberOne, memberTwo } = conversation;
	const otherMember = memberOne.profileId === profile.id ? memberTwo : memberOne;

	return (
		<div className="bg-white dark:bg-[#313338] flex flex-col h-full">
			<ChatHeader
				name={otherMember.profile.name}
				serverId={serverId}
				type="conversation"
				imageUrl={otherMember.profile.imageUrl ?? undefined}
			/>
			{video && <MediaRoom serverId={serverId} chatId={conversation.id} video={true} audio={true} />}
			{!video && (
				<>
					<ChatMessages
						member={currentMember}
						name={otherMember.profile.name}
						chatId={conversation.id}
						type="conversation"
						apiUrl="/api/direct-messages"
						paramKey="conversationId"
						paramValue={conversation.id}
						socketUrl="/api/socket/direct-messages"
						socketQuery={{
							conversationId: conversation.id,
						}}
					/>
					<ChatInput
						name={otherMember.profile.name}
						type="conversation"
						apiUrl="/api/socket/direct-messages"
						query={{
							conversationId: conversation.id,
						}}
					/>
				</>
			)}
		</div>
	);
}
