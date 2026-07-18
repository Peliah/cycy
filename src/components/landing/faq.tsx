import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
	{
		q: "Who is Cycy for?",
		a: "Groups preparing together—exams, job prep, or self-study with friends. Not another solo flashcard app.",
	},
	{
		q: "Do I need to create a group?",
		a: "Create one if you’re starting fresh, or join with an invite if your circle already exists.",
	},
	{
		q: "What materials can I upload?",
		a: "PDF, Word, or pasted notes. They ground the AI roadmap in what you’re actually studying.",
	},
	{
		q: "Is there an AI tutor?",
		a: "Yes—structured study with checks and practice, not only open-ended chat.",
	},
	{
		q: "Is it free?",
		a: "Get started free while we open access. We’ll be clear before anything paid ships.",
	},
	{
		q: "Can I invite friends?",
		a: "Yes. Share your group invite link and they can join in seconds.",
	},
] as const;

export function LandingFaq() {
	return (
		<section className="border-t border-[#D5E3E0] bg-[#F4F8F7] py-20 sm:py-24">
			<div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:px-8">
				<div>
					<p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5C6B69]">
						FAQ
					</p>
					<h2 className="mt-2 font-display text-3xl tracking-tight text-[#14201F] sm:text-4xl">
						Questions, answered.
					</h2>
				</div>
				<Accordion type="single" collapsible className="w-full">
					{FAQS.map((item) => (
						<AccordionItem key={item.q} value={item.q}>
							<AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
							<AccordionContent>{item.a}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
