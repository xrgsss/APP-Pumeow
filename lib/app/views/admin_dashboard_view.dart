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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Pesanan (checkout)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text('${orders.length} Pesanan', style: const TextStyle(color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 8),
            if (isLoadingOrders) const Center(child: CircularProgressIndicator()),
            if (!isLoadingOrders && orders.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('Belum ada pesanan masuk.'),
              ),
            if (!isLoadingOrders)
              ...orders.map(
                (o) {
                  final status = (o['status'] as String? ?? 'paid').toLowerCase();
                  final orderId = o['id']?.toString() ?? '-';
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Order $orderId',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  fontFamily: 'monospace',
                                ),
                              ),
                              _statusChip(status),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Pembeli: ${o['buyer_email'] ?? o['user_id'] ?? '-'}\nMethod: ${o['method']} • Total: Rp${o['total'] ?? '-'}',
                            style: const TextStyle(fontSize: 13, height: 1.4),
                          ),
                          if (o['tracking_number'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Resi: ${o['tracking_number']} (${o['courier'] ?? "Driver"})',
                                style: const TextStyle(fontSize: 12, color: Colors.indigo),
                              ),
                            ),
                          if (o['delivered_at'] != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'Telah diterima pembeli: ${o['delivered_at'].toString().split('T').first}',
                                style: const TextStyle(fontSize: 12, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                              ),
                            ),
                          const Divider(height: 16),
                          Wrap(
                            spacing: 8,
                            runSpacing: 4,
                            children: [
                              OutlinedButton.icon(
                                onPressed: () {
                                  Get.toNamed(
                                    Routes.ORDER_TRACKING,
                                    arguments: {'orderId': orderId},
                                  );
                                },
                                icon: const Icon(Icons.visibility, size: 16),
                                label: const Text('Lacak', style: TextStyle(fontSize: 12)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  minimumSize: const Size(60, 32),
                                ),
                              ),
                              if (status == 'paid')
                                ElevatedButton(
                                  onPressed: () => _updateOrderStatus(orderId, 'processing'),
                                  style: ElevatedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    minimumSize: const Size(60, 32),
                                  ),
                                  child: const Text('Proses', style: TextStyle(fontSize: 12)),
                                ),
                              if (status == 'processing')
                                ElevatedButton(
                                  onPressed: () => _shipOrderDialog(orderId),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0D9488),
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    minimumSize: const Size(60, 32),
                                  ),
                                  child: const Text('Kirim', style: TextStyle(fontSize: 12)),
                                ),
                              if (status == 'shipped')
                                ElevatedButton(
                                  onPressed: () => _updateOrderStatus(orderId, 'completed'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF16A34A),
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    minimumSize: const Size(60, 32),
                                  ),
                                  child: const Text('Tandai Selesai', style: TextStyle(fontSize: 12)),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _statusChip(String status) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case 'pending':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        label = 'Pending';
        break;
      case 'paid':
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1E40AF);
        label = 'Paid';
        break;
      case 'processing':
        bg = const Color(0xFFEDE9FE);
        fg = const Color(0xFF5B21B6);
        label = 'Processing';
        break;
      case 'shipped':
        bg = const Color(0xFFCCFBF1);
        fg = const Color(0xFF115E59);
        label = 'Shipped';
        break;
      case 'completed':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF166534);
        label = 'Completed';
        break;
      default:
        bg = Colors.grey.shade200;
        fg = Colors.black87;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  Future<void> _updateOrderStatus(String orderId, String newStatus) async {
    final success = await supabaseService.updateOrderStatus(orderId, newStatus);
    if (success) {
      Get.snackbar('Pesanan', 'Status order $orderId diubah menjadi $newStatus');
      await _loadOrders();
    } else {
      Get.snackbar('Gagal', 'Tidak dapat memperbarui status');
    }
  }

  Future<void> _shipOrderDialog(String orderId) async {
    final courierCtrl = TextEditingController(text: 'Driver Pumeow');
    final resiCtrl = TextEditingController(text: 'PUM-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}');

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Kirim Pesanan'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: courierCtrl, decoration: const InputDecoration(labelText: 'Kurir')),
            const SizedBox(height: 10),
            TextField(controller: resiCtrl, decoration: const InputDecoration(labelText: 'Nomor Resi / Tracking')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Kirim Sekarang')),
        ],
      ),
    );

    if (result == true) {
      final success = await supabaseService.updateOrderStatus(
        orderId,
        'shipped',
        courier: courierCtrl.text.trim(),
        trackingNumber: resiCtrl.text.trim(),
        deliveredAt: null,
      );
      if (success) {
        Get.snackbar('Pengiriman', 'Pesanan $orderId telah dikirim');
        await _loadOrders();
      }
    }
  }
}
