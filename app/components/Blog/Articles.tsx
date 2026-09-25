"use client";

import { type ArticleItem } from "../../types/posts";
import { useArticleFilter, useInfiniteLoader } from "../../hooks";
import TransitionLink from "../TransitionLink";
import ArticleCard from "./ArticleCard";
import LoadingIndicator from "./LoadingIndicator";
import { TimeMachine } from "./TimeMachine";

type ArticlesProps = {
	activeCategory: string;
	items?: ArticleItem[];
	limit?: number;
	showViewAllButton?: boolean;
	viewMode?: "grid" | "list" | "timeline";
	searchQuery?: string;
};

export const ARTICLES_PER_LOAD = 9;
const LOAD_DELAY_MS = 1000;

const chunkArticles = (items: ArticleItem[], size = 3) => {
	const chunks: ArticleItem[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
};

export default function Articles({ activeCategory, items = [], limit, showViewAllButton = true, viewMode = "grid", searchQuery = "" }: ArticlesProps) {
	const { filteredItems } = useArticleFilter({
		items,
		category: activeCategory,
		searchQuery,
		limit,
	});

	const { visibleCount, isLoading, sentinelRef } = useInfiniteLoader({
		totalItems: filteredItems.length,
		batchSize: ARTICLES_PER_LOAD,
		loadDelayMs: LOAD_DELAY_MS,
	});

	if (viewMode === "timeline") {
		return (
			<div className="w-full">
				<TimeMachine items={filteredItems} />
			</div>
		);
	}

	const visibleItems = filteredItems.slice(0, visibleCount);
	const isListView = viewMode === "list";
	const rows = isListView ? (visibleItems.length ? [visibleItems] : []) : chunkArticles(visibleItems);

	return (
		<div className="flex justify-center items-center">
			<div className="relative flex w-full max-w-[1080px] min-w-[368px] mt-px ml-px flex-col">
				{rows.map((row, rowIndex) => {
					const listIsFirst = rowIndex === 0;
					const listIsLast = rowIndex === rows.length - 1;
					const wrapperClasses = [listIsFirst ? "ul-cross" : "", "w-full"].filter(Boolean).join(" ");
					const listClasses = [
						isListView
							? "flex flex-col w-full border border-light-gray/15 divide-y divide-light-gray/20"
							: "grid grid-cols-1 lg:grid-cols-3 w-full border border-light-gray/15 divide-y lg:divide-y-0 lg:divide-x divide-light-gray/20",
						!listIsFirst ? "border-t-0" : "",
						listIsLast && !showViewAllButton ? "ul-cross-br" : "",
					]
						.filter(Boolean)
						.join(" ");

					return (
						<div key={`row-${rowIndex}`} className={wrapperClasses}>
							<ul className={listClasses}>
								{row.map((item, itemIndex) => {
									const needsRightOutline = !isListView && row.length < 3 && itemIndex === row.length - 1;
									return <ArticleCard key={item.href} item={item} isListView={isListView} needsRightOutline={needsRightOutline} />;
								})}
							</ul>
						</div>
					);
				})}

				<LoadingIndicator isLoading={isLoading} />

				<div ref={sentinelRef} className="h-1 w-full" aria-hidden />

				{showViewAllButton ? (
					<ul className="ul-cross-br flex w-full justify-center border border-light-gray/15 border-t-0 py-12 bg-foreground">
						<li className="w-full flex justify-center">
							<TransitionLink href="/blog" className="w-4/5 border border-black bg-transparent px-4 py-2 text-center text-sm font-semibold font-mono text-black" transitionLabel="Blog">
								View All Posts
							</TransitionLink>
						</li>
					</ul>
				) : null}
			</div>
		</div>
	);
}
