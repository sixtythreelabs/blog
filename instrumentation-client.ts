import posthog from "posthog-js";

// Skip PostHog on local development so test sessions don't pollute the production project
const isLocalhost = typeof window !== "undefined" && (window.location.host.includes("localhost") || window.location.host.includes("127.0.0.1"));

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && !isLocalhost) {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: "/ingest",
		defaults: "2026-05-30",
		person_profiles: "always",
		capture_pageview: false,
		capture_pageleave: true,
		autocapture: true,
	});
}
