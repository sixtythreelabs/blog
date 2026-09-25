import { Fragment } from "react";
import type { ArticleItem } from "../../types/posts";

type AuthorsListProps = {
	authors: ArticleItem["authors"];
	className?: string;
	disableLinks?: boolean;
	prefix?: string;
	linkClassName?: string;
	onLinkHover?: () => void;
	onLinkClick?: () => void;
};

const defaultLinkClass = "underline decoration-dotted underline-offset-4 transition-opacity";

export default function AuthorsList({ authors, className, disableLinks = false, prefix = "", linkClassName, onLinkHover, onLinkClick }: AuthorsListProps) {
	if (!authors?.length) return null;
	const resolvedLinkClass = linkClassName ?? defaultLinkClass;

	return (
		<span className={className}>
			{prefix}
			{authors.map((author, index) => {
				const separator = index === 0 ? "" : " · ";
				const content =
					author.url && !disableLinks ? (
						<a href={author.url} target="_blank" rel="noopener noreferrer" className={resolvedLinkClass} onMouseEnter={onLinkHover} onClick={onLinkClick}>
							{author.name}
						</a>
					) : (
						author.name
					);
				return (
					<Fragment key={`${author.name}-${index}`}>
						{separator}
						{content}
					</Fragment>
				);
			})}
		</span>
	);
}
