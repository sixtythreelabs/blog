"use client";

import { useEffect } from "react";
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

	useEffect(() => {
		document.documentElement.classList.add("landing-lock");
		return () => document.documentElement.classList.remove("landing-lock");
	}, []);

	return (
		<main>
			<div className="fixed inset-0 overflow-hidden">
				<LandingSection latestPost={latestArticle} />
			</div>
		</main>
	);
}
