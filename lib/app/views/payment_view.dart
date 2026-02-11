import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../routes/app_pages.dart';

class PaymentView extends StatelessWidget {
  PaymentView({super.key});

  final Map<String, dynamic>? args = Get.arguments as Map<String, dynamic>?;

  @override
  Widget build(BuildContext context) {
    final lat = args?['lat'] as double?;
    final lng = args?['lng'] as double?;
    final address = args?['address'] as String?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Pilih Pembayaran'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: const Icon(Icons.location_pin, color: Colors.red),
              title: const Text('Lokasi dikonfirmasi'),
              subtitle: Text(
                (address != null && address.isNotEmpty)
                    ? address
                    : (lat != null && lng != null
                        ? 'Lat: ${lat.toStringAsFixed(5)}, Lng: ${lng.toStringAsFixed(5)}'
                        : 'Lokasi tidak tersedia'),
              ),
            ),
          ),
          const SizedBox(height: 12),
          _methodTile(
            title: 'E-Wallet',
            subtitle: 'OVO, Dana, Gopay, ShopeePay',
            icon: Icons.account_balance_wallet_outlined,
            onTap: () => _goToSimulation('E-Wallet'),
          ),
          _methodTile(
            title: 'Debit',
            subtitle: 'Kartu debit / ATM',
            icon: Icons.credit_card,
            onTap: () => _goToSimulation('Debit'),
          ),
          _methodTile(
            title: 'Virtual Account',
            subtitle: 'Transfer via VA (BCA, BNI, dll)',
            icon: Icons.account_balance_outlined,
            onTap: () => _goToSimulation('Virtual Account'),
          ),
          _methodTile(
            title: 'QRIS',
            subtitle: 'Scan QR untuk bayar',
            icon: Icons.qr_code_2,
            onTap: () => _goToSimulation('QRIS'),
          ),
        ],
      ),
    );
  }

  Widget _methodTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xffe8f1ff),
          child: Icon(icon, color: const Color(0xff1d4ed8)),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Color(0xff9ca3af)),
        onTap: onTap,
      ),
    );
  }

  void _goToSimulation(String method) {
    Get.toNamed(
      Routes.PAYMENT_SIMULATION,
      arguments: {
        'method': method,
        'lat': args?['lat'],
        'lng': args?['lng'],
        'address': args?['address'],
      },
    );
  }
}
