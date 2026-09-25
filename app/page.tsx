import HomeClient from "./home-client";
import { getAllPosts } from "./utils/mdx";

export default async function HomePage() {
	const articles = await getAllPosts();
	return <HomeClient articles={articles} />;
}
