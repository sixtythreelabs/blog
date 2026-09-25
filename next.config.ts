import process from "node:process";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import type { Options as PrettyCodeOptions } from "rehype-pretty-code";

Object.assign(process.env, { NEXT_TELEMETRY_DISABLED: "1" });

const prettyCodeOptions: PrettyCodeOptions = {
	keepBackground: false,
	theme: {
		dark: "github-dark",
		light: "github-light-default",
	},
};

const withMDX = createMDX({
	extension: /\.(md|mdx)$/,
	options: {
		remarkPlugins: ["remark-frontmatter", "remark-gfm"],
		rehypePlugins: [["rehype-pretty-code", prettyCodeOptions], "rehype-slug"],
	},
});

const nextConfig: NextConfig = {
	pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
	skipTrailingSlashRedirect: true,
	env: {
		NEXT_TELEMETRY_DISABLED: "1",
	},
	images: {
		qualities: [70, 75, 100],
	},
	async rewrites() {
		return [
			{
				source: "/ingest/static/:path*",
				destination: "https://eu-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/ingest/:path*",
				destination: "https://eu.i.posthog.com/:path*",
			},
			{
				source: "/ingest/decide",
				destination: "https://eu.i.posthog.com/decide",
			},
		];
	},
};

export default withMDX(nextConfig);
