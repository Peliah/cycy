"use client";

import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavActions({
	isSignedIn,
	onNavigate,
}: {
	isSignedIn: boolean;
	onNavigate?: () => void;
}) {
	if (isSignedIn) {
		return (
			<Button
				asChild
				className="bg-[#0A4D4A] text-white hover:bg-[#083D3B]"
				onClick={onNavigate}
			>
				<Link href="/onboarding">Open app</Link>
			</Button>
		);
	}

	return (
		<>
			<Button
				variant="ghost"
				asChild
				className="text-[#5C6B69] hover:bg-[#0A4D4A]/8 hover:text-[#14201F]"
				onClick={onNavigate}
			>
				<Link href="/sign-in">Sign in</Link>
			</Button>
			<Button
				asChild
				className="bg-[#0A4D4A] text-white hover:bg-[#083D3B]"
				onClick={onNavigate}
			>
				<Link href="/sign-up">Get started</Link>
			</Button>
		</>
	);
}

export function LandingNav() {
	const { isSignedIn, isLoaded } = useAuth();
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			className={cn(
				"sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200",
				scrolled
					? "border-[#D5E3E0]/90 bg-[#F4F8F7]/95 shadow-[0_1px_0_rgba(20,32,31,0.04)] backdrop-blur-md"
					: "border-[#D5E3E0]/60 bg-[#F4F8F7]/85 backdrop-blur-md",
			)}
		>
			<div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4D4A]/40"
				>
					<Image
						src="/logo.svg"
						alt=""
						width={28}
						height={28}
						className="size-7"
						priority
					/>
					<span className="font-display text-lg tracking-tight text-[#14201F] sm:text-xl">
						Cycy
					</span>
				</Link>

				<nav className="hidden items-center gap-1 sm:flex">
					{isLoaded ? (
						<NavActions isSignedIn={Boolean(isSignedIn)} />
					) : (
						<div className="h-9 w-40" aria-hidden />
					)}
				</nav>

				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild className="sm:hidden">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Open menu"
							className="text-[#14201F] hover:bg-[#0A4D4A]/8"
						>
							<Menu className="size-5" />
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="bg-[#F4F8F7]">
						<SheetHeader>
							<SheetTitle className="font-display text-left text-[#14201F]">
								Cycy
							</SheetTitle>
						</SheetHeader>
						<div className="mt-8 flex flex-col gap-3">
							{isLoaded && (
								<NavActions
									isSignedIn={Boolean(isSignedIn)}
									onNavigate={() => setOpen(false)}
								/>
							)}
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
