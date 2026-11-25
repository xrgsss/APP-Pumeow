/**
 * Unit test fitur Pencarian & Filter Produk.
 *
 * filterProducts() adalah fungsi murni: menerima katalog, kata kunci, dan
 * varian terpilih, lalu mengembalikan produk yang cocok. Tidak menyentuh
 * state global maupun DOM.
 *
 * Test double: Dummy (katalog produk sebagai data uji tanpa perilaku).
 */
const { loadApp } = require("../helpers/appHarness");

const { app } = loadApp();
const { filterProducts, PRODUCT_VARIANTS } = app;

const CATALOG = [
  {
    id: 1,
    name: "Pudding Milk",
    variant: "Vanilla",
    description: "Pudding rasa vanilla lembut dengan topping fresh cream.",
  },
  {
    id: 2,
    name: "Pudding Chocolate",
    variant: "Chocolate",
    description: "Pudding coklat pekat dengan lapisan ganache tipis.",
  },
  {
    id: 3,
    name: "Pudding Mango",
    variant: "Mango",
    description: "Pudding mangga dengan puree asli dan aroma tropis.",
  },
  {
    id: 4,
    name: "Pudding Taro",
    variant: "Taro",
    description: "Pudding taro ungu lembut dengan aroma talas manis.",
  },
];

const ids = (products) => products.map((p) => p.id);

describe("filterProducts() - pencarian dan filter katalog", () => {
  test("mengembalikan seluruh produk saat kata kunci kosong dan varian Semua", () => {
    const result = filterProducts(CATALOG, "", "Semua");

    expect(result).toHaveLength(4);
  });

  test("mencocokkan nama produk tanpa membedakan huruf besar/kecil", () => {
    expect(ids(filterProducts(CATALOG, "milk", "Semua"))).toEqual([1]);
    expect(ids(filterProducts(CATALOG, "MILK", "Semua"))).toEqual([1]);
    expect(ids(filterProducts(CATALOG, "MiLk", "Semua"))).toEqual([1]);
  });

  test("mencocokkan nama varian", () => {
    expect(ids(filterProducts(CATALOG, "taro", "Semua"))).toEqual([4]);
  });

  test("mencocokkan deskripsi produk", () => {
    expect(ids(filterProducts(CATALOG, "ganache", "Semua"))).toEqual([2]);
  });

  test("mencocokkan potongan kata di tengah nama", () => {
    expect(ids(filterProducts(CATALOG, "dd", "Semua"))).toEqual([1, 2, 3, 4]);
  });

  test("mengembalikan array kosong saat tidak ada yang cocok", () => {
    expect(filterProducts(CATALOG, "durian", "Semua")).toEqual([]);
  });

  test("memfilter berdasarkan varian yang dipilih", () => {
    expect(ids(filterProducts(CATALOG, "", "Chocolate"))).toEqual([2]);
  });

  test("varian Semua menampilkan seluruh varian", () => {
    expect(ids(filterProducts(CATALOG, "", "Semua"))).toEqual([1, 2, 3, 4]);
  });

  test("varian yang tidak ada di katalog menghasilkan array kosong", () => {
    expect(filterProducts(CATALOG, "", "Pandan")).toEqual([]);
  });

  test("kata kunci dan varian harus cocok bersamaan (AND)", () => {
    // "pudding" cocok untuk semua, tetapi varian membatasi ke satu produk.
    expect(ids(filterProducts(CATALOG, "pudding", "Mango"))).toEqual([3]);
    // Kata kunci cocok di varian lain -> hasil kosong.
    expect(filterProducts(CATALOG, "milk", "Mango")).toEqual([]);
  });

  test("mengembalikan array kosong saat katalog kosong", () => {
    expect(filterProducts([], "milk", "Semua")).toEqual([]);
  });

  test("tidak memutasi katalog asli", () => {
    const before = JSON.stringify(CATALOG);

    filterProducts(CATALOG, "milk", "Vanilla");

    expect(JSON.stringify(CATALOG)).toBe(before);
  });

  test("menerima nilai null/undefined tanpa melempar error", () => {
    expect(filterProducts(null, "milk", "Semua")).toEqual([]);
    expect(filterProducts(CATALOG, null, "Semua")).toHaveLength(4);
    expect(filterProducts(CATALOG, undefined, undefined)).toHaveLength(4);
  });

  test("mengabaikan produk yang field teksnya tidak lengkap", () => {
    const partial = [{ id: 9, name: "Pudding Keju" }];

    expect(ids(filterProducts(partial, "keju", "Semua"))).toEqual([9]);
  });
});

describe("PRODUCT_VARIANTS - daftar chip varian", () => {
  test("memuat opsi Semua di urutan pertama", () => {
    expect(PRODUCT_VARIANTS[0]).toBe("Semua");
  });

  test("memuat tujuh opsi varian", () => {
    expect(PRODUCT_VARIANTS).toHaveLength(7);
    expect(PRODUCT_VARIANTS).toEqual([
      "Semua",
      "Vanilla",
      "Chocolate",
      "Mango",
      "Taro",
      "Pandan",
      "Buah",
    ]);
  });
});
