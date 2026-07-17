type UploadProgressBarProps = {
	value: number;
	label?: string;
	className?: string;
};

export function UploadProgressBar({
	value,
	label,
	className,
}: UploadProgressBarProps) {
	return (
		<div className={className ?? "w-full max-w-xs space-y-2"}>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-[#D5E3E1]">
				<div
					className="h-full rounded-full bg-[#0A4D4A] transition-[width] duration-150"
					style={{ width: `${value}%` }}
				/>
			</div>
			{label ? (
				<p className="text-xs text-[#5C6B69]">{label}</p>
			) : (
				<p className="text-xs tabular-nums text-[#5C6B69]">{value}%</p>
			)}
		</div>
	);
}
