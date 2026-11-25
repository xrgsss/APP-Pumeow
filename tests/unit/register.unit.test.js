/**
 * Unit test fitur Register (pendaftaran akun baru).
 *
 * Dua unit diuji:
 * 1. validateRegisterInput() - validasi murni form register.
 * 2. registerWithEmail()     - service pembuatan akun dengan dependency
 *                              injection objek auth.
 *
 * Test double: Stub (jalur sukses deterministik), Mock (verifikasi argumen +
 * simulasi error Firebase), dan Dummy (auth null).
 */
const { loadApp } = require("../helpers/appHarness");

const { app } = loadApp();
const {
  validateRegisterInput,
  registerWithEmail,
  mapRegisterError,
} = app;

/** Stub: selalu berhasil tanpa melakukan I/O. */
function createRegisterStub() {
  return {
    createUserWithEmailAndPassword: async () => ({ user: { uid: "uid-baru" } }),
  };
}

/** Mock: jest.fn() untuk verifikasi argumen dan rekayasa kegagalan. */
function createRegisterMock() {
  return {
    createUserWithEmailAndPassword: jest.fn(),
  };
}

describe("validateRegisterInput() - validasi form register", () => {
  test("menerima kombinasi email, password, dan konfirmasi yang valid", () => {
    const result = validateRegisterInput(
      "user@gmail.com",
      "user123",
      "user123"
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({ email: "", password: "", confirm: "" });
    expect(result.credentials).toEqual({
      email: "user@gmail.com",
      password: "user123",
      confirm: "user123",
    });
  });

  test("memangkas spasi pada ketiga field sebelum validasi", () => {
    const result = validateRegisterInput(
      "  user@gmail.com  ",
      "  user123  ",
      "  user123  "
    );

    expect(result.valid).toBe(true);
    expect(result.credentials.email).toBe("user@gmail.com");
    expect(result.credentials.password).toBe("user123");
  });

  test.each([
    ["", "email kosong"],
    ["usergmail.com", "tanpa karakter @"],
    ["user@gmail", "tanpa domain bertitik"],
    ["user@.com", "domain kosong"],
  ])("menolak email tidak valid: %s (%s)", (email) => {
    const result = validateRegisterInput(email, "user123", "user123");

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email tidak valid");
  });

  test("menolak password kosong dengan pesan minimal 6 karakter", () => {
    const result = validateRegisterInput("user@gmail.com", "", "");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password minimal 6 karakter");
  });

  test("menolak password lima karakter", () => {
    const result = validateRegisterInput("user@gmail.com", "user1", "user1");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password minimal 6 karakter");
  });

  test("menolak konfirmasi yang tidak sama dengan password", () => {
    const result = validateRegisterInput(
      "user@gmail.com",
      "user123",
      "user124"
    );

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("");
    expect(result.errors.confirm).toBe("Password tidak sama");
  });

  test("melaporkan tiga kesalahan sekaligus pada input yang seluruhnya salah", () => {
    const result = validateRegisterInput("bukan-email", "123", "456");

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      email: "Email tidak valid",
      password: "Password minimal 6 karakter",
      confirm: "Password tidak sama",
    });
  });

  test("tidak melempar error saat menerima null", () => {
    const result = validateRegisterInput(null, null, null);

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email tidak valid");
    expect(result.errors.password).toBe("Password minimal 6 karakter");
    // password dan confirm sama-sama string kosong -> dianggap cocok
    expect(result.errors.confirm).toBe("");
  });
});

describe("registerWithEmail() - service pendaftaran akun", () => {
  test("Stub: mengembalikan hasil sukses deterministik", async () => {
    const authStub = createRegisterStub();

    const result = await registerWithEmail(
      authStub,
      "user@gmail.com",
      "user123"
    );

    expect(result).toEqual({ ok: true, code: null, message: "" });
  });

  test("Mock: memanggil createUserWithEmailAndPassword tepat sekali dengan argumen benar", async () => {
    const authMock = createRegisterMock();
    authMock.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-baru" },
    });

    await registerWithEmail(authMock, "user@gmail.com", "user123");

    expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledTimes(1);
    expect(authMock.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      "user@gmail.com",
      "user123"
    );
  });

  test("Mock: memetakan auth/email-already-in-use ke pesan yang ramah", async () => {
    const authMock = createRegisterMock();
    authMock.createUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/email-already-in-use",
      message: "Firebase: Error (auth/email-already-in-use).",
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await registerWithEmail(
      authMock,
      "user@gmail.com",
      "user123"
    );

    expect(result.ok).toBe(false);
    expect(result.code).toBe("auth/email-already-in-use");
    expect(result.message).toBe("Email ini sudah terdaftar.");
  });

  test("Mock: memetakan auth/weak-password ke pesan minimal 6 karakter", async () => {
    const authMock = createRegisterMock();
    authMock.createUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/weak-password",
      message: "Password should be at least 6 characters.",
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await registerWithEmail(
      authMock,
      "user@gmail.com",
      "123456"
    );

    expect(result.message).toBe("Password terlalu lemah (minimal 6 karakter).");
  });

  test("Mock: memakai pesan exception sebagai fallback kode tak dikenal", async () => {
    const authMock = createRegisterMock();
    authMock.createUserWithEmailAndPassword.mockRejectedValue({
      code: "auth/network-request-failed",
      message: "Network error.",
    });
    jest.spyOn(console, "error").mockImplementation(() => {});

    const result = await registerWithEmail(
      authMock,
      "user@gmail.com",
      "user123"
    );

    expect(result.code).toBe("auth/network-request-failed");
    expect(result.message).toBe("Network error.");
  });

  test("Dummy: auth null tidak memanggil Firebase dan mengembalikan pesan konfigurasi", async () => {
    const result = await registerWithEmail(null, "user@gmail.com", "user123");

    expect(result.ok).toBe(false);
    expect(result.code).toBe("auth/not-initialized");
    expect(result.message).toBe(
      "Firebase belum terhubung. Periksa konfigurasi Firebase."
    );
  });
});

describe("mapRegisterError() - pemetaan kode error register", () => {
  test.each([
    ["auth/invalid-email", "Format email tidak valid."],
    ["auth/email-already-in-use", "Email ini sudah terdaftar."],
    ["auth/weak-password", "Password terlalu lemah (minimal 6 karakter)."],
  ])("memetakan %s ke pesan yang sesuai", (code, expected) => {
    expect(mapRegisterError(code)).toBe(expected);
  });

  test("memakai fallback 'Registrasi gagal.' untuk kode tak dikenal", () => {
    expect(mapRegisterError("auth/unknown")).toBe("Registrasi gagal.");
  });
});
