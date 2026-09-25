"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { type ArticleItem } from "../../types/posts";
import { resolveIcon } from "../../utils/icons";
import { formatReadTimeShort } from "../../utils/readingTime";
import TransitionLink from "../TransitionLink";
import AuthorsList from "./AuthorsList";
import PixelIconDisplay from "../Blog/DotMatrixIcon";

type ArticleCardProps = {
	item: ArticleItem;
	isListView: boolean;
	needsRightOutline?: boolean;
};

const DRAG_THRESHOLD = 10;

export default function ArticleCard({ item, isListView, needsRightOutline = false }: ArticleCardProps) {
	const startPos = useRef<{ x: number; y: number } | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const resolvedIcon = resolveIcon(item.icon);

	const handlePointerDown = (e: PointerEvent<HTMLAnchorElement>) => {
		startPos.current = { x: e.clientX, y: e.clientY };
	};

	const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
		if (startPos.current) {
			const dx = e.clientX - startPos.current.x;
			const dy = e.clientY - startPos.current.y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance > DRAG_THRESHOLD) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
		startPos.current = null;
	};

	const listItemClasses = ["h-auto", isListView ? "relative" : "", needsRightOutline ? "lg:border-r lg:border-light-gray/20" : ""].filter(Boolean).join(" ");

	const contentWrapperClasses = [
		"flex h-full flex-col bg-foreground no-underline text-black transition-colors duration-200 touch-pan-y",
		isListView ? "gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5" : "gap-3 md:gap-4 px-4 py-4 md:px-8 md:py-6 lg:px-10 lg:py-8",
	].join(" ");

	const excerptClasses = isListView ? "hidden" : "relative overflow-hidden lg:flex-grow";
	const metadataClasses = "mt-2 flex items-center gap-2";

	const renderAuthors = (textClassName: string) => <AuthorsList authors={item.authors} className={textClassName} disableLinks />;

	return (
		<li className={listItemClasses}>
			<article aria-label={item.label} className="h-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
				<TransitionLink href={item.href} className={contentWrapperClasses} transitionLabel={item.label} onPointerDown={handlePointerDown} onClick={handleClick}>
					{isListView ? (
						<>
							{/* Category badge pinned near the top-right corner of the list cell */}
							<span className="absolute top-2 right-2 z-10 border border-light-gray/20 px-1 py-px sm:px-2 sm:py-0.5 text-[clamp(0.5rem,0.43rem+0.3vw,0.7rem)] uppercase tracking-wide text-white/80 bg-black/90">{item.category}</span>
							<h2 className="pr-16 text-black text-[clamp(0.9375rem,0.73rem+0.86vw,1.5rem)] leading-tight font-semibold tracking-tight">{item.label}</h2>
							<div className="flex flex-wrap items-center gap-3 justify-start text-sm text-light-gray text-right">
								<time dateTime={item.dateTime} className="text-light-gray text-left text-[clamp(0.65rem,0.6rem+0.18vw,0.75rem)]">
									{item.dateLabel}
								</time>
								<span className="text-light-gray/60" aria-hidden="true">
									•
								</span>
								{renderAuthors("text-light-gray text-[clamp(0.75rem,0.72rem+0.19vw,0.875rem)]")}
								<span className="text-light-gray/60" aria-hidden="true">
									•
								</span>
								<span className="text-light-gray text-[clamp(0.65rem,0.6rem+0.18vw,0.75rem)]">{formatReadTimeShort(item.readingTime)}</span>
							</div>
						</>
					) : (
						<>
							<div className="flex items-center justify-between">
								<div className="inline-flex h-20 w-20 items-center justify-center rounded-sm text-black" aria-hidden="true">
									<PixelIconDisplay
										svg={resolvedIcon.type === "phosphor" ? <resolvedIcon.Component size={48} weight="regular" /> : undefined}
										svgUrl={resolvedIcon.type === "custom" ? resolvedIcon.url : undefined}
										iconKey={item.icon}
										gridSize={32}
										dotScale={0.8}
										sparkleDensity={0.8}
										shape="square"
										color="black"
										sparkleEnabled={isHovered}
										className="w-full h-full"
										alignX="left"
									/>
								</div>
							</div>
							<h2 className="text-black text-2xl leading-tight font-bold tracking-tight">{item.label}</h2>
							<div className={excerptClasses}>
								<p className="text-light-gray text-[clamp(0.8125rem,0.78rem+0.19vw,0.875rem)] leading-5">{item.intro}</p>
								<div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-b from-transparent to-foreground" />
							</div>
							<div className={metadataClasses}>
								<span className="border border-light-gray/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-white/80 bg-black/90 shrink-0">{item.category}</span>
								<div className="ml-auto flex items-center gap-2 justify-end">
									{renderAuthors("text-light-gray text-xs sm:text-sm")}
									<span className="text-light-gray/60" aria-hidden="true">
										•
									</span>
									<span className="text-light-gray text-[0.7rem] md:text-[0.8rem] leading-4">{formatReadTimeShort(item.readingTime)}</span>
									<span className="text-light-gray/60" aria-hidden="true">
										•
									</span>
									<time dateTime={item.dateTime} className="text-light-gray text-[0.7rem] md:text-[0.8rem] leading-4 text-right">
										{item.dateLabel}
									</time>
								</div>
							</div>
						</>
					)}
				</TransitionLink>
			</article>
		</li>
	);
}
