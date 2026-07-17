type StepHeadingProps = {
	title: string;
	description: string;
};

export function StepHeading({ title, description }: StepHeadingProps) {
	return (
		<>
			<h1 className="font-[family-name:var(--font-fraunces)] text-4xl tracking-tight text-[#14201F] sm:text-5xl">
				{title}
			</h1>
			<p className="mt-3 max-w-lg text-base leading-relaxed text-[#5C6B69] sm:text-lg">
				{description}
			</p>
		</>
	);
}
