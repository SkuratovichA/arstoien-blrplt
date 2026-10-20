/** The month abbreviations that the server puts in the period of every point of userGrowthStats, in the order of the year */
const SERVER_MONTHS: readonly string[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * The short name of a month in the given language, from the English abbreviation the server sends.
 * The names come from Intl, which knows them in every language, so they need no keys in the catalogs; a label the server did not send as a month is returned as it is.
 */
export function monthLabel(period: string, language: string): string {
  const month = SERVER_MONTHS.indexOf(period);
  if (month === -1) {
    return period;
  }
  return new Intl.DateTimeFormat(language, { month: 'short' }).format(new Date(2000, month, 1));
}
