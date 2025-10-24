const dateFormatter = Intl.DateTimeFormat('id-ID', {
	dateStyle: 'medium',
	timeStyle: 'short'
});
export function formatDate(date: Date | string) {
	date = typeof date === 'string' ? new Date(date) : date;
	return dateFormatter.format(date);
}
const dayFormatter = Intl.DateTimeFormat('id-ID', {
	dateStyle: 'medium'
});
export const formatDay = (date: Date | string) => {
	date = typeof date === 'string' ? new Date(date) : date;
	return dayFormatter.format(date);
};
