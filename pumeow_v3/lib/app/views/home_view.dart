import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/product_controller.dart';
import '../controllers/cart_controller.dart';
import '../routes/app_pages.dart';

class HomeView extends StatelessWidget {
  final productController = Get.find<ProductController>();
  final cartController = Get.find<CartController>();
  final searchController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('PumeowID - Home')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8),
            child: TextField(
              controller: searchController,
              decoration: const InputDecoration(
                hintText: 'Search pudding...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (query) {
                // bisa ditambah filter logic di controller
              },
            ),
          ),
          Expanded(
            child: Obx(() {
              var filteredProducts = productController.productList
                  .where(
                    (p) =>
                        p.name.toLowerCase().contains(
                          searchController.text.toLowerCase(),
                        ) ||
                        p.variant.toLowerCase().contains(
                          searchController.text.toLowerCase(),
                        ),
                  )
                  .toList();

              return ListView.builder(
                itemCount: filteredProducts.length,
                itemBuilder: (_, index) {
                  final product = filteredProducts[index];
                  return ListTile(
                    title: Text('${product.name} - ${product.variant}'),
                    subtitle: Text(product.description),
                    onTap: () {
                      Get.toNamed(Routes.PRODUCT_DETAIL, arguments: product);
                    },
                  );
                },
              );
            }),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.toNamed(Routes.CART),
        child: const Icon(Icons.shopping_cart),
      ),
    );
  }
}
