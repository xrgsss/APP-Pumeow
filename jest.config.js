/**
 * Konfigurasi Jest untuk pengujian fitur Login website APP-Pumeow.
 *
 * Catatan: web/app.js adalah skrip monolitik yang bergantung pada DOM dan
 * objek global `firebase`, sehingga pengujian dijalankan pada level
 * integration testing dengan DOM simulasi (jsdom), bukan unit testing murni.
 */
module.exports = {
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    url: "http://localhost/#/login",
  },
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: ["web/app.js"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "html", "lcov", "json"],
  clearMocks: true,
  restoreMocks: true,
  // jsdom + app.js 98 KB cukup berat; batasi worker agar tidak kehabisan RAM
  // pada mesin dengan banyak core tetapi memori terbatas.
  maxWorkers: 2,
};
