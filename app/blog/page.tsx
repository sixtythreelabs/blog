import type { Viewport } from "next";
import BlogSection from "../components/Blog/BlogSection";
import LatestPostBanner from "../components/Blog/LatestPostBanner";
import { getAllPosts, getAllCategories } from "../utils/mdx";

export const viewport: Viewport = {
	themeColor: "#fafafa",
};

export default async function BlogPage() {
	const [articles, categories] = await Promise.all([getAllPosts(), getAllCategories()]);
	const latestArticle = articles[0];

	const header = <LatestPostBanner latestArticle={latestArticle} />;

	return (
		<main className="bg-foreground text-background min-h-screen">
			<BlogSection header={header} limit={articles.length || undefined} showViewAllButton={false} items={articles} categories={categories} />
		</main>
	);
}
