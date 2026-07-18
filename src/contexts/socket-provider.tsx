"use client";

import { useAuth } from "@clerk/nextjs";
import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import { io as ClientIO, type Socket } from "socket.io-client";

type SocketContextType = {
	socket: Socket | null;
	isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
	socket: null,
	isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
	const { isSignedIn, isLoaded } = useAuth();
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			return;
		}

		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
		if (!siteUrl) {
			console.warn("NEXT_PUBLIC_SITE_URL is not set; skipping socket connection");
			return;
		}

		const client = ClientIO(siteUrl, {
			path: "/api/socket/io",
			addTrailingSlash: false,
		});

		client.on("connect", () => {
			setIsConnected(true);
		});
		client.on("disconnect", () => {
			setIsConnected(false);
		});

		setSocket(client);

		return () => {
			client.disconnect();
			setSocket(null);
			setIsConnected(false);
		};
	}, [isLoaded, isSignedIn]);

	return (
		<SocketContext.Provider value={{ socket, isConnected }}>
			{children}
		</SocketContext.Provider>
	);
};
