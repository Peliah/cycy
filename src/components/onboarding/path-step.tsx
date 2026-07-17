"use client";

import { UserPlus, Users } from "lucide-react";

import { StepHeading } from "./step-heading";

type PathStepProps = {
	onSelectCreate: () => void;
	onSelectJoin: () => void;
};

export function PathStep({ onSelectCreate, onSelectJoin }: PathStepProps) {
	return (
		<section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
			<StepHeading
				title="How do you want to start?"
				description="Create a new study group with your materials, or join friends with an invite."
			/>

			<div className="mt-10 grid gap-4 sm:grid-cols-2">
				<button
					type="button"
					onClick={onSelectCreate}
					className="group rounded-2xl border border-[#D5E3E1] bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0A4D4A]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4D4A]/40"
				>
					<span className="flex size-11 items-center justify-center rounded-xl bg-[#0A4D4A]/10 text-[#0A4D4A] transition-colors group-hover:bg-[#0A4D4A] group-hover:text-white">
						<Users className="size-5" />
					</span>
					<span className="mt-5 block font-display text-2xl text-[#14201F]">
						Create a group
					</span>
					<span className="mt-2 block text-sm leading-relaxed text-[#5C6B69]">
						Name your circle, set the learning goal, and upload materials.
					</span>
				</button>

				<button
					type="button"
					onClick={onSelectJoin}
					className="group rounded-2xl border border-[#D5E3E1] bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#0A4D4A]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4D4A]/40"
				>
					<span className="flex size-11 items-center justify-center rounded-xl bg-[#0A4D4A]/10 text-[#0A4D4A] transition-colors group-hover:bg-[#0A4D4A] group-hover:text-white">
						<UserPlus className="size-5" />
					</span>
					<span className="mt-5 block font-display text-2xl text-[#14201F]">
						Join a group
					</span>
					<span className="mt-2 block text-sm leading-relaxed text-[#5C6B69]">
						Paste an invite code or link and jump straight into the group.
					</span>
				</button>
			</div>
		</section>
	);
}
