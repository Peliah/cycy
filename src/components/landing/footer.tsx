import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-[#D5E3E0] bg-[#F4F8F7]">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
				<div className="flex items-center gap-2">
					<Image src="/logo.svg" alt="" width={24} height={24} className="size-6" />
					<span className="font-display text-lg text-[#14201F]">Cycy</span>
				</div>
				<nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#5C6B69]">
					<span className="cursor-default">Privacy</span>
					<span className="cursor-default">Terms</span>
					<Link href="/sign-in" className="transition hover:text-[#14201F]">
						Sign in
					</Link>
				</nav>
				<p className="text-sm text-[#5C6B69]">© {year} Cycy</p>
			</div>
		</footer>
	);
}
