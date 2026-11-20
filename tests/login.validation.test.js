/**
 * TC-01 s.d. TC-06 — Unit 1: blok validasi form login
 * (web/app.js baris 2263-2293)
 *
 * Fokus: memastikan lima decision (VD1-VD5) berperilaku sesuai analisis
 * manual, dan bahwa input tidak valid menghentikan handler sebelum Firebase
 * dipanggil.
 */
const {
  loadApp,
  resetState,
  openLoginPage,
  submitLogin,
  flush,
} = require("./helpers/appHarness");

// app.js dimuat satu kali per berkas test: listener hanya boleh terdaftar sekali.
const { app, auth } = loadApp();

beforeEach(() => {
  jest.clearAllMocks();
  resetState(app);
});

describe("Unit 1 - Validasi form login", () => {
  test("TC-01 | kredensial valid lolos validasi dan handler lanjut ke autentikasi", async () => {
    // Arrange
    auth.signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-user", email: "user@gmail.com" },
    });
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "user@gmail.com", password: "user123" });
    await flush();

    // Assert: VD1-VD4 bernilai False, VD5 bernilai False -> Unit 2 dijalankan
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      "user@gmail.com",
      "user123"
    );
  });

  test("TC-02 | email kosong menampilkan 'Email wajib diisi'", () => {
    // Arrange
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "", password: "user123" });

    // Assert: VD1 True -> V12, V13; VD5 True -> return sebelum Firebase
    expect(fields.emailError.textContent).toBe("Email wajib diisi");
    expect(fields.passwordError.textContent).toBe("");
    expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("TC-03 | format email salah menampilkan 'Format email tidak valid'", () => {
    // Arrange
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "user@@gmail", password: "user123" });

    // Assert: VD1 False -> VD2 True -> V15, V16
    expect(fields.emailError.textContent).toBe("Format email tidak valid");
    expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("TC-04 | password kosong menampilkan 'Password wajib diisi'", () => {
    // Arrange
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "user@gmail.com", password: "" });

    // Assert: VD3 True -> V18, V19
    expect(fields.passwordError.textContent).toBe("Password wajib diisi");
    expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("TC-05 | password kurang dari 6 karakter ditolak", () => {
    // Arrange
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "user@gmail.com", password: "user1" });

    // Assert: VD4 True -> V21, V22
    expect(fields.passwordError.textContent).toBe(
      "Password minimal 6 karakter"
    );
    expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("TC-06 | dua kesalahan sekaligus dilaporkan pada kedua field", () => {
    // Arrange
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "", password: "" });

    // Assert: VD1 dan VD3 sama-sama True
    expect(fields.emailError.textContent).toBe("Email wajib diisi");
    expect(fields.passwordError.textContent).toBe("Password wajib diisi");
    expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  test("TC-06b | spasi di awal dan akhir input dipangkas sebelum validasi", async () => {
    // Arrange
    auth.signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-user", email: "user@gmail.com" },
    });
    const fields = openLoginPage(app);

    // Act: V6 dan V7 memakai .trim()
    submitLogin(fields, {
      email: "  user@gmail.com  ",
      password: "  user123  ",
    });
    await flush();

    // Assert
    expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      "user@gmail.com",
      "user123"
    );
  });
});
