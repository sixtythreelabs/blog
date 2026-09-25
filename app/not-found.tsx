"use client";

import { usePathname } from "next/navigation";
import TransitionLink from "./components/TransitionLink";
import Dither from "./components/Dither";

export default function NotFound() {
	const pathname = usePathname();
	const missingPath = pathname || "/";

	return (
		<main className="relative flex min-h-screen flex-col justify-center bg-background px-6 py-20 text-foreground">
			<div className="relative mx-auto flex w-full max-w-4xl flex-col gap-10 overflow-hidden border border-light-gray/30 bg-black/70 p-8">
				<div className="pointer-events-none absolute inset-0 overflow-hidden">
					<div className="absolute inset-0 opacity-80 mix-blend-screen">
						<Dither waveColor={[0.65, 0.65, 0.65]} colorNum={6} pixelSize={1.2} enableMouseInteraction={false} />
					</div>
					<div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/20 to-black/90" />
				</div>

				<div className="relative z-10 order-1 flex flex-col gap-6 text-center md:order-1 md:text-left">
					<p className="font-mono text-xs uppercase tracking-[0.4em] text-light-gray/80">404 · Page Not Found</p>
				</div>

				<div className="relative z-10 order-2 grid grid-cols-1 gap-5 text-left text-sm text-off-white/80 md:order-3 md:grid-cols-3">
					<div className="border border-light-gray/40 bg-black/50 p-5">
						<p className="text-[0.65rem] uppercase tracking-[0.35em] text-light-gray/70">Requested Route</p>
						<p className="mt-3 font-mono text-base text-off-white break-all">{missingPath}</p>
					</div>
					<div className="border border-light-gray/40 bg-black/50 p-5">
						<p className="text-[0.65rem] uppercase tracking-[0.35em] text-light-gray/70">Status</p>
						<p className="mt-3 font-semibold text-2xl text-off-white">404</p>
						<p className="text-xs text-light-gray/80">The page was moved, deleted, or maybe never existed.</p>
					</div>
					<div className="border border-light-gray/40 bg-black/50 p-5">
						<p className="text-[0.65rem] uppercase tracking-[0.35em] text-light-gray/70">Next Step</p>
						<p className="mt-3 text-sm leading-relaxed text-off-white/80">Drop back to the homepage or head to the blog for the latest notes while we re-align the antennas.</p>
					</div>
				</div>

				<div className="relative z-10 order-3 mt-auto flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-start sm:text-left md:order-2 md:mt-0">
					<TransitionLink
						href="/"
						transitionLabel="Home"
						className="inline-flex w-full items-center justify-center border border-white bg-white/90 px-6 py-3 text-xs font-mono uppercase tracking-[0.4em] text-black transition-colors sm:w-auto"
					>
						Return Home
					</TransitionLink>
					<TransitionLink
						href="/blog"
						transitionLabel="Blog"
						className="inline-flex w-full items-center justify-center border border-white/60 px-6 py-3 text-xs font-mono uppercase tracking-[0.4em] text-off-white transition-colors sm:w-auto"
					>
						Read the Blog
					</TransitionLink>
				</div>
			</div>
		</main>
	);
}
