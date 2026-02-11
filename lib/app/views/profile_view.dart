import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/auth_controller.dart';
import '../controllers/cart_controller.dart';
import '../models/product.dart';

class ProfileView extends StatelessWidget {
  ProfileView({super.key});

  final AuthController authController = Get.find<AuthController>();
  final CartController cartController = Get.find<CartController>();

  String _maskedPassword(String value) {
    if (value.isEmpty) return 'Belum ada data';
    return '*' * value.length;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final email = authController.supabase.auth.currentUser?.email ??
        authController.lastLoginEmail.value;
    final password = authController.lastLoginPassword.value;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Pengguna'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Akun', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          _infoTile(
            icon: Icons.email_outlined,
            label: 'Email',
            value: email.isNotEmpty ? email : 'Belum login',
          ),
          const SizedBox(height: 8),
          _infoTile(
            icon: Icons.lock_outline,
            label: 'Password',
            value: _maskedPassword(password),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () async {
              await authController.logout();
            },
            icon: const Icon(Icons.logout),
            label: const Text('Logout'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
          ),
          const SizedBox(height: 20),
          Text('Riwayat Pembelian', style: theme.textTheme.titleLarge),
          const SizedBox(height: 12),
          Obx(() {
            final entries = cartController.purchaseHistory.toList().reversed;
            if (entries.isEmpty) {
              return _emptyHistory();
            }
            return Column(
              children: entries
                  .map(
                    (e) => _historyTile(
                      e.product,
                      e.quantity,
                      method: e.method,
                      date: e.createdAt,
                    ),
                  )
                  .toList(),
            );
          }),
        ],
      ),
    );
  }

  Widget _infoTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
          Icon(icon, color: const Color(0xff6b7280)),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xff6b7280),
                  )),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xff111827),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _historyTile(Product product, int qty,
      {required String method, required DateTime date}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
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
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xffe8f1ff),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Text(
              product.variant,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Color(0xff1d4ed8),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    color: Color(0xff111827),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Qty: $qty - Rp${product.price.toStringAsFixed(0)}',
                  style: const TextStyle(color: Color(0xff6b7280)),
                ),
                const SizedBox(height: 2),
                Text(
                  'Metode: $method | ${_fmtDate(date)}',
                  style: const TextStyle(color: Color(0xff9ca3af), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _fmtDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  Widget _emptyHistory() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: const Row(
        children: [
          Icon(Icons.receipt_long_outlined, color: Color(0xff9ca3af)),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Belum ada riwayat pembelian. Tambahkan produk ke keranjang dan checkout.',
              style: TextStyle(color: Color(0xff6b7280)),
            ),
          ),
        ],
      ),
    );
  }
}


