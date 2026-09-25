/** "5 min read" -> "5 min" */
export const formatReadTimeShort = (readingTime: string) => readingTime.replace(/\s*read$/i, "");
