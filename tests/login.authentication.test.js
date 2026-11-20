/**
 * TC-06 s.d. TC-12 — Unit 2: blok autentikasi Firebase
 * (web/app.js baris 2295-2350)
 *
 * Fokus: memastikan enam decision (AD1-AD6) berperilaku sesuai analisis
 * manual, termasuk dua jalur yang pada praktiknya sulit dipicu melalui
 * Firebase asli (respons tanpa user, dan elemen error yang hilang).
 *
 * Catatan metode:
 * Handler memanggil render() pada A2 (baris 2296) SEBELUM menunggu Firebase,
 * sehingga elemen #loginEmailError yang ada di DOM saat pesan ditulis adalah
 * elemen hasil render tersebut. Untuk memeriksa pesan yang benar-benar ditulis
 * oleh handler, promise Firebase sengaja ditangguhkan: elemen ditangkap lebih
 * dulu, baru promise diselesaikan. Elemen lama tetap menyimpan textContent-nya
 * meskipun kemudian diganti oleh render() pada baris 2327.
 */
const {
  loadApp,
  resetState,
  openLoginPage,
  submitLogin,
  flush,
} = require("./helpers/appHarness");

const { app, auth } = loadApp();

const VALID_EMAIL = "user@gmail.com";
const VALID_PASSWORD = "user123";

/** Pembaca pesan error pada DOM terkini (elemen dibuat ulang oleh render()). */
const errorText = () => document.getElementById("loginEmailError").textContent;

/**
 * Menjalankan submit dengan promise Firebase yang ditangguhkan.
 * @returns {{ errorElement: HTMLElement, settle: {resolve: Function, reject: Function} }}
 */
async function startDeferredLogin({ email, password }) {
  let settle;
  auth.signInWithEmailAndPassword.mockReturnValue(
    new Promise((resolve, reject) => {
      settle = { resolve, reject };
    })
  );
  const fields = openLoginPage(app);
  submitLogin(fields, { email, password });
  await flush();
  return {
    // elemen hasil render() pada A2 (baris 2296) — target penulisan pesan
    errorElement: document.getElementById("loginEmailError"),
    settle,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Handler mencatat kegagalan Firebase lewat console.error; dibungkam agar
  // keluaran test tetap terbaca, tanpa menyembunyikan kegagalan assertion.
  jest.spyOn(console, "error").mockImplementation(() => {});
  resetState(app);
});

describe("Unit 2 - Autentikasi Firebase", () => {
  test("TC-06 | password salah menulis pesan dari errMap ke #loginEmailError", async () => {
    // Arrange: Firebase asli melempar AuthException, bukan mengembalikan nilai
    const { errorElement, settle } = await startDeferredLogin({
      email: VALID_EMAIL,
      password: "wrongpass123",
    });

    // Act
    settle.reject(
      Object.assign(new Error("Firebase: Error (auth/invalid-credential)."), {
        code: "auth/invalid-credential",
      })
    );
    await flush();

    // Assert: AD4 True -> A17 menulis pesan yang dipetakan dari errMap
    expect(errorElement.textContent).toBe("Email atau password salah.");
    // AD3 tidak dieksekusi karena exception; state auth dikembalikan
    expect(app.state.auth.isLoggedIn).toBe(false);
    expect(app.state.auth.isLoading).toBe(false);
    // Tidak ada perpindahan halaman
    expect(window.location.hash).toBe("#/login");
  });

  test("TC-07 | kredensial valid menyimpan sesi dan berpindah ke HOME", async () => {
    // Arrange
    auth.signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-user", email: VALID_EMAIL },
    });
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: VALID_EMAIL, password: VALID_PASSWORD });
    await flush();

    // Assert: AD3 True, AD5 False -> jalur sukses
    expect(app.state.auth.isLoggedIn).toBe(true);
    expect(app.state.auth.email).toBe(VALID_EMAIL);
    expect(app.state.auth.user).toEqual({
      uid: "uid-user",
      email: VALID_EMAIL,
    });
    expect(app.state.auth.isAdmin).toBe(false);
    expect(window.location.hash).toBe("#/home");
    expect(document.getElementById("snackbar").textContent).toBe(
      "Login berhasil!"
    );
  });

  test("TC-07b | akun admin dikenali dari alamat email", async () => {
    // Arrange
    auth.signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "uid-admin", email: "admin@gmail.com" },
    });
    const fields = openLoginPage(app);

    // Act
    submitLogin(fields, { email: "admin@gmail.com", password: VALID_PASSWORD });
    await flush();

    // Assert: A31 (isAdmin) bernilai True
    expect(app.state.auth.isAdmin).toBe(true);
  });

  test("TC-08 | email belum terdaftar menulis pesan errMap yang sesuai", async () => {
    // Arrange
    const { errorElement, settle } = await startDeferredLogin({
      email: "unregistered@test.com",
      password: VALID_PASSWORD,
    });

    // Act
    settle.reject(
      Object.assign(new Error("Firebase: Error (auth/user-not-found)."), {
        code: "auth/user-not-found",
      })
    );
    await flush();

    // Assert: pemetaan kode error bekerja untuk kode selain invalid-credential
    expect(errorElement.textContent).toBe(
      "Email belum terdaftar. Silakan daftar akun baru terlebih dahulu."
    );
    expect(app.state.auth.isLoggedIn).toBe(false);
  });

  test("TC-10 | respons berhasil tanpa objek user ditolak (butuh Test Double)", async () => {
    // Arrange: Firebase asli tidak pernah menghasilkan kondisi ini.
    // Stub mengembalikan objek tanpa properti user -> AD3 False, AD5 True.
    const { errorElement, settle } = await startDeferredLogin({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });

    // Act
    settle.resolve({ user: null });
    await flush();

    // Assert: AD3 False -> AD5 True -> A23 menulis pesan akun tidak valid
    expect(errorElement.textContent).toBe("Login gagal. Akun tidak valid.");
    expect(app.state.auth.isLoggedIn).toBe(false);
    expect(app.state.auth.isLoading).toBe(false);
  });

  test("TC-11 | elemen error hilang saat proses berjalan tidak membuat handler gagal", async () => {
    // Arrange
    const { errorElement, settle } = await startDeferredLogin({
      email: VALID_EMAIL,
      password: "wrongpass123",
    });
    errorElement.remove();

    // Act
    settle.reject(
      Object.assign(new Error("Firebase: Error (auth/invalid-credential)."), {
        code: "auth/invalid-credential",
      })
    );
    await flush();

    // Assert: cabang False dari AD4 dieksekusi -> tidak ada penulisan pesan,
    // dan handler tetap selesai tanpa melempar exception
    expect(errorElement.textContent).toBe("");
    expect(app.state.auth.isLoading).toBe(false);
    expect(app.state.auth.isLoggedIn).toBe(false);
  });

  test("TC-11b | cabang False AD6 dieksekusi saat elemen error hilang", async () => {
    // Arrange
    const { errorElement, settle } = await startDeferredLogin({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });
    errorElement.remove();

    // Act
    settle.resolve({ user: null });
    await flush();

    // Assert: AD3 False -> AD5 True -> AD6 False
    expect(errorElement.textContent).toBe("");
    expect(app.state.auth.isLoggedIn).toBe(false);
    expect(app.state.auth.isLoading).toBe(false);
  });

  test("TC-13 | submit pada form lain tidak menjalankan handler login", async () => {
    // Arrange: listener submit terpasang pada document, bukan pada #loginForm
    openLoginPage(app);
    const form = document.createElement("form");
    form.id = "dummyForm";
    document.body.appendChild(form);

    // Act
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await flush();

    // Assert: guard `event.target.id === "loginForm"` menolak form lain
    expect(auth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    form.remove();
  });

  test("TC-14 | kode error di luar errMap memakai pesan bawaan Firebase", async () => {
    // Arrange
    const { errorElement, settle } = await startDeferredLogin({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });

    // Act: kode tidak ada di errMap -> jatuh ke err.message
    settle.reject(
      Object.assign(new Error("Koneksi ke server terputus."), {
        code: "auth/network-request-failed",
      })
    );
    await flush();

    // Assert
    expect(errorElement.textContent).toBe("Koneksi ke server terputus.");
  });

  test("TC-15 | error tanpa kode dan tanpa pesan memakai fallback 'Login gagal.'", async () => {
    // Arrange
    const { errorElement, settle } = await startDeferredLogin({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });

    // Act: keduanya kosong -> operand ketiga dari binary expression dipakai
    settle.reject(new Error(""));
    await flush();

    // Assert
    expect(errorElement.textContent).toBe("Login gagal.");
  });
});

/**
 * DEFECT-02 — isi kolom email hilang saat proses login dimulai.
 *
 * A2 (baris 2296) memanggil render() untuk menampilkan status "Loading...",
 * dan renderLogin() mengisi kembali value input dari state.auth.email. Namun
 * state.auth.email baru diisi pada jalur sukses (A29/baris 2339), sehingga saat
 * login gagal nilainya masih "" dan email yang sudah diketik pengguna hilang.
 */
describe("DEFECT-02 - email yang diketik hilang saat proses login", () => {
  test("TC-16 | kolom email kosong kembali setelah login gagal", async () => {
    // Arrange
    const { settle } = await startDeferredLogin({
      email: "salah@test.com",
      password: VALID_PASSWORD,
    });

    // Act
    settle.reject(
      Object.assign(new Error("Firebase: Error (auth/invalid-credential)."), {
        code: "auth/invalid-credential",
      })
    );
    await flush();

    // Assert: nilai yang diketik pengguna tidak dipulihkan oleh render()
    expect(document.getElementById("loginEmail").value).toBe("");
  });
});

/**
 * DEFECT-01 — pesan kegagalan login tidak pernah terlihat oleh pengguna.
 *
 * Baris 2317/2333 mengambil #loginEmailError lalu menulis pesan pada baris
 * 2326/2334. Baris berikutnya (2327/2335) memanggil render(), dan render()
 * menimpa appRoot.innerHTML dengan renderLogin() yang selalu menghasilkan
 * <p class="error-text" id="loginEmailError"></p> kosong. Akibatnya pesan
 * terhapus pada frame yang sama dan pengguna hanya melihat form kosong.
 */
describe("DEFECT-01 - pesan error login terhapus oleh render()", () => {
  const cases = [
    {
      nama: "password salah (errMap auth/invalid-credential)",
      email: VALID_EMAIL,
      password: "wrongpass123",
      firebase: (settle) =>
        settle.reject(
          Object.assign(new Error("Firebase: Error (auth/invalid-credential)."), {
            code: "auth/invalid-credential",
          })
        ),
      pesan: "Email atau password salah.",
    },
    {
      nama: "email belum terdaftar (errMap auth/user-not-found)",
      email: "unregistered@test.com",
      password: VALID_PASSWORD,
      firebase: (settle) =>
        settle.reject(
          Object.assign(new Error("Firebase: Error (auth/user-not-found)."), {
            code: "auth/user-not-found",
          })
        ),
      pesan: "Email belum terdaftar. Silakan daftar akun baru terlebih dahulu.",
    },
    {
      nama: "respons tanpa objek user",
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      firebase: (settle) => settle.resolve({ user: null }),
      pesan: "Login gagal. Akun tidak valid.",
    },
  ];

  test.each(cases)(
    "TC-12 | pesan '$pesan' ditulis ke elemen lama lalu hilang dari DOM ($nama)",
    async ({ email, password, firebase, pesan }) => {
      // Arrange
      const { errorElement, settle } = await startDeferredLogin({
        email,
        password,
      });

      // Act
      firebase(settle);
      await flush();

      // Assert 1: handler benar-benar menulis pesan ke elemen hasil render A2
      expect(errorElement.textContent).toBe(pesan);

      // Assert 2: render() mengganti elemen tersebut dengan elemen baru
      expect(document.getElementById("loginEmailError")).not.toBe(errorElement);

      // Assert 3: pesan tidak ada lagi di DOM -> pengguna tidak menerima feedback
      expect(errorText()).toBe("");
      expect(document.getElementById("appRoot").innerHTML).not.toContain(pesan);

      // Assert 4: alur tetap berakhir pada halaman login
      expect(window.location.hash).toBe("#/login");
    }
  );
});
