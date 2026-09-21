// Lightweight stand-in for puppeteer used by reportService.js.
// Returns a minimal PDF blob so smoke-testing the API does not require
// installing Chromium. Replace with the real `puppeteer` dependency when
// generating production PDF reports.
const stubPdf = '%PDF-1.4\n%fake pdf body for smoke test\n%%EOF';

module.exports = {
  launch: async () => ({
    newPage: async () => ({
      setContent: async () => {},
      pdf: async () => Buffer.from(stubPdf, 'utf8'),
      emulateMediaType: async () => {},
    }),
    close: async () => {},
  }),
};
