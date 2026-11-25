/**
 * Unit test fitur Lupa Password (kirim tautan reset password).
 *
 * Dua unit diuji:
 * 1. validateForgotPasswordInput()   - validasi email sebelum dikirim.
 * 2. firebaseResetPasswordForEmail() - service pengiriman email reset.
 *
 * Test double: Stub (pengiriman selalu berhasil), Mock (verifikasi argumen +
 * simulasi kegagalan), dan Dummy (auth null).
 */
const { loadApp } = require("../helpers/appHarness");

const { app, auth } = loadApp();
const { validateForgotPasswordInput, firebaseResetPasswordForEmail } = app;

describe("validateForgotPasswordInput() - validasi email lupa password", () => {
  test("menerima email valid dan mengembalikan hasil trim", () => {
    const result = validateForgotPasswordInput("  user@gmail.com  ");

    expect(result).toEqual({
      valid: true,
      error: "",
      email: "user@gmail.com",
    });
  });

  test("menolak email kosong dengan pesan 'Email wajib diisi'", () => {
    const result = validateForgotPasswordInput("");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email wajib diisi");
  });

  test("menolak email yang hanya berisi spasi", () => {
    const result = validateForgotPasswordInput("    ");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email wajib diisi");
  });

  test.each([
    ["user@@gmail", "dua karakter @"],
    ["user@gmail", "tanpa domain bertitik"],
    ["user gmail.com", "mengandung spasi"],
  ])("menolak format email salah: %s (%s)", (email) => {
    const result = validateForgotPasswordInput(email);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Format email tidak valid");
  });

  test("tidak melempar error saat menerima null", () => {
    const result = validateForgotPasswordInput(null);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email wajib diisi");
  });
});

describe("firebaseResetPasswordForEmail() - pengiriman tautan reset", () => {
  test("Stub: mengembalikan true saat pengiriman berhasil", async () => {
    // Arrange: stub selalu berhasil tanpa melakukan I/O.
    const authStub = {
      sendPasswordResetEmail: async () => {},
    };

    // Act
    const result = await firebaseResetPasswordForEmail(
      "user@gmail.com",
      authStub
    );

    // Assert
    expect(result).toBe(true);
  });

  test("Mock: memanggil sendPasswordResetEmail dengan email yang benar", async () => {
    const authMock = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    await firebaseResetPasswordForEmail("user@gmail.com", authMock);

    expect(authMock.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(authMock.sendPasswordResetEmail).toHaveBeenCalledWith(
      "user@gmail.com"
    );
  });

  test("Mock: kegagalan Firebase tidak dibocorkan dan tetap mengembalikan true", async () => {
    // Perilaku anti-enumeration: pesan sukses generik walau email tidak ada.
    const authMock = {
      sendPasswordResetEmail: jest
        .fn()
        .mockRejectedValue(new Error("user-not-found")),
    };
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const result = await firebaseResetPasswordForEmail(
      "tidak-ada@gmail.com",
      authMock
    );

    expect(result).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      "Firebase resetPassword warning:",
      "user-not-found"
    );
  });

  test("Dummy: auth null tidak memanggil Firebase dan tetap mengembalikan true", async () => {
    const result = await firebaseResetPasswordForEmail("user@gmail.com", null);

    expect(result).toBe(true);
  });

  test("memakai fbAuth bawaan saat argumen auth tidak diberikan", async () => {
    const result = await firebaseResetPasswordForEmail("user@gmail.com");

    expect(result).toBe(true);
    expect(auth.sendPasswordResetEmail).toHaveBeenCalledWith("user@gmail.com");
  });
});
