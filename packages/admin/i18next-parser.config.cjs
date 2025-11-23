module.exports = {
  locales: ['en', 'cs', 'sk'],
  defaultLocale: 'en',
  output: 'src/locales/$LOCALE/translation.json',
  input: ['src/**/*.{ts,tsx}'],
  keySeparator: false,
  namespaceSeparator: false,
  createOldCatalogs: false,
  keepRemoved: false,
  sort: true,
  verbose: false,
};
