import { NextApiRequest } from "next";
import { MessageAuthorType } from "@prisma/client";

import { messageMentionsAgent } from "@/lib/learning/agent-mention";
import { triggerAgentProcess } from "@/lib/learning/trigger-agent-process";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfilePage } from "@/lib/query";
import { NextApiResponseServerIo } from "@/types/server";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponseServerIo,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ message: "Method not allowed" });
	}
	try {
		const profile = await getCurrentProfilePage(req);
		const { fileUrl, content } = req.body;
		const { channelId, serverId } = req.query;
		if (!profile || typeof profile === "function") {
			return res.status(401).json({ message: "Unauthorized" });
		}
		if (!serverId || !channelId) {
			return res
				.status(400)
				.json({ message: "ServerId and channelId are required" });
		}
		if (!content) {
			return res.status(400).json({ message: "Content  is required" });
		}

		const server = await prisma.server.findFirst({
			where: {
				id: serverId as string,
				members: {
					some: {
						profileId: profile.id,
					},
				},
			},
			include: {
				members: true,
			},
		});
		if (!server) {
			return res.status(404).json({ message: "Server not found" });
		}
		const channel = await prisma.channel.findFirst({
			where: {
				id: channelId as string,
				serverId: serverId as string,
			},
		});
		if (!channel) {
			return res.status(404).json({ message: "Channel not found" });
		}
		const member = server.members.find(
			(m) => m.profileId === profile.id,
		);
		if (!member) {
			return res.status(404).json({ message: "Member not found" });
		}

		const message = await prisma.message.create({
			data: {
				content,
				fileUrl,
				memberId: member.id,
				channelId: channel.id as string,
				authorType: MessageAuthorType.USER,
			},
			include: {
				member: {
					include: {
						profile: true,
					},
				},
			},
		});

		const channelKey = `chat:${channel.id}:messages`;
		res?.socket?.server?.io?.emit(channelKey, message);

		if (messageMentionsAgent(content, server.agentHandle)) {
			void triggerAgentProcess({
				req,
				serverId: server.id,
				memberId: member.id,
				channelId: channel.id,
				messageId: message.id,
				content,
			}).catch((err) => {
				console.error(err, "[agent] /process failed");
			});
		}

		return res.status(201).json(message);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
