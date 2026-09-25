"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import { ScrambleText } from "../ScrambleText";
import { CONTENT } from "../../utils/content";
import { useSound } from "../../context/SoundContext";

type LandingHeroProps = {
	isLoaded: boolean;
};

export function LandingHero({ isLoaded }: LandingHeroProps) {
	const { playSound } = useSound();

	return (
		<div className="w-full max-w-2xl mb-4 md:mb-12">
			<h1 className="flex flex-col gap-3 md:gap-4 text-sm md:text-base font-sans tracking-tighter text-off-white/70">
				<ScrambleText text={CONTENT.hero.tagline} scrambleOnMount={isLoaded} />
				<ScrambleText text={CONTENT.hero.work} scrambleOnMount={isLoaded} />
				<span className="inline">
					<ScrambleText text={CONTENT.hero.cta.prefix} scrambleOnMount={isLoaded} />
					<a
						href={CONTENT.hero.cta.link.href}
						target="_blank"
						rel="noopener noreferrer"
						className="group mx-1 inline-flex items-center gap-0.5 text-off-white transition-colors hover:text-off-white"
						onMouseEnter={() => playSound("hover")}
					>
						<ScrambleText
							text={CONTENT.hero.cta.link.label}
							className="underline decoration-light-gray/40 decoration-dotted underline-offset-2 transition-colors group-hover:decoration-off-white"
							scrambleOnMount={isLoaded}
							scrambleOnHover
						/>
						<ArrowUpRightIcon size={12} className="shrink-0" />
					</a>
					<ScrambleText text={CONTENT.hero.cta.suffix} scrambleOnMount={isLoaded} />
				</span>
			</h1>
		</div>
	);
}
