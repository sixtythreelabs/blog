"use client";

import TransitionLink from "../TransitionLink";
import Dither from "../Dither";
import { ScrambleText } from "../ScrambleText";
import { formatFullDate } from "../../utils/date";
import { ArticleItem } from "../../types/posts";

type LatestPostPreviewProps = {
	latestPost: ArticleItem;
};

export const LatestPostPreview = ({ latestPost }: LatestPostPreviewProps) => {
	return (
		<TransitionLink
			href={latestPost.href}
			transitionLabel={latestPost.label}
			className="flex relative w-full border border-light-gray/25 bg-background overflow-hidden group text-left mb-4 md:mb-12"
		>
			<div className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-100 mix-blend-screen">
				<Dither waveColor={[0.7, 0.7, 0.7]} colorNum={6} pixelSize={1.2} enableMouseInteraction={false} />
			</div>
			<div className="pointer-events-none absolute inset-0 bg-linear-to-b from-black/85 via-black/70 to-transparent" />

			<div className="relative z-10 flex flex-col gap-3 p-4 md:p-6 w-full">
				<h3 className="text-lg md:text-2xl font-medium text-off-white line-clamp-1" title={latestPost.label}>
					<span aria-label={latestPost.label}>
						<ScrambleText text={latestPost.label} scrambleOnHover />
					</span>
				</h3>

				<p className="text-off-white/50 text-xs md:text-sm leading-relaxed line-clamp-2">{latestPost.intro}</p>

				<div className="flex items-center justify-between text-[10px] md:text-xs pt-1 mt-auto">
					<div className="flex items-center gap-2 font-mono text-off-white/50">
						<span className="group-hover:text-off-white transition-colors mix-blend-difference">READ POST</span>
						<span className="transition-transform group-hover:translate-x-1">→</span>
					</div>
					<span className="uppercase tracking-wide text-light-gray/90">{formatFullDate(latestPost.dateTime)}</span>
				</div>
			</div>
		</TransitionLink>
	);
};
