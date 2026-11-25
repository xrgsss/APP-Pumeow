/**
 * Unit test murni untuk validasi kredensial login.
 *
 * Fungsi validateLoginInput() dipanggil langsung tanpa event submit, tanpa
 * manipulasi DOM, dan tanpa Firebase. Seluruh test pada berkas ini menguji
 * satu unit logika: pemetaan input mentah menjadi status valid + pesan error.
 */
const { loadApp } = require("../helpers/appHarness");

const { app } = loadApp();
const { validateLoginInput } = app;

describe("validateLoginInput() - unit test validasi login", () => {
  test("menerima kredensial valid dan mengembalikan salinan yang sudah di-trim", () => {
    // Arrange
    const rawEmail = "  user@gmail.com  ";
    const rawPassword = "  user123  ";

    // Act
    const result = validateLoginInput(rawEmail, rawPassword);

    // Assert
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({ email: "", password: "" });
    expect(result.credentials).toEqual({
      email: "user@gmail.com",
      password: "user123",
    });
    // Input asli tidak dimutasi
    expect(rawEmail).toBe("  user@gmail.com  ");
  });

  test("menolak email kosong dengan pesan 'Email wajib diisi'", () => {
    const result = validateLoginInput("", "user123");

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email wajib diisi");
    expect(result.errors.password).toBe("");
  });

  test("menolak email yang hanya berisi spasi", () => {
    const result = validateLoginInput("   ", "user123");

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Email wajib diisi");
  });

  test.each([
    ["user@@gmail", "dua karakter @"],
    ["user@gmail", "tanpa domain bertitik"],
    ["user gmail.com", "mengandung spasi"],
    ["@gmail.com", "tanpa nama pengguna"],
    ["user@.com", "domain kosong"],
  ])("menolak format email tidak valid: %s (%s)", (email) => {
    const result = validateLoginInput(email, "user123");

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("Format email tidak valid");
  });

  test("menolak password kosong dengan pesan 'Password wajib diisi'", () => {
    const result = validateLoginInput("user@gmail.com", "");

    expect(result.valid).toBe(false);
    expect(result.errors.email).toBe("");
    expect(result.errors.password).toBe("Password wajib diisi");
  });

  test("menolak password yang hanya berisi spasi setelah trim", () => {
    const result = validateLoginInput("user@gmail.com", "      ");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password wajib diisi");
  });

  test("menolak password lima karakter", () => {
    const result = validateLoginInput("user@gmail.com", "user1");

    expect(result.valid).toBe(false);
    expect(result.errors.password).toBe("Password minimal 6 karakter");
  });

  test("menerima password tepat enam karakter (batas bawah inklusif)", () => {
    const result = validateLoginInput("user@gmail.com", "user12");

    expect(result.valid).toBe(true);
    expect(result.errors.password).toBe("");
  });

  test("melaporkan kedua kesalahan sekaligus saat email dan password kosong", () => {
    const result = validateLoginInput("", "");

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      email: "Email wajib diisi",
      password: "Password wajib diisi",
    });
  });

  test("tidak melempar error saat menerima null atau undefined", () => {
    const fromNull = validateLoginInput(null, null);
    const fromUndefined = validateLoginInput(undefined, undefined);

    expect(fromNull.valid).toBe(false);
    expect(fromNull.errors).toEqual({
      email: "Email wajib diisi",
      password: "Password wajib diisi",
    });
    expect(fromUndefined.valid).toBe(false);
    expect(fromUndefined.credentials).toEqual({ email: "", password: "" });
  });

  test("karakterisasi: pola email longgar meloloskan a@b.c", () => {
    // Perilaku ini sengaja didokumentasikan karena pola /^\S+@\S+\.\S+$/
    // hanya memeriksa keberadaan @ dan satu titik.
    const result = validateLoginInput("a@b.c", "user123");

    expect(result.valid).toBe(true);
  });
});
