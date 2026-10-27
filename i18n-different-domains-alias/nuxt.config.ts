export default defineNuxtConfig({
  compatibilityDate: '2026-10-25',
  modules: ['@nuxtjs/i18n'],
  i18n: {
    // `strategy` stays at its default, `prefix_except_default`
    defaultLocale: 'en',
    differentDomains: true,
    locales: [
      { code: 'en', language: 'en-US', domain: 'example.com', domainDefault: true },
      { code: 'de', language: 'de-DE', domain: 'example.de', domainDefault: true },
    ],
  },
})
