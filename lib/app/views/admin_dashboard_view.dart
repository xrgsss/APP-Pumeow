import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../controllers/product_controller.dart';
import '../models/product.dart';
import '../services/supabase_service.dart';
import '../routes/app_pages.dart';

class AdminDashboardView extends StatefulWidget {
  const AdminDashboardView({super.key});

  @override
  State<AdminDashboardView> createState() => _AdminDashboardViewState();
}

class _AdminDashboardViewState extends State<AdminDashboardView> {
  final AuthController authController = Get.find<AuthController>();
  final ProductController productController = Get.find<ProductController>();
  final SupabaseService supabaseService = SupabaseService();

  bool isLoadingOrders = false;
  List<Map<String, dynamic>> orders = [];

  @override
  void initState() {
    super.initState();
    if (!authController.isAdmin) {
      Get.offAllNamed(Routes.HOME);
      Get.snackbar('Akses ditolak', 'Hanya admin dapat membuka dashboard');
      return;
    }
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() => isLoadingOrders = true);
    try {
      final data = await supabaseService.fetchOrders();
      setState(() => orders = data);
    } catch (_) {
      Get.snackbar('Orders', 'Gagal memuat pesanan');
    } finally {
      setState(() => isLoadingOrders = false);
    }
  }

  Future<void> _showProductForm({Product? product}) async {
    final nameCtrl = TextEditingController(text: product?.name ?? '');
    final variantCtrl = TextEditingController(text: product?.variant ?? '');
    final priceCtrl =
        TextEditingController(text: product != null ? product.price.toString() : '');
    final descCtrl = TextEditingController(text: product?.description ?? '');
    final imageCtrl = TextEditingController(text: product?.imageAsset ?? '');
    final locationCtrl = TextEditingController(text: product?.location ?? '');

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                product == null ? 'Tambah Produk' : 'Edit Produk',
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              _field(nameCtrl, 'Nama'),
              _field(variantCtrl, 'Variant'),
              _field(priceCtrl, 'Harga', keyboard: TextInputType.number),
              _field(descCtrl, 'Deskripsi'),
              _field(imageCtrl, 'Image Asset URL'),
              _field(locationCtrl, 'Lokasi'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () async {
                  final price = double.tryParse(priceCtrl.text) ?? 0;
                  final newProduct = Product(
                    id: product?.id ?? 0,
                    name: nameCtrl.text,
                    variant: variantCtrl.text,
                    price: price,
                    description: descCtrl.text,
                    imageAsset: imageCtrl.text,
                    location: locationCtrl.text,
                  );
                  if (product == null) {
                    await supabaseService.createProduct(newProduct);
                  } else {
                    await supabaseService.updateProduct(newProduct);
                  }
                  await productController.fetchProducts();
                  Get.back();
                  Get.snackbar('Produk', 'Berhasil disimpan');
                  setState(() {});
                },
                child: const Text('Simpan'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _field(TextEditingController c, String label,
      {TextInputType keyboard = TextInputType.text}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: c,
        keyboardType: keyboard,
        decoration: InputDecoration(
          labelText: label,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!authController.isAdmin) {
      return const SizedBox.shrink();
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () async {
              await productController.fetchProducts();
              await _loadOrders();
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showProductForm(),
        child: const Icon(Icons.add),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Produk',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Obx(() {
              final items = productController.productList;
              if (items.isEmpty) {
                return const Text('Belum ada produk');
              }
              return Column(
                children: items
                    .map(
                      (p) => Card(
                        child: ListTile(
                          title: Text(p.name),
                          subtitle: Text('${p.variant} • Rp${p.price.toStringAsFixed(0)}'),
                          trailing: Wrap(
                            spacing: 8,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit),
                                onPressed: () => _showProductForm(product: p),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () async {
                                  await supabaseService.deleteProduct(p.id);
                                  await productController.fetchProducts();
                                  setState(() {});
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(),
              );
            }),
            const SizedBox(height: 16),
            const Text(
              'Pesanan (checkout)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            if (isLoadingOrders) const Center(child: CircularProgressIndicator()),
            if (!isLoadingOrders)
              ...orders.map(
                (o) => Card(
                  child: ListTile(
                    title: Text('Order ${o['id']}'),
                    subtitle: Text(
                        'Pembeli: ${o['buyer_email'] ?? o['user_id'] ?? '-'}\nMethod: ${o['method']} • Total: Rp${o['total'] ?? '-'}'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
