"use client";

import { MagnifyingGlassIcon, BooksIcon } from "@phosphor-icons/react";
import { forwardRef } from "react";
import TransitionLink from "../../TransitionLink";

type SearchBarProps = {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	shortcutLabel: string;
	showSearch: boolean;
};

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(function SearchBar({ searchQuery, onSearchChange, shortcutLabel, showSearch }, ref) {
	if (!showSearch) {
		return (
			<TransitionLink
				href="/blog"
				className="flex items-center gap-2 h-8 px-4 border border-black bg-black/90 text-white transition-colors duration-200 font-semi-mono text-xs tracking-tighter no-underline"
				transitionLabel="Blog"
				aria-label="View all blog posts"
			>
				<BooksIcon size={16} weight="regular" />
				<span>All posts</span>
			</TransitionLink>
		);
	}

	return (
		<div className="flex items-center relative group">
			<MagnifyingGlassIcon className="absolute left-3 w-4 h-4 text-black pointer-events-none transition-colors group-focus-within:text-white" />
			<input
				type="text"
				placeholder="Search..."
				ref={ref}
				value={searchQuery}
				onChange={(e) => onSearchChange(e.target.value)}
				className="w-50 h-8 box-border pl-10 pr-16 py-1.5 bg-white text-black placeholder:text-black/60 border border-black focus:outline-none focus:bg-black focus:text-white focus:placeholder:text-white/70 transition-colors duration-200 font-semi-mono text-sm"
			/>
			<div className="absolute right-3 text-black/60 text-xs font-semi-mono pointer-events-none transition-colors group-focus-within:text-white/80">{shortcutLabel}</div>
		</div>
	);
});

export default SearchBar;
