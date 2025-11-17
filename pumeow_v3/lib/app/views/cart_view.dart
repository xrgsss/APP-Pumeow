import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/cart_controller.dart';
import '../models/product.dart';

class CartView extends StatelessWidget {
  final CartController cartController = Get.find<CartController>();

  CartView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Keranjang')),
      body: Obx(() {
        if (cartController.cartItems.isEmpty) {
          return const Center(child: Text('Keranjang kosong'));
        }

        return ListView(
          children: cartController.cartItems.entries.map((entry) {
            final Product product = entry.key;
            final int quantity = entry.value;

            return ListTile(
              title: Text('${product.name} - ${product.variant}'),
              subtitle: Text('Jumlah: $quantity'),
              trailing: SizedBox(
                width: 120,
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove),
                      onPressed: () => cartController.removeFromCart(product),
                    ),
                    Text('$quantity'),
                    IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: () => cartController.addToCart(product),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        );
      }),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: ElevatedButton(
          onPressed: () {
            if (cartController.cartItems.isEmpty) {
              Get.snackbar('Info', 'Keranjang masih kosong');
              return;
            }

            // Implement checkout logic (misal reset keranjang)
            cartController.cartItems.clear();
            Get.snackbar('Sukses', 'Pesanan berhasil dibuat');
            Get.back();
          },
          child: const Text('Checkout'),
        ),
      ),
    );
  }
}
