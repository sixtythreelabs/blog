export const CONTENT = {
	hero: {
		tagline:
			"Blockchains are some of the most resilient distributed systems ever built. Our team has spent years working on low-level blockchain infrastructure, and we’re bringing that experience to self-hosted systems.",
		work: "We’re building a platform that helps users and organizations connect their infrastructure so it can work together as one system, while still giving each machine and environment clear boundaries and control.",
		cta: {
			prefix: "Follow",
			link: { label: "Chaar.ai", href: "https://chaar.ai" },
			suffix: "to learn more about what we’re building.",
		},
	},
	links: {
		about: { label: "ABOUT", href: "/about" },
		twitter: { label: "X(TWITTER)", href: process.env.NEXT_PUBLIC_X_URL || "#" },
		blog: { label: "BLOG", href: "/blog" },
		linkedin: { label: "LINKEDIN", href: process.env.NEXT_PUBLIC_LINKEDIN_URL || "#" },
		contact: { label: "CONTACT", href: process.env.NEXT_PUBLIC_CONTACT_EMAIL ? `mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}` : "#" },
		products: { label: "PRODUCTS", href: "/products" },
	},
};
