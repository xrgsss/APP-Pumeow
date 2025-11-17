import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/product.dart';
import '../controllers/cart_controller.dart';

class ProductDetailView extends StatelessWidget {
  final CartController cartController = Get.find<CartController>();

  ProductDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    final Product product = Get.arguments as Product;

    return Scaffold(
      appBar: AppBar(title: Text('${product.name} - ${product.variant}')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(product.description, style: const TextStyle(fontSize: 18)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                cartController.addToCart(product);
                Get.snackbar('Berhasil', 'Produk ditambahkan ke keranjang');
              },
              icon: const Icon(Icons.add_shopping_cart),
              label: const Text('Tambah ke Keranjang'),
            ),
          ],
        ),
      ),
    );
  }
}
