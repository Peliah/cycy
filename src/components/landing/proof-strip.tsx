const CHIPS = ["Study groups", "AI roadmaps", "Certificates"] as const;

export function LandingProofStrip() {
	return (
		<section className="border-b border-[#D5E3E0] bg-[#F4F8F7]">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:px-6 lg:px-8">
				<p className="text-center text-sm text-[#5C6B69]">
					Built for motivated groups who finish together.
				</p>
				<ul className="flex flex-wrap justify-center gap-2">
					{CHIPS.map((chip) => (
						<li
							key={chip}
							className="rounded-full border border-[#D5E3E0] bg-white px-4 py-1.5 text-sm font-medium text-[#0A4D4A]"
						>
							{chip}
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
