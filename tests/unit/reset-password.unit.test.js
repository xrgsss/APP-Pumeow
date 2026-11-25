/**
 * Unit test fitur Ubah Password (halaman reset password).
 *
 * Dua unit diuji:
 * 1. validateResetPasswordInput()  - validasi password baru + konfirmasi.
 * 2. firebaseUpdateUserPassword()  - service perubahan password user aktif.
 *
 * Test double: Stub (perubahan selalu berhasil), Mock (verifikasi argumen +
 * simulasi kegagalan), dan Dummy (auth null / tanpa user login).
 */
const { loadApp } = require("../helpers/appHarness");

const { app, auth } = loadApp();
const { validateResetPasswordInput, firebaseUpdateUserPassword } = app;

describe("validateResetPasswordInput() - validasi form ubah password", () => {
  test("menerima password dan konfirmasi yang cocok", () => {
    const result = validateResetPasswordInput("newpass123", "newpass123");

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({ password: "", confirm: "" });
    expect(result.credentials).toEqual({
      password: "newpass123",
      confirm: "newpass123",
    });
  });

  test("memangkas spasi sebelum membandingkan", () => {
    const result = validateResetPasswordInput(
      "  newpass123  ",
      "  newpass123  "
    );

    expect(result.valid).toBe(true);
    expect(result.credentials.password).toBe("newpass123");
  });

  test("menolak password baru yang kosong", () => {
    const result = validateResetPasswordInput("", "");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password baru wajib diisi");
    expect(result.errors.confirm).toBe("Konfirmasi password wajib diisi");
  });

  test("menolak password baru kurang dari enam karakter", () => {
    const result = validateResetPasswordInput("12345", "12345");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password minimal 6 karakter");
    expect(result.errors.confirm).toBe("");
  });

  test("menerima password tepat enam karakter", () => {
    const result = validateResetPasswordInput("123456", "123456");

    expect(result.valid).toBe(true);
  });

  test("menolak konfirmasi yang tidak cocok", () => {
    const result = validateResetPasswordInput("newpass123", "newpass124");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("");
    expect(result.errors.confirm).toBe("Konfirmasi password tidak cocok");
  });

  test("tidak melempar error saat menerima null", () => {
    const result = validateResetPasswordInput(null, null);

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password baru wajib diisi");
  });
});

describe("firebaseUpdateUserPassword() - service ubah password", () => {
  test("Stub: mengembalikan success saat currentUser tersedia", async () => {
    const authStub = {
      currentUser: { updatePassword: async () => {} },
    };

    const result = await firebaseUpdateUserPassword("newpass123", authStub);

    expect(result).toEqual({ success: true });
  });

  test("Mock: meneruskan password baru ke currentUser.updatePassword", async () => {
    const updatePassword = jest.fn().mockResolvedValue(undefined);
    const authMock = { currentUser: { updatePassword } };

    await firebaseUpdateUserPassword("newpass123", authMock);

    expect(updatePassword).toHaveBeenCalledTimes(1);
    expect(updatePassword).toHaveBeenCalledWith("newpass123");
  });

  test("Mock: error dari Firebase dilempar ulang setelah dicatat", async () => {
    const failure = new Error("Password terlalu lemah");
    const updatePassword = jest.fn().mockRejectedValue(failure);
    const authMock = { currentUser: { updatePassword } };
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      firebaseUpdateUserPassword("123", authMock)
    ).rejects.toThrow("Password terlalu lemah");
    expect(warn).toHaveBeenCalledWith("Firebase updatePassword error:", failure);
  });

  test("Dummy: tidak memanggil updatePassword saat tidak ada user yang login", async () => {
    const updatePassword = jest.fn();
    const authMock = { currentUser: null };

    const result = await firebaseUpdateUserPassword("newpass123", authMock);

    expect(result).toEqual({ success: true });
    expect(updatePassword).not.toHaveBeenCalled();
  });

  test("Dummy: mengembalikan success saat objek auth tidak tersedia", async () => {
    const result = await firebaseUpdateUserPassword("newpass123", null);

    expect(result).toEqual({ success: true });
  });

  test("memakai fbAuth bawaan saat argumen auth tidak diberikan", async () => {
    const result = await firebaseUpdateUserPassword("newpass123");

    expect(result).toEqual({ success: true });
    expect(auth.currentUser).toBeNull();
  });
});
