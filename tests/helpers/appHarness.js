/**
 * Harness untuk memuat web/app.js ke dalam lingkungan jsdom.
 *
 * web/app.js adalah skrip monolitik tanpa sistem modul, sehingga tidak dapat
 * di-`require`. Berkas dibaca sebagai teks lalu dievaluasi di dalam satu scope
 * fungsi; objek yang dibutuhkan test diekspos pada akhir fungsi tersebut.
 */
const fs = require("fs");
const path = require("path");
const { createInstrumenter } = require("istanbul-lib-instrument");

const APP_PATH = path.join(__dirname, "..", "..", "web", "app.js");
const APP_SOURCE = fs.readFileSync(APP_PATH, "utf8");

/**
 * Karena app.js dievaluasi lewat `new Function`, ia tidak melewati transform
 * Jest sehingga tidak terinstrumentasi otomatis. Sumber diinstrumentasi manual
 * agar laporan `jest --coverage` mencerminkan eksekusi sebenarnya.
 * Jest membaca hasilnya dari global.__coverage__ saat teardown.
 */
const instrumenter = createInstrumenter({
  coverageVariable: "__coverage__",
  produceSourceMap: false,
});
const INSTRUMENTED_SOURCE = instrumenter.instrumentSync(APP_SOURCE, APP_PATH);

const EXPORT_HOOK =
  "\n;globalThis.__pumeow = { state, render, navigate, saveState, showSnackbar, ROUTES };";

/** Membuat Test Double untuk Firebase Auth. */
function createAuthDouble() {
  return {
    signInWithEmailAndPassword: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
}

/**
 * Memuat app.js satu kali ke dalam dokumen jsdom.
 * @param {{ auth: object|null }} options auth = null mensimulasikan Firebase
 *        yang gagal diinisialisasi (fbAuth bernilai null).
 */
function loadApp({ auth = createAuthDouble() } = {}) {
  document.body.innerHTML =
    '<div id="appRoot"></div><div id="snackbar"></div>' +
    '<div id="startupPopup"></div><button id="startupClose"></button>';

  localStorage.clear();
  window.location.hash = "#/login";

  global.firebase = {
    initializeApp: jest.fn(() => ({ name: "pumeow-test" })),
    auth: jest.fn(() => auth),
    firestore: jest.fn(() => ({
      enablePersistence: jest.fn(() => Promise.resolve()),
      collection: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
        doc: jest.fn(() => ({ set: jest.fn(() => Promise.resolve()) })),
      })),
    })),
  };

  // eslint-disable-next-line no-new-func
  new Function(INSTRUMENTED_SOURCE + EXPORT_HOOK)();

  return { app: globalThis.__pumeow, auth };
}

/** Mengembalikan state auth ke kondisi awal sebelum setiap test. */
function resetState(app) {
  app.state.auth = {
    email: "",
    password: "",
    isLoading: false,
    isLoggedIn: false,
    isAdmin: false,
    user: null,
  };
  localStorage.clear();
}

/** Membuka halaman login dan mengembalikan elemen-elemen form. */
function openLoginPage(app) {
  window.location.hash = "#/login";
  app.render();
  return {
    form: document.getElementById("loginForm"),
    email: document.getElementById("loginEmail"),
    password: document.getElementById("loginPassword"),
    emailError: document.getElementById("loginEmailError"),
    passwordError: document.getElementById("loginPasswordError"),
  };
}

/** Mengisi form lalu memicu event submit seperti pengguna sungguhan. */
function submitLogin(fields, { email, password }) {
  fields.email.value = email;
  fields.password.value = password;
  fields.form.dispatchEvent(
    new Event("submit", { bubbles: true, cancelable: true })
  );
}

/** Menunggu handler async selesai (flush microtask + macrotask). */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

module.exports = {
  loadApp,
  createAuthDouble,
  resetState,
  openLoginPage,
  submitLogin,
  flush,
};
