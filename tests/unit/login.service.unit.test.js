/**
 * Unit test untuk service autentikasi signInWithEmail().
 *
 * Service menerima objek auth sebagai parameter (dependency injection),
 * sehingga dapat diuji tanpa Firebase dan tanpa DOM. Berkas ini memakai tiga
 * jenis test double: Stub, Mock, dan Fake.
 */
const { loadApp } = require("../helpers/appHarness");

const { app } = loadApp();
const { signInWithEmail, mapAuthError } = app;

const TEST_USER = { uid: "uid-user", email: "user@gmail.com" };

/** Stub: selalu mengembalikan respons sukses yang sama. */
function createAuthStub(user = TEST_USER) {
  return {
    signInWithEmailAndPassword: async () => ({ user }),
  };
}

/** Mock: jest.fn() agar pemanggilan dan argumennya dapat diverifikasi. */
function createAuthMock() {
  return {
    signInWithEmailAndPassword: jest.fn(),
  };
}

/** Fake: implementasi auth in-memory yang benar-benar memeriksa kredensial. */
function createFakeAuth(users) {
  return {
    async signInWithEmailAndPassword(email, password) {
      const account = users[email];
      if (!account || account.password !== password) {
        const error = new Error("The password is invalid.");
        error.code = "auth/wrong-password";
        throw error;
      }
      return { user: { uid: account.uid, email } };
    },
  };
}

describe("signInWithEmail() - unit test service login", () => {
  test("Stub: mengembalikan hasil sukses yang deterministik", async () => {
    // Arrange
    const authStub = createAuthStub();

    // Act
    const result = await signInWithEmail(
      authStub,
      "user@gmail.com",
      "user123"
    );

    // Assert
    expect(result).toEqual({
      ok: true,
      user: TEST_USER,
      code: null,
      message: "",
    });
  });

  test("Mock: memanggil signInWithEmailAndPassword tepat sekali dengan argumen yang benar", async () => {
    // Arrange
    const authMock = createAuthMock();
    authMock.signInWithEmailAndPassword.mockResolvedValue({ user: TEST_USER });

    // Act
    await signInWithEmail(authMock, "user@gmail.com", "user123");

    // Assert
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(authMock.signInWithEmailAndPassword).toHaveBeenCalledWith(
      "user@gmail.com",
      "user123"
    );
  });

  test("Mock: memetakan auth/wrong-password menjadi pesan 'Password salah.'", async () => {
    // Arrange
    const authMock = createAuthMock();
    authMock.signInWithEmailAndPassword.mockRejectedValue({
      code: "auth/wrong-password",
      message: "The password is invalid.",
    });
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Act
    const result = await signInWithEmail(
      authMock,
      "user@gmail.com",
      "wrongpass"
    );

    // Assert
    expect(result.ok).toBe(false);
    expect(result.user).toBeNull();
    expect(result.code).toBe("auth/wrong-password");
    expect(result.message).toBe("Password salah.");
    expect(consoleError).toHaveBeenCalledWith(
      "Firebase Login Error:",
      expect.objectContaining({ code: "auth/wrong-password" })
    );
  });

  test("Mock: memakai pesan exception sebagai fallback untuk kode error tak dikenal", async () => {
    const authMock = createAuthMock();
    authMock.signInWithEmailAndPassword.mockRejectedValue({
      code: "auth/network-request-failed",
      message: "Network error.",
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await signInWithEmail(
      authMock,
      "user@gmail.com",
      "user123"
    );

    expect(result.ok).toBe(false);
    expect(result.code).toBe("auth/network-request-failed");
    expect(result.message).toBe("Network error.");
  });

  test("Mock: respons sukses tanpa objek user dianggap gagal", async () => {
    const authMock = createAuthMock();
    authMock.signInWithEmailAndPassword.mockResolvedValue({});

    const result = await signInWithEmail(
      authMock,
      "user@gmail.com",
      "user123"
    );

    expect(result).toEqual({
      ok: false,
      user: null,
      code: "auth/invalid-user",
      message: "Login gagal. Akun tidak valid.",
    });
  });

  test("Dummy/Tidak tersedia: auth null tidak memanggil Firebase dan mengembalikan pesan konfigurasi", async () => {
    const result = await signInWithEmail(null, "user@gmail.com", "user123");

    expect(result.ok).toBe(false);
    expect(result.code).toBe("auth/not-initialized");
    expect(result.message).toBe(
      "Firebase belum terhubung. Periksa konfigurasi Firebase."
    );
  });

  test("Fake: autentikasi berhasil untuk akun yang terdaftar di penyimpanan in-memory", async () => {
    const fakeAuth = createFakeAuth({
      "user@gmail.com": { uid: "uid-user", password: "user123" },
    });

    const result = await signInWithEmail(
      fakeAuth,
      "user@gmail.com",
      "user123"
    );

    expect(result.ok).toBe(true);
    expect(result.user).toEqual({ uid: "uid-user", email: "user@gmail.com" });
  });

  test("Fake: autentikasi gagal untuk password yang tidak cocok", async () => {
    const fakeAuth = createFakeAuth({
      "user@gmail.com": { uid: "uid-user", password: "user123" },
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await signInWithEmail(
      fakeAuth,
      "user@gmail.com",
      "salah123"
    );

    expect(result.ok).toBe(false);
    expect(result.code).toBe("auth/wrong-password");
    expect(result.message).toBe("Password salah.");
  });
});

describe("mapAuthError() - unit test pemetaan kode error", () => {
  test.each([
    ["auth/user-not-found", "Email belum terdaftar. Silakan daftar akun baru terlebih dahulu."],
    ["auth/invalid-email", "Format email tidak valid."],
    ["auth/invalid-credential", "Email atau password salah."],
    ["auth/too-many-requests", "Terlalu banyak percobaan gagal. Silakan coba beberapa saat lagi."],
  ])("memetakan %s ke pesan yang sesuai", (code, expected) => {
    expect(mapAuthError(code)).toBe(expected);
  });

  test("memakai fallback bawaan untuk kode yang tidak dikenal", () => {
    expect(mapAuthError("auth/unknown")).toBe("Login gagal.");
  });

  test("memakai fallback kustom bila diberikan", () => {
    expect(mapAuthError("auth/unknown", "Registrasi gagal.")).toBe(
      "Registrasi gagal."
    );
  });
});
