import { useMemo } from "react";
import { type ArticleItem } from "../types/posts";

type UseArticleFilterOptions = {
	items: ArticleItem[];
	category: string;
	searchQuery: string;
	limit?: number;
};

export function useArticleFilter({ items, category, searchQuery, limit }: UseArticleFilterOptions) {
	const normalizedCategory = category.toLowerCase();
	const normalizedQuery = searchQuery.trim().toLowerCase();

	const filteredItems = useMemo(() => {
		const filteredByCategory = normalizedCategory === "all" ? items : items.filter((item) => item.category.toLowerCase() === normalizedCategory);
		return filteredByCategory.filter((item) => {
			if (!normalizedQuery) return true;
			const haystack = [item.label, item.intro, item.category, item.authors.map((author) => author.name).join(" ")].join(" ").toLowerCase();
			return haystack.includes(normalizedQuery);
		});
	}, [items, normalizedCategory, normalizedQuery]);

	const cappedItems = typeof limit === "number" ? filteredItems.slice(0, limit) : filteredItems;

	return { filteredItems: cappedItems, totalFiltered: filteredItems.length };
}

