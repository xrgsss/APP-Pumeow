import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../routes/app_pages.dart';
import '../controllers/cart_controller.dart';

class CheckoutView extends StatelessWidget {
  CheckoutView({super.key});

  final CartController cartController = Get.find<CartController>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pilih Metode')), 
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _optionCard(
            title: 'Ambil di tempat',
            subtitle: 'Datang langsung ke dapur Pumeow untuk ambil pesanan',
            icon: Icons.store_mall_directory_outlined,
            onTap: _handlePickup,
          ),
          const SizedBox(height: 12),
          _optionCard(
            title: 'Driver ke tujuan',
            subtitle: 'Kami antar ke lokasi kamu, pilih lokasi di peta',
            icon: Icons.delivery_dining_outlined,
            onTap: _handleDelivery,
          ),
        ],
      ),
    );
  }

  Widget _optionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Ink(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xffe8f1ff),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xff1d4ed8)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xff111827),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xff6b7280),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Color(0xff9ca3af)),
          ],
        ),
      ),
    );
  }

  void _handlePickup() async {
    if (cartController.cartItems.isEmpty) {
      Get.snackbar('Info', 'Keranjang masih kosong');
      return;
    }
    final orderId = await cartController.checkout('Ambil di tempat');
    Get.offAllNamed(
      Routes.PAYMENT_SUCCESS,
      arguments: {
        'method': 'Ambil di tempat',
        'orderId': orderId,
      },
    );
  }

  void _handleDelivery() {
    if (cartController.cartItems.isEmpty) {
      Get.snackbar('Info', 'Keranjang masih kosong');
      return;
    }
    cartController.checkout('Antar ke tujuan');
    Get.toNamed(Routes.MAP);
  }
}
