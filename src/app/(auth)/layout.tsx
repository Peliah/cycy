import type { Metadata } from "next";



export const metadata: Metadata = {
	title: "Cycy - Login",
	description: "Log in to Cycy and discuss with your friends.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
	return <div className="flex h-screen justify-center items-center">{children}</div>;
}
