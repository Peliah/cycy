import { SignIn } from "@clerk/nextjs";

import { authClerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
	return (
		<div className="w-full max-w-full space-y-6 overflow-hidden">
			<div className="space-y-1">
				<h2 className="font-display text-2xl tracking-tight text-[#14201F]">
					Welcome back
				</h2>
				<p className="text-sm text-[#5C6B69]">
					Sign in to continue to your study groups.
				</p>
			</div>
			<SignIn
				appearance={authClerkAppearance}
				fallbackRedirectUrl="/"
				signUpUrl="/sign-up"
			/>
		</div>
	);
}
