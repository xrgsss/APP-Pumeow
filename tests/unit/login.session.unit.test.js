/**
 * Unit test untuk persistensi sesi login dan penyamaran kredensial.
 *
 * saveState()/loadState() adalah mekanisme yang membuat sesi login bertahan
 * setelah halaman dimuat ulang. Keduanya menerima parameter storage sehingga
 * dapat diuji dengan FakeStorage tanpa menyentuh localStorage browser.
 *
 * Test double: Fake (FakeStorage) – implementasi localStorage in-memory yang
 * benar-benar menyimpan dan memulihkan data, bukan sekadar nilai balik tetap.
 */
const { loadApp, resetState } = require("../helpers/appHarness");

const { app } = loadApp();
const { saveState, loadState, maskPassword, state } = app;

/** Fake localStorage: perilaku seperti Storage, tetapi datanya di memori. */
class FakeStorage {
  constructor(seed = {}) {
    this.data = new Map(Object.entries(seed));
    this.writes = [];
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    const stringValue = String(value);
    this.data.set(key, stringValue);
    this.writes.push([key, stringValue]);
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
    this.writes = [];
  }
}

beforeEach(() => {
  resetState(app);
});

describe("saveState()/loadState() - persistensi sesi login", () => {
  test("Fake: menyimpan lalu memulihkan sesi login secara utuh", () => {
    // Arrange
    const storage = new FakeStorage();
    state.auth = {
      email: "user@gmail.com",
      password: "user123",
      isLoading: false,
      isLoggedIn: true,
      isAdmin: false,
      user: { uid: "uid-user" },
    };
    state.cart = { 1: 2, 3: 1 };
    state.favorites = new Set([1, 3]);
    state.orders = [{ id: "ORD-1", status: "paid" }];
    state.purchaseHistory = [{ orderId: "ORD-1", total: 38000 }];
    state.selectedVariant = "Vanilla";
    state.search = "pudding";

    // Act
    saveState(storage);
    const persisted = JSON.parse(storage.getItem("pumeowWebState"));

    // Reset state di memori sebelum memulihkan
    state.cart = {};
    state.favorites = new Set();
    state.orders = [];
    state.purchaseHistory = [];
    state.selectedVariant = "Semua";
    state.search = "";
    state.auth = { email: "", password: "", isLoading: false, isLoggedIn: false, isAdmin: false, user: null };
    loadState(storage);

    // Assert
    expect(storage.writes).toHaveLength(1);
    expect(storage.writes[0][0]).toBe("pumeowWebState");
    expect(persisted.auth.email).toBe("user@gmail.com");
    expect(state.auth.isLoggedIn).toBe(true);
    expect(state.auth.user).toEqual({ uid: "uid-user" });
    expect(state.cart).toEqual({ 1: 2, 3: 1 });
    expect(state.favorites).toBeInstanceOf(Set);
    expect([...state.favorites]).toEqual([1, 3]);
    expect(state.orders).toEqual([{ id: "ORD-1", status: "paid" }]);
    expect(state.selectedVariant).toBe("Vanilla");
    expect(state.search).toBe("pudding");
  });

  test("Fake: tidak mengubah state saat storage kosong", () => {
    const storage = new FakeStorage();
    state.cart = { 2: 1 };

    loadState(storage);

    expect(state.cart).toEqual({ 2: 1 });
  });

  test("Fake: JSON rusak diabaikan tanpa melempar error", () => {
    const storage = new FakeStorage({ pumeowWebState: "{bukan-json" });
    state.cart = { 2: 1 };

    expect(() => loadState(storage)).not.toThrow();
    expect(state.cart).toEqual({ 2: 1 });
  });

  test("Fake: produk tanpa stok dinormalisasi menjadi stok 15 dan tetap tersedia", () => {
    const storage = new FakeStorage({
      pumeowWebState: JSON.stringify({
        products: [
          { id: 1, name: "Pudding Milk", isAvailable: true },
          { id: 2, name: "Pudding Chocolate", stock: 0, isAvailable: true },
        ],
      }),
    });

    loadState(storage);

    expect(state.products[0].stock).toBe(15);
    expect(state.products[0].isAvailable).toBe(true);
    expect(state.products[1].stock).toBe(0);
    expect(state.products[1].isAvailable).toBe(false);
  });

  test("Fake: array favorit dari JSON dipulihkan sebagai Set", () => {
    const storage = new FakeStorage({
      pumeowWebState: JSON.stringify({ favorites: [2, 5] }),
    });

    loadState(storage);

    expect(state.favorites).toBeInstanceOf(Set);
    expect(state.favorites.has(2)).toBe(true);
    expect(state.favorites.has(5)).toBe(true);
  });
});

describe("maskPassword() - penyamaran kredensial tersimpan", () => {
  test("menyamarkan password hingga 12 karakter", () => {
    expect(maskPassword("user123")).toBe("*******");
    expect(maskPassword("password-yang-sangat-panjang")).toBe("************");
  });

  test("mengembalikan teks default untuk nilai kosong", () => {
    expect(maskPassword("")).toBe("Belum ada data");
    expect(maskPassword(null)).toBe("Belum ada data");
  });
});
