"use client";

import { type ArticleItem } from "../../types/posts";
import { resolveIcon } from "../../utils/icons";
import { formatFullDate } from "../../utils/date";
import { formatReadTimeShort } from "../../utils/readingTime";
import TransitionLink from "../TransitionLink";
import { ScrambleText } from "../ScrambleText";
import Dither from "../Dither";
import PixelIconDisplay from "./DotMatrixIcon";

type LatestPostBannerProps = {
	latestArticle?: ArticleItem;
};

export default function LatestPostBanner({ latestArticle }: LatestPostBannerProps) {
	const resolvedIcon = latestArticle ? resolveIcon(latestArticle.icon) : null;

	if (!latestArticle || !resolvedIcon) return null;

	return (
		<article aria-label={latestArticle.label} className="relative overflow-hidden w-full border border-light-gray/25 bg-background p-3 sm:p-5 md:p-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute inset-0 opacity-80 mix-blend-screen">
					<Dither waveColor={[0.7, 0.7, 0.7]} colorNum={6} pixelSize={1.2} enableMouseInteraction={false} />
				</div>
				<div className="absolute inset-0 bg-linear-to-b from-black/85 via-black/70 to-transparent" />
			</div>
			<div className="relative z-10 flex flex-col gap-3 sm:gap-4 md:gap-5">
				<div className="flex items-center gap-4 md:gap-6">
					<div className="inline-flex h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 shrink-0 items-center justify-center rounded-sm text-off-white" aria-hidden="true">
						<PixelIconDisplay
							svg={resolvedIcon.type === "phosphor" ? <resolvedIcon.Component size={48} weight="regular" /> : undefined}
							svgUrl={resolvedIcon.type === "custom" ? resolvedIcon.url : undefined}
							iconKey={latestArticle.icon}
							gridSize={32}
							dotScale={0.8}
							sparkleDensity={0.8}
							shape="square"
							color="currentColor"
							sparkleEnabled
							className="w-full h-full"
							alignX="left"
						/>
					</div>
					<h2 className="text-[clamp(1.25rem,0.88rem+1.52vw,2.25rem)] font-semibold text-off-white">{latestArticle.label}</h2>
				</div>
				<p className="text-[clamp(0.8125rem,0.74rem+0.29vw,1rem)] text-off-white/70 leading-relaxed max-w-3xl line-clamp-3">{latestArticle.intro}</p>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2 sm:gap-3 min-w-0">
						<span className="border border-white/40 px-2 py-0.5 sm:px-2.5 text-[clamp(0.55rem,0.49rem+0.23vw,0.7rem)] uppercase tracking-wide text-black bg-white/80 shrink-0">{latestArticle.category}</span>
						<span className="text-[clamp(0.75rem,0.72rem+0.19vw,0.875rem)] text-off-white/70 truncate">
							{latestArticle.authors.map((a) => a.name).join(" and ")} · {formatFullDate(latestArticle.dateTime)} · {formatReadTimeShort(latestArticle.readingTime)}
						</span>
					</div>
					<TransitionLink
						href={latestArticle.href}
						className="inline-flex items-center justify-center gap-2 border border-white bg-white/80 text-black px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-[clamp(0.625rem,0.6rem+0.13vw,0.75rem)] tracking-tight uppercase transition-colors w-[120px] sm:w-[150px]"
						transitionLabel={latestArticle.label}
					>
						<ScrambleText text="Read the latest" scrambleOnHover={true} />
					</TransitionLink>
				</div>
			</div>
		</article>
	);
}
