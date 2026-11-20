/**
 * TC-09 — Unit 2: cabang AD1 (fbAuth tidak tersedia).
 *
 * Berkas terpisah karena app.js hanya boleh dimuat sekali per berkas test:
 * listener submit terdaftar pada saat pemuatan, sehingga memuat ulang app.js
 * di berkas yang sama akan mendaftarkan listener kedua.
 */
const {
  loadApp,
  resetState,
  openLoginPage,
  submitLogin,
} = require("./helpers/appHarness");

// auth = null mensimulasikan Firebase yang gagal diinisialisasi (fbAuth null).
const { app } = loadApp({ auth: null });

beforeEach(() => {
  resetState(app);
});

describe("Unit 2 - Firebase tidak tersedia", () => {
  test("TC-09 | login dihentikan saat fbAuth null tanpa menyentuh signIn", () => {
    // Arrange
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "user@gmail.com", password: "user123" });

    // Assert: AD1 True -> A6-A8, handler berhenti sebelum memanggil Firebase
    expect(app.state.auth.isLoading).toBe(false);
    expect(app.state.auth.isLoggedIn).toBe(false);
    expect(window.location.hash).toBe("#/login");
    // Form tetap tampil dan dapat dicoba kembali
    expect(document.getElementById("loginForm")).not.toBeNull();
    // DEFECT-01 berlaku juga di jalur ini: pesan "Firebase belum terhubung..."
    // ditulis ke elemen hasil render A2 lalu langsung terhapus oleh render A8.
    expect(document.getElementById("loginEmailError").textContent).toBe("");
  });

  test("TC-09b | elemen error hilang pada jalur fbAuth null tidak membuat handler gagal", () => {
    // Arrange
    const fields = openLoginPage(app);
    const original = Document.prototype.getElementById;
    let errorLookups = 0;
    jest
      .spyOn(Document.prototype, "getElementById")
      .mockImplementation(function (id) {
        // Panggilan pertama = blok validasi (A4) yang wajib mendapat elemen;
        // panggilan kedua = A6 pada jalur fbAuth null -> simulasikan hilang.
        if (id === "loginEmailError") {
          errorLookups += 1;
          if (errorLookups === 2) return null;
        }
        return original.call(this, id);
      });

    // Act
    submitLogin(fields, { email: "user@gmail.com", password: "user123" });
    jest.restoreAllMocks();

    // Assert: cabang False AD2 dieksekusi, handler tetap selesai dengan normal
    expect(errorLookups).toBe(2);
    expect(app.state.auth.isLoading).toBe(false);
    expect(app.state.auth.isLoggedIn).toBe(false);
    expect(window.location.hash).toBe("#/login");
  });
});
