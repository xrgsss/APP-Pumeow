/**
 * Unit test fitur Favorit.
 *
 * Unit yang diuji:
 * 1. toggleFavorite(productId) - menambah/menghapus produk dari favorit.
 * 2. favoriteProducts()        - menyaring katalog menjadi daftar favorit.
 *
 * Test double: Fake (FakeStorage) untuk memverifikasi bahwa favorit ikut
 * tersimpan, dan Dummy (katalog produk sebagai data uji tanpa perilaku).
 */
const { loadApp, resetState } = require("../helpers/appHarness");

const { app } = loadApp();
const { state, toggleFavorite, favoriteProducts, saveState, loadState } = app;

/** Fake localStorage in-memory untuk memverifikasi persistensi favorit. */
class FakeStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }
}

const CATALOG = [
  { id: 1, name: "Pudding Milk", variant: "Vanilla", price: 12000 },
  { id: 2, name: "Pudding Chocolate", variant: "Chocolate", price: 13000 },
  { id: 3, name: "Pudding Mango", variant: "Mango", price: 14000 },
];

beforeEach(() => {
  resetState(app);
  state.favorites = new Set();
  state.products = CATALOG.map((p) => ({ ...p }));
});

describe("toggleFavorite() - menandai produk favorit", () => {
  test("menambahkan produk ke favorit saat belum ditandai", () => {
    toggleFavorite(2);

    expect(state.favorites.has(2)).toBe(true);
    expect(state.favorites.size).toBe(1);
  });

  test("menghapus produk dari favorit saat ditandai dua kali", () => {
    toggleFavorite(2);
    toggleFavorite(2);

    expect(state.favorites.has(2)).toBe(false);
    expect(state.favorites.size).toBe(0);
  });

  test("mendukung beberapa produk favorit sekaligus", () => {
    toggleFavorite(1);
    toggleFavorite(3);

    expect([...state.favorites]).toEqual([1, 3]);
  });

  test("menghapus satu produk tidak memengaruhi favorit lain", () => {
    toggleFavorite(1);
    toggleFavorite(3);
    toggleFavorite(1);

    expect([...state.favorites]).toEqual([3]);
  });

  test("menyimpan favorit ke storage setelah setiap perubahan", () => {
    const storage = new FakeStorage();

    toggleFavorite(2);
    saveState(storage);

    const persisted = JSON.parse(storage.getItem("pumeowWebState"));
    expect(persisted.favorites).toEqual([2]);
  });

  test("Fake: favorit dipulihkan sebagai Set setelah loadState", () => {
    const storage = new FakeStorage();
    toggleFavorite(1);
    toggleFavorite(3);
    saveState(storage);

    state.favorites = new Set();
    loadState(storage);

    expect(state.favorites).toBeInstanceOf(Set);
    expect([...state.favorites]).toEqual([1, 3]);
  });
});

describe("favoriteProducts() - daftar produk favorit", () => {
  test("mengembalikan array kosong saat belum ada favorit", () => {
    expect(favoriteProducts()).toEqual([]);
  });

  test("mengembalikan hanya produk yang ditandai favorit", () => {
    toggleFavorite(2);

    const items = favoriteProducts();

    expect(items).toHaveLength(1);
    expect(items[0]).toEqual(expect.objectContaining({ id: 2 }));
  });

  test("mempertahankan urutan katalog, bukan urutan penandaan", () => {
    toggleFavorite(3);
    toggleFavorite(1);

    const ids = favoriteProducts().map((p) => p.id);

    expect(ids).toEqual([1, 3]);
  });

  test("mengabaikan id favorit yang produknya sudah tidak ada", () => {
    toggleFavorite(99);

    expect(favoriteProducts()).toEqual([]);
  });

  test("menerima katalog dan himpunan favorit sebagai parameter (pure)", () => {
    const items = favoriteProducts(CATALOG, new Set([1, 3]));

    expect(items.map((p) => p.id)).toEqual([1, 3]);
    // Tidak mengubah state global
    expect(state.favorites.size).toBe(0);
  });
});
