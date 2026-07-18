import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function LandingFinalCta() {
	return (
		<section className="relative overflow-hidden bg-[#0A4D4A] py-20 text-[#E8F2F1] sm:py-24">
			<img
				src="/roadmap-path.svg"
				alt=""
				aria-hidden
				className="pointer-events-none absolute -right-10 bottom-0 h-[85%] w-[70%] opacity-20 brightness-0 invert"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-30"
				style={{
					backgroundImage:
						"radial-gradient(circle at 20% 20%, #7FD4C8 0%, transparent 40%), radial-gradient(circle at 80% 80%, #C9A227 0%, transparent 35%)",
				}}
			/>

			<div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
				<div className="flex items-start gap-4">
					<Image
						src="/logo.svg"
						alt=""
						width={40}
						height={40}
						className="mt-1 size-10 brightness-0 invert"
					/>
					<div>
						<h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl">
							Ready to learn with your people?
						</h2>
						<p className="mt-2 max-w-md text-[#B8D4D1]">
							Bring materials. Invite the group. Start the roadmap.
						</p>
					</div>
				</div>
				<Button
					asChild
					size="lg"
					className="bg-white text-[#0A4D4A] transition hover:scale-[1.02] hover:bg-[#E8F2F1]"
				>
					<Link href="/sign-up">Create your group</Link>
				</Button>
			</div>
		</section>
	);
}
