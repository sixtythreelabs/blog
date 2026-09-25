import type { ComponentPropsWithoutRef, ComponentType } from "react";

declare module "*.mdx" {
	const MDXComponent: ComponentType<ComponentPropsWithoutRef<"div"> & Record<string, unknown>>;
	export default MDXComponent;
	export const frontmatter: Record<string, unknown> | undefined;
}
