/**
 * Unit test fitur Keranjang (cart).
 *
 * Unit yang diuji adalah fungsi manipulasi keranjang murni terhadap state:
 * addToCart(), removeFromCart(), cartEntries(), cartIsEmpty(), dan helper
 * tampilan harga formatPrice().
 *
 * Test double: Dummy (produk stok habis/tidak tersedia dipakai sebagai data
 * uji tanpa perilaku), dan Spy pada showSnackbar untuk memverifikasi pesan
 * yang muncul ke pengguna.
 */
const { loadApp, resetState } = require("../helpers/appHarness");

const { app } = loadApp();
const {
  state,
  addToCart,
  removeFromCart,
  cartEntries,
  cartIsEmpty,
  formatPrice,
} = app;

beforeEach(() => {
  resetState(app);
  state.cart = {};
  state.products = [
    {
      id: 1,
      name: "Pudding Milk",
      variant: "Vanilla",
      price: 12000,
      stock: 3,
      description: "Pudding vanilla.",
      isAvailable: true,
    },
    {
      id: 2,
      name: "Pudding Chocolate",
      variant: "Chocolate",
      price: 13000,
      stock: 0,
      description: "Pudding coklat.",
      isAvailable: false,
    },
    {
      id: 3,
      name: "Pudding Mango",
      variant: "Mango",
      price: 14000,
      stock: 2,
      description: "Pudding mangga.",
      isAvailable: true,
    },
  ];
  document.getElementById("snackbar").textContent = "";
});

describe("addToCart() - menambah produk ke keranjang", () => {
  test("menambahkan produk tersedia sebanyak satu buah", () => {
    const added = addToCart(1);

    expect(added).toBe(true);
    expect(state.cart).toEqual({ 1: 1 });
  });

  test("menambah kuantitas pada pemanggilan berikutnya", () => {
    addToCart(1);
    addToCart(1);

    expect(state.cart).toEqual({ 1: 2 });
  });

  test("menerima productId berupa string maupun number", () => {
    addToCart("3");

    expect(state.cart).toEqual({ 3: 1 });
  });

  test("menolak penambahan saat kuantitas sudah mencapai stok", () => {
    // Stok produk 3 hanya 2.
    addToCart(3);
    addToCart(3);
    const thirdAttempt = addToCart(3);

    expect(thirdAttempt).toBe(false);
    expect(state.cart).toEqual({ 3: 2 });
    expect(document.getElementById("snackbar").textContent).toBe(
      "Maksimal 2 pcs! Tidak bisa melebihi stok yang tersedia."
    );
  });

  test("menolak produk dengan stok nol", () => {
    const added = addToCart(2);

    expect(added).toBe(false);
    expect(state.cart).toEqual({});
    expect(document.getElementById("snackbar").textContent).toBe(
      'Maaf, stok "Pudding Chocolate" sedang habis!'
    );
  });

  test("menolak produk yang ditandai tidak tersedia walau stok ada", () => {
    state.products[0].isAvailable = false;

    const added = addToCart(1);

    expect(added).toBe(false);
    expect(state.cart).toEqual({});
  });

  test("mengabaikan productId yang tidak dikenal", () => {
    const added = addToCart(99);

    expect(added).toBeUndefined();
    expect(state.cart).toEqual({});
  });

  test("menyimpan keranjang ke localStorage setelah penambahan", () => {
    addToCart(1);

    const persisted = JSON.parse(localStorage.getItem("pumeowWebState"));
    expect(persisted.cart).toEqual({ 1: 1 });
  });
});

describe("removeFromCart() - mengurangi isi keranjang", () => {
  test("mengurangi kuantitas bila lebih dari satu", () => {
    addToCart(1);
    addToCart(1);

    removeFromCart(1);

    expect(state.cart).toEqual({ 1: 1 });
  });

  test("menghapus entri saat kuantitas tersisa satu", () => {
    addToCart(1);

    removeFromCart(1);

    expect(state.cart).toEqual({});
  });

  test("tidak melakukan apa pun untuk produk yang tidak ada di keranjang", () => {
    removeFromCart(3);

    expect(state.cart).toEqual({});
  });
});

describe("cartEntries()/cartIsEmpty() - membaca isi keranjang", () => {
  test("cartIsEmpty bernilai true saat keranjang kosong", () => {
    expect(cartIsEmpty()).toBe(true);
  });

  test("cartIsEmpty bernilai false setelah produk ditambahkan", () => {
    addToCart(1);

    expect(cartIsEmpty()).toBe(false);
  });

  test("cartEntries menggabungkan produk dengan kuantitasnya", () => {
    addToCart(1);
    addToCart(1);
    addToCart(3);

    const entries = cartEntries();

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      product: expect.objectContaining({ id: 1, name: "Pudding Milk" }),
      quantity: 2,
    });
    expect(entries[1]).toEqual({
      product: expect.objectContaining({ id: 3, name: "Pudding Mango" }),
      quantity: 1,
    });
  });

  test("cartEntries mengabaikan id produk yang sudah tidak ada di katalog", () => {
    state.cart = { 1: 1, 99: 5 };

    const entries = cartEntries();

    expect(entries).toHaveLength(1);
    expect(entries[0].product.id).toBe(1);
  });

  test("cartEntries mengembalikan array kosong saat keranjang kosong", () => {
    expect(cartEntries()).toEqual([]);
  });
});

describe("formatPrice() - format harga rupiah", () => {
  test("memformat angka dengan pemisah ribuan", () => {
    expect(formatPrice(12000)).toBe("Rp12.000");
    expect(formatPrice(1500000)).toBe("Rp1.500.000");
  });

  test("membulatkan nilai pecahan", () => {
    expect(formatPrice(12000.6)).toBe("Rp12.001");
  });

  test("menangani nilai kosong sebagai nol", () => {
    expect(formatPrice(null)).toBe("Rp0");
    expect(formatPrice(undefined)).toBe("Rp0");
  });
});
