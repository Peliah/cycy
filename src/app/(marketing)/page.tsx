import { LandingCapabilityBento } from "@/components/landing/capability-bento";
import { LandingFaq } from "@/components/landing/faq";
import { LandingFinalCta } from "@/components/landing/final-cta";
import { LandingFooter } from "@/components/landing/footer";
import { LandingHero } from "@/components/landing/hero";
import { LandingNav } from "@/components/landing/nav";
import { LandingProductChapters } from "@/components/landing/product-chapters";
import { LandingProofStrip } from "@/components/landing/proof-strip";

export default function MarketingHomePage() {
	return (
		<>
			<LandingNav />
			<main>
				<LandingHero />
				<LandingProofStrip />
				<LandingCapabilityBento />
				<LandingProductChapters />
				<LandingFaq />
				<LandingFinalCta />
			</main>
			<LandingFooter />
		</>
	);
}
