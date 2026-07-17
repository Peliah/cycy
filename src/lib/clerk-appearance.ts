/** Shared brand accent for Clerk across the app. */
export const clerkAppearance = {
	variables: {
		colorPrimary: "#0A4D4A",
		colorTextOnPrimaryBackground: "#FFFFFF",
	},
};

/**
 * Auth pages are light. Clerk owns the form card — no nested Card wrapper.
 */
export const authClerkAppearance = {
	variables: {
		colorPrimary: "#0A4D4A",
		colorTextOnPrimaryBackground: "#FFFFFF",
		colorBackground: "#FFFFFF",
		colorInputBackground: "#FFFFFF",
		colorInputText: "#14201F",
		colorText: "#14201F",
		colorTextSecondary: "#5C6B69",
		colorNeutral: "#14201F",
		colorDanger: "#DC2626",
		borderRadius: "0.5rem",
	},
	elements: {
		rootBox: "!w-full !max-w-full",
		cardBox: "!w-full !max-w-full !border !border-[#D5E3E1] !shadow-sm",
		card: "!w-full !max-w-full !gap-4 !bg-white !shadow-none",
		headerTitle: "!hidden",
		headerSubtitle: "!hidden",
		socialButtonsBlockButton:
			"!border !border-[#C5D4D2] !bg-white !text-[#14201F] hover:!bg-[#F0F7F6]",
		formFieldLabel: "!text-[#14201F]",
		formFieldInput:
			"!border-[#C5D4D2] !bg-white !text-[#14201F] placeholder:!text-[#8A9B98]",
		formButtonPrimary: "!bg-[#0A4D4A] !text-white hover:!bg-[#083D3B]",
		footerActionLink: "!font-medium !text-[#0A4D4A] hover:!text-[#083D3B]",
		dividerLine: "!bg-[#C5D4D2]",
		dividerText: "!text-[#5C6B69]",
		footer: "!bg-transparent",
	},
};
