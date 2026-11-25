/**
 * Unit test fitur Checkout (pembuatan pesanan).
 *
 * doCheckout(method, args) mengubah state keranjang menjadi pesanan:
 * validasi stok, perhitungan total, pemotongan stok, pencatatan riwayat,
 * pengosongan keranjang, dan penyimpanan ke storage.
 *
 * Test double:
 * - Dummy : keranjang kosong / produk stok habis sebagai data uji.
 * - Mock  : Firestore double (jest.fn) untuk memverifikasi penyimpanan
 *           produk dan pesanan tanpa menyentuh Firebase asli.
 * - Spy   : showSnackbar untuk memastikan pesan ke pengguna.
 */
const {
  loadApp,
  createFirestoreDouble,
  resetState,
  flush,
} = require("../helpers/appHarness");

const firestore = createFirestoreDouble();
const { app } = loadApp({ firestore });
const { state, doCheckout, addToCart } = app;

const PRODUCTS = () => [
  {
    id: 1,
    name: "Pudding Milk",
    variant: "Vanilla",
    price: 12000,
    stock: 5,
    description: "Pudding vanilla.",
    isAvailable: true,
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

beforeEach(() => {
  resetState(app);
  state.products = PRODUCTS();
  state.cart = {};
  state.orders = [];
  state.purchaseHistory = [];
  state.auth.email = "user@gmail.com";
  state.auth.user = { uid: "uid-user" };
  document.getElementById("snackbar").textContent = "";
  jest.clearAllMocks();
});

describe("doCheckout() - validasi sebelum membuat pesanan", () => {
  test("menolak checkout saat keranjang kosong", async () => {
    const result = await doCheckout("Driver Pumeow");

    expect(result).toBeNull();
    expect(document.getElementById("snackbar").textContent).toBe(
      "Keranjang masih kosong"
    );
    expect(state.orders).toHaveLength(0);
  });

  test("menolak checkout saat kuantitas melebihi stok tersedia", async () => {
    // Stok produk 1 = 5, tetapi keranjang berisi 6 (disimulasikan).
    state.cart = { 1: 6 };

    const result = await doCheckout("Driver Pumeow");

    expect(result).toBeNull();
    expect(document.getElementById("snackbar").textContent).toContain(
      "Gagal Checkout"
    );
    expect(state.orders).toHaveLength(0);
    // Stok tidak boleh ikut terpotong saat checkout gagal.
    expect(state.products[0].stock).toBe(5);
    expect(state.cart).toEqual({ 1: 6 });
  });

  test("menolak checkout saat produk di keranjang sudah tidak ada di katalog", async () => {
    state.cart = { 99: 1 };

    const result = await doCheckout("Driver Pumeow");

    expect(result).toBeNull();
    expect(state.orders).toHaveLength(0);
  });
});

describe("doCheckout() - pembuatan pesanan berhasil", () => {
  test("mengembalikan order record dengan status paid dan metode pembayaran", async () => {
    addToCart(1);

    const order = await doCheckout("Transfer Bank");

    expect(order).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^ORD-/),
        method: "Transfer Bank",
        status: "paid",
        paymentStatus: "Lunas (Simulasi)",
        buyer_email: "user@gmail.com",
        user_id: "uid-user",
      })
    );
    expect(order.orderId).toBe(order.id);
  });

  test("menghitung total harga dari seluruh item", async () => {
    addToCart(1);
    addToCart(1);
    addToCart(3);

    const order = await doCheckout("Driver Pumeow");

    // 2 x 12.000 + 1 x 14.000
    expect(order.total).toBe(38000);
  });

  test("menyertakan rincian item beserta kuantitas dan harga satuan", async () => {
    addToCart(1);
    addToCart(1);

    const order = await doCheckout("Driver Pumeow");

    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toEqual(
      expect.objectContaining({ quantity: 2, price: 12000 })
    );
    expect(order.items[0].product.id).toBe(1);
  });

  test("memotong stok produk sesuai kuantitas yang dibeli", async () => {
    addToCart(1);
    addToCart(1);
    addToCart(3);

    await doCheckout("Driver Pumeow");

    expect(state.products[0].stock).toBe(3);
    expect(state.products[1].stock).toBe(1);
  });

  test("menandai produk tidak tersedia saat stok habis setelah checkout", async () => {
    addToCart(3);
    addToCart(3);

    await doCheckout("Driver Pumeow");

    expect(state.products[1].stock).toBe(0);
    expect(state.products[1].isAvailable).toBe(false);
  });

  test("mengosongkan keranjang setelah pesanan dibuat", async () => {
    addToCart(1);

    await doCheckout("Driver Pumeow");

    expect(state.cart).toEqual({});
  });

  test("menambahkan pesanan ke urutan teratas daftar pesanan", async () => {
    state.orders = [{ id: "ORD-LAMA", status: "completed" }];
    addToCart(1);

    const order = await doCheckout("Driver Pumeow");

    expect(state.orders).toHaveLength(2);
    expect(state.orders[0].id).toBe(order.id);
    expect(state.orders[1].id).toBe("ORD-LAMA");
  });

  test("mencatat riwayat pembelian satu entri per item", async () => {
    addToCart(1);
    addToCart(3);

    const order = await doCheckout("Driver Pumeow");

    expect(state.purchaseHistory).toHaveLength(2);
    expect(state.purchaseHistory[0]).toEqual(
      expect.objectContaining({ orderId: order.id, total: order.total })
    );
  });

  test("menyimpan pesanan ke localStorage", async () => {
    addToCart(1);

    const order = await doCheckout("Driver Pumeow");

    const persisted = JSON.parse(localStorage.getItem("pumeowWebState"));
    expect(persisted.orders[0].id).toBe(order.id);
  });

  test("menyimpan alamat dan koordinat pengiriman dari argumen", async () => {
    addToCart(1);

    const order = await doCheckout("Driver Pumeow", {
      lat: -7.96662,
      lng: 112.63263,
      address: "Jl. Soekarno Hatta, Malang",
    });

    expect(order.lat).toBe(-7.96662);
    expect(order.lng).toBe(112.63263);
    expect(order.address).toBe("Jl. Soekarno Hatta, Malang");
  });

  test("DEFECT-03: kurir pickup tidak pernah dipakai karena membandingkan args.method", async () => {
    // doCheckout(method, args) memeriksa `args.method`, padahal metode
    // dikirim sebagai parameter pertama sehingga `args.method` selalu
    // undefined. Akibatnya cabang "Pickup di Dapur Pumeow" tidak pernah
    // tereksekusi. Test ini mengunci perilaku saat ini (characterization),
    // bukan mengabsahkan hasilnya.
    addToCart(1);

    const order = await doCheckout("Ambil di tempat");

    expect(order.courier).toBe("Driver Pumeow");
  });

  test("memakai kurir Driver Pumeow untuk metode pengiriman", async () => {
    addToCart(1);

    const order = await doCheckout("Driver Pumeow");

    expect(order.courier).toBe("Driver Pumeow");
  });

  test("memakai email default saat state tidak menyimpan email", async () => {
    state.auth.email = "";
    addToCart(1);

    const order = await doCheckout("Driver Pumeow");

    expect(order.buyer_email).toBe("user@gmail.com");
  });
});

describe("doCheckout() - integrasi dengan Firestore (Mock)", () => {
  test("menyimpan produk terbaru setelah stok dipotong", async () => {
    addToCart(1);

    await doCheckout("Driver Pumeow");
    await flush();

    expect(firestore.collection).toHaveBeenCalledWith("products");
  });

  test("menulis pesanan ke koleksi orders beserta batch item", async () => {
    addToCart(1);

    const order = await doCheckout("Driver Pumeow");
    await flush();

    expect(firestore.collection).toHaveBeenCalledWith("orders");
    expect(firestore.batch).toHaveBeenCalledTimes(1);
    const batch = firestore.batch.mock.results[0].value;
    expect(batch.set).toHaveBeenCalledTimes(1);
    expect(batch.commit).toHaveBeenCalledTimes(1);
    expect(order.id).toBeDefined();
  });
});
