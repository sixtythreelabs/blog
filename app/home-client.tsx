"use client";

import LandingSection from "./components/Landing";
import type { ArticleItem } from "./types/posts";
import { useHomeMorph } from "./hooks";

type HomeClientProps = {
	articles: ArticleItem[];
};

export default function HomeClient({ articles }: HomeClientProps) {
	const sortedArticles = [...articles].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
	const latestArticle = sortedArticles[0];

	useHomeMorph();

	return (
		<main>
			<div className="relative min-h-dvh">
				<LandingSection latestPost={latestArticle} />
			</div>
		</main>
	);
}
