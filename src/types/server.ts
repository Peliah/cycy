import type { Member, Message, Profile, Server } from "@prisma/client";
import type { MessageAuthorType } from "@/lib/db-enums";
import type { NextApiResponse } from "next";
import type { Server as NetServer, Socket } from "node:net";
import type { Server as SocketIOServer } from "socket.io";

export type ServerWithMembersWithProfiles = Server & {
	members: (Member & { profile: Profile })[];
};

export type NextApiResponseServerIo = NextApiResponse & {
	socket: Socket & {
		server: NetServer & {
			io: SocketIOServer;
		};
	};
};

export type MessagesWithMemberWithProfile = Message & {
	member: (Member & { profile: Profile }) | null;
	authorType: MessageAuthorType;
};
