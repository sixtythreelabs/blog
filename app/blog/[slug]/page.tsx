import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";

import BlogPostLayout from "./BlogPostLayout";
import { formatFullDate } from "../../utils/date";
import { getPostBySlug, getPostSlugs } from "../../utils/mdx";

type BlogPostPageProps = {
	params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export const viewport: Viewport = {
	themeColor: "#fafafa",
};

export async function generateStaticParams() {
	const slugs = await getPostSlugs();
	return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) return {};
	return {
		title: post.label,
		description: post.intro,
		authors: post.authors?.map((author) => ({ name: author.name, url: author.url })),
		openGraph: {
			title: post.label,
			description: post.intro,
			type: "article",
			publishedTime: post.dateTime,
		},
	};
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
	const { slug } = await params;
	const post = await getPostBySlug(slug);
	if (!post) notFound();
	const { Content, ...metadata } = post;
	const formattedDate = formatFullDate(metadata.dateTime);
	const readTimeLabel = metadata.readingTime;
	return (
		<BlogPostLayout metadata={metadata} readTimeLabel={readTimeLabel} formattedDate={formattedDate}>
			<Content />
		</BlogPostLayout>
	);
}
