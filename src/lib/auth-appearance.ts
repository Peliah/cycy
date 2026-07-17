/** Clerk appearance shared by sign-in and sign-up — matches the auth brand shell. */
export const authClerkAppearance = {
	variables: {
		colorPrimary: "#0A4D4A",
		colorText: "#14201F",
		colorTextSecondary: "#5C6B69",
		colorBackground: "#F4F8F7",
		colorInputBackground: "#FFFFFF",
		colorInputText: "#14201F",
		borderRadius: "0.5rem",
		fontFamily: "var(--font-figtree), system-ui, sans-serif",
	},
	elements: {
		rootBox: "w-full",
		cardBox: "w-full shadow-none",
		card: "bg-transparent shadow-none border-0 p-0",
		headerTitle: "hidden",
		headerSubtitle: "hidden",
		socialButtonsBlockButton:
			"border border-[#C5D4D2] bg-white text-[#14201F] hover:bg-[#F0F7F6] font-medium",
		formButtonPrimary:
			"bg-[#0A4D4A] hover:bg-[#083D3B] text-white font-semibold shadow-none",
		footerActionLink: "text-[#0A4D4A] hover:text-[#083D3B] font-medium",
		formFieldInput:
			"border-[#C5D4D2] bg-white focus:border-[#0A4D4A] focus:ring-[#0A4D4A]/30",
		identityPreviewEditButton: "text-[#0A4D4A]",
		formFieldLabel: "text-[#14201F] font-medium",
		dividerLine: "bg-[#C5D4D2]",
		dividerText: "text-[#5C6B69]",
	},
};
