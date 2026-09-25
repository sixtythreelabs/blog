const fullDateFormatter = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

const ensureDate = (value: string | number | Date) => {
	const date = value instanceof Date ? value : new Date(value);
	return Number.isNaN(date.getTime()) ? new Date() : date;
};

export const formatFullDate = (dateTime: string | number | Date) => {
	return fullDateFormatter.format(ensureDate(dateTime));
};

export const formatShortDate = (dateTime: string | number | Date) => {
	return shortDateFormatter.format(ensureDate(dateTime));
};
