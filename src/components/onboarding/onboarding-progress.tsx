import { ArrowLeft } from "lucide-react";

import { Progress } from "@/components/ui/progress";

type OnboardingProgressProps = {
	stepLabel: string;
	progress: number;
	canGoBack: boolean;
	onBack: () => void;
};

export function OnboardingProgress({
	stepLabel,
	progress,
	canGoBack,
	onBack,
}: OnboardingProgressProps) {
	return (
		<div className="mb-10 space-y-3">
			<div className="flex items-center justify-between gap-4">
				<p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5C6B69]">
					{stepLabel}
				</p>
				{canGoBack ? (
					<button
						type="button"
						onClick={onBack}
						className="inline-flex items-center gap-1.5 text-sm text-[#5C6B69] transition-colors hover:text-[#0A4D4A]"
					>
						<ArrowLeft className="size-3.5" />
						Back
					</button>
				) : (
					<span className="invisible text-sm">Back</span>
				)}
			</div>
			<Progress
				value={progress}
				className="h-1.5 bg-[#D5E3E1] [&>div]:bg-[#0A4D4A]"
			/>
		</div>
	);
}
