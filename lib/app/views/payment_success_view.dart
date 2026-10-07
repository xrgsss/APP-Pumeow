import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/cart_controller.dart';
import '../routes/app_pages.dart';
import '../theme/app_colors.dart';

class PaymentSuccessView extends StatelessWidget {
  PaymentSuccessView({super.key});

  final Map<String, dynamic>? args = Get.arguments as Map<String, dynamic>?;
  final CartController cartController = Get.find<CartController>();

  @override
  Widget build(BuildContext context) {
    final method = (args?['method'] as String?) ?? 'Pembayaran';
    final orderId = (args?['orderId'] as String?) ??
        (cartController.purchaseHistory.isNotEmpty
            ? cartController.purchaseHistory.last.orderId ?? 'ORD-001'
            : 'ORD-001');

    final now = DateTime.now();
    final dateStr =
        '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year} ${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    final totalVal = cartController.purchaseHistory.isNotEmpty
        ? cartController.purchaseHistory.last.product.price *
            cartController.purchaseHistory.last.quantity
        : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesanan Berhasil'),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 84),
              const SizedBox(height: 16),
              const Text(
                'Pesanan Berhasil Dibuat',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.darkBrown,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Metode: $method berhasil dikonfirmasi.',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),

              // CARD DETAIL PESANAN
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    _infoRow('Nomor Pesanan', orderId, isBold: true),
                    const Divider(height: 16),
                    _infoRow('Tanggal Pesanan', dateStr),
                    const Divider(height: 16),
                    _infoRow('Total Harga', 'Rp${totalVal > 0 ? totalVal.toStringAsFixed(0) : '15000'}', isPrice: true),
                    const Divider(height: 16),
                    _infoRow('Status Pembayaran', 'Lunas (Simulasi)', valueColor: const Color(0xFF16A34A)),
                    const Divider(height: 16),
                    _infoRow('Status Pesanan', 'Pembayaran Dikonfirmasi', valueColor: AppColors.brown),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // BUTTON LACAK PESANAN
              ElevatedButton.icon(
                onPressed: () {
                  Get.toNamed(
                    Routes.ORDER_TRACKING,
                    arguments: {'orderId': orderId},
                  );
                },
                icon: const Icon(Icons.local_shipping_outlined),
                label: const Text(
                  'Lacak Pesanan',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.orange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 10),

              // BUTTON KEMBALI KE BERANDA
              OutlinedButton(
                onPressed: () => Get.offAllNamed(Routes.HOME),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Kembali ke Beranda'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(String label, String value,
      {bool isBold = false, bool isPrice = false, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 13, color: Colors.grey),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isPrice ? 15 : 13,
            fontWeight: isBold || isPrice ? FontWeight.bold : FontWeight.w600,
            color: valueColor ?? (isPrice ? AppColors.darkBrown : Colors.black87),
          ),
        ),
      ],
    );
  }
}
