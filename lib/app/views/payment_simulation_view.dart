import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/cart_controller.dart';
import '../routes/app_pages.dart';

class PaymentSimulationView extends StatelessWidget {
  PaymentSimulationView({super.key});

  final Map<String, dynamic>? args = Get.arguments as Map<String, dynamic>?;
  final CartController cartController = Get.find<CartController>();

  @override
  Widget build(BuildContext context) {
    final method = (args?['method'] as String?) ?? 'Pembayaran';
    final lat = args?['lat'] as double?;
    final lng = args?['lng'] as double?;
    final address = args?['address'] as String?;

    return Scaffold(
      appBar: AppBar(
        title: Text('Simulasi $method'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: const Icon(Icons.location_on, color: Colors.red),
              title: const Text('Lokasi pengantaran'),
              subtitle: Text(
                (address != null && address.isNotEmpty)
                    ? address
                    : (lat != null && lng != null
                        ? 'Lat: ${lat.toStringAsFixed(5)}, Lng: ${lng.toStringAsFixed(5)}'
                        : 'Lokasi belum tersedia'),
              ),
            ),
          ),
          const SizedBox(height: 12),
          _buildSimulationCard(method),
          const SizedBox(height: 20),
          Obx(
            () => ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: cartController.isSubmitting.value
                  ? null
                  : () async {
                      await cartController.checkout(
                        method,
                        lat: lat,
                        lng: lng,
                        syncToSupabase: true,
                      );
                      Get.offAllNamed(
                        Routes.PAYMENT_SUCCESS,
                        arguments: {'method': method},
                      );
                    },
              child: cartController.isSubmitting.value
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Konfirmasi Pembayaran (Simulasi)'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimulationCard(String method) {
    switch (method) {
      case 'QRIS':
        return _qrisCard();
      case 'Virtual Account':
        return _vaCard();
      case 'Debit':
        return _debitCard();
      case 'E-Wallet':
      default:
        return _ewalletCard();
    }
  }

  Widget _qrisCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'QRIS',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              height: 220,
              decoration: BoxDecoration(
                color: const Color(0xfff5f5f5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xffe5e7eb)),
              ),
              child: const Center(
                child: Icon(Icons.qr_code_2, size: 120, color: Color(0xff6b7280)),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Scan kode ini dengan aplikasi e-wallet atau mobile banking kamu untuk menyelesaikan pembayaran.',
              style: TextStyle(color: Color(0xff4b5563)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _vaCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Virtual Account',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            const Text(
              'No. VA (simulasi): 8808 1234 5678 9012',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Gunakan nomor ini untuk transfer melalui ATM / m-banking.',
              style: TextStyle(color: Color(0xff4b5563)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _debitCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Debit',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 12),
            Text('Masukkan kartu pada EDC (simulasi).'),
            SizedBox(height: 8),
            Text(
              'Instruksi: Gesek / tap kartu, masukkan PIN pada perangkat kasir.',
              style: TextStyle(color: Color(0xff4b5563)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _ewalletCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'E-Wallet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            SizedBox(height: 12),
            Text('Pilih dompet digital lalu konfirmasi pembayaran di aplikasi kamu.'),
            SizedBox(height: 8),
            Text(
              'Instruksi: Buka OVO/DANA/GoPay/ShopeePay lalu selesaikan pembayaran.',
              style: TextStyle(color: Color(0xff4b5563)),
            ),
          ],
        ),
      ),
    );
  }
}
