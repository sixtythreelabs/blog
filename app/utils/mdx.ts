import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import type { JSX } from "react";

import type { ArticleFrontmatter, ArticleItem, ArticleAuthor, IconKey, CategoryOption } from "../types/posts";
import { categoryIconMap, DEFAULT_CATEGORY_ICON } from "../types/posts";
import { formatShortDate } from "./date";

const BLOG_ROOT = path.join(process.cwd(), "content", "blog");
const BLOG_EXTENSION = /.mdx$/;
const FALLBACK_AUTHOR: ArticleAuthor = { name: "63bytes Team" };

export type BlogPreview = ArticleItem & {
	slug: string;
	tags: string[];
	heroImage?: string;
	readingTime: string;
};

export type BlogPostMetadata = BlogPreview;

type NormalizedFrontmatter = ArticleFrontmatter & {
	authors: ArticleAuthor[];
	icon: IconKey;
};

type NormalizedPost = BlogPreview & {
	frontmatter: NormalizedFrontmatter;
};

const normalizeAuthors = (authors?: ArticleAuthor[]): ArticleAuthor[] => {
	if (!authors?.length) return [FALLBACK_AUTHOR];
	return authors.map((author) => ({
		name: author.name,
		url: author.url,
	}));
};

const normalizeFrontmatter = (data: Partial<ArticleFrontmatter>, slug: string): NormalizedFrontmatter => {
	const requiredFields: Array<keyof ArticleFrontmatter> = ["title", "description", "date", "category"];
	for (const field of requiredFields) {
		if (!data[field]) {
			throw new Error(`Missing required frontmatter field "${field}" in ${slug}.mdx`);
		}
	}
	return {
		title: data.title!,
		description: data.description!,
		date: data.date!,
		category: data.category!,
		authors: normalizeAuthors(data.authors),
		icon: data.icon ?? "newspaper",
		tags: data.tags ?? [],
		heroImage: data.heroImage,
	};
};

const fileExists = async (targetPath: string) => {
	try {
		await fs.access(targetPath);
		return true;
	} catch {
		return false;
	}
};

const WORDS_PER_MINUTE = 200;

const calculateReadingTime = (content: string) => {
	const words = content.trim().split(/\s+/).filter(Boolean).length;
	const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
	return `${minutes} min read`;
};

const readPostFrontmatter = async (slug: string): Promise<NormalizedPost> => {
	const fullPath = path.join(BLOG_ROOT, `${slug}.mdx`);
	if (!(await fileExists(fullPath))) {
		throw new Error(`Unable to locate blog post for slug "${slug}"`);
	}
	const file = await fs.readFile(fullPath, "utf-8");
	const { data, content } = matter(file);
	const frontmatter = normalizeFrontmatter(data, slug);
	const readingTime = calculateReadingTime(content);
	const date = new Date(frontmatter.date);
	const isoDate = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
	const preview: BlogPreview = {
		slug,
		href: `/blog/${slug}`,
		label: frontmatter.title,
		intro: frontmatter.description,
		dateTime: isoDate,
		dateLabel: formatShortDate(isoDate),
		authors: frontmatter.authors,
		category: frontmatter.category,
		icon: frontmatter.icon ?? "newspaper",
		tags: frontmatter.tags ?? [],
		heroImage: frontmatter.heroImage,
		readingTime,
	};
	return { ...preview, frontmatter };
};

const collectSlugs = async (): Promise<string[]> => {
	let entries: string[] = [];
	try {
		entries = await fs.readdir(BLOG_ROOT);
	} catch {
		return [];
	}
	return entries.filter((file) => BLOG_EXTENSION.test(file)).map((file) => file.replace(BLOG_EXTENSION, ""));
};

export const getAllPosts = cache(async (): Promise<BlogPreview[]> => {
	const slugs = await collectSlugs();
	const posts = await Promise.all(slugs.map((slug) => readPostFrontmatter(slug)));
	return posts
		.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
		.map((post) => {
			const { frontmatter, ...preview } = post;
			void frontmatter;
			return preview;
		});
});

export const getAllCategories = cache(async (): Promise<CategoryOption[]> => {
	const posts = await getAllPosts();
	const uniqueCategories = [...new Set(posts.map((p) => p.category))];

	return [
		{ id: "all", label: "All", icon: "StackIcon" },
		...uniqueCategories.map((cat) => ({
			id: cat.toLowerCase(),
			label: cat,
			icon: categoryIconMap[cat.toLowerCase()] ?? DEFAULT_CATEGORY_ICON,
		})),
	];
});

type MDXContent = (props: Record<string, unknown>) => JSX.Element;

export const getPostBySlug = cache(async (slug: string): Promise<(BlogPreview & { Content: MDXContent }) | null> => {
	const posts = await getAllPosts();
	const post = posts.find((item) => item.slug === slug);
	if (!post) return null;
	const mdxModule = await import(`@/content/blog/${slug}.mdx`);
	return { ...post, Content: mdxModule.default as MDXContent };
});

export const getPostSlugs = async () => {
	const posts = await getAllPosts();
	return posts.map((post) => post.slug);
};
