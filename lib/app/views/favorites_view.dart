import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/favorite_controller.dart';
import '../controllers/product_controller.dart';
import '../models/product.dart';
import '../routes/app_pages.dart';
import '../theme/app_colors.dart';

class FavoritesView extends StatelessWidget {
  FavoritesView({super.key});

  final FavoriteController favoriteController = Get.find<FavoriteController>();
  final ProductController productController = Get.find<ProductController>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Favorit'),
      ),
      body: Obx(() {
        final favorites =
            favoriteController.favoriteProducts(productController.productList);

        if (favorites.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.favorite_border,
                    size: 64, color: AppColors.outline.withOpacity(0.5)),
                const SizedBox(height: 12),
                Text(
                  'Belum ada produk favorit',
                  style: theme.textTheme.titleMedium
                      ?.copyWith(color: AppColors.darkBrown),
                ),
                const SizedBox(height: 6),
                Text(
                  'Tap ikon hati di daftar produk untuk menambahkannya.',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(color: AppColors.outline),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: favorites.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (_, index) {
            final product = favorites[index];
            return _FavoriteCard(
              product: product,
              onTap: () =>
                  Get.toNamed(Routes.PRODUCT_DETAIL, arguments: product),
              onToggle: () => favoriteController.toggle(product),
            );
          },
        );
      }),
    );
  }
}

class _FavoriteCard extends StatelessWidget {
  const _FavoriteCard({
    required this.product,
    required this.onTap,
    required this.onToggle,
  });

  final Product product;
  final VoidCallback onTap;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.brown.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 90,
                height: 80,
                child: Image.asset(
                  product.imageAsset,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xfff3f4f6),
                    child: const Icon(
                      Icons.image_not_supported_outlined,
                      color: Color(0xff9ca3af),
                    ),
                  ),
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
                      color: AppColors.darkBrown,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.variant,
                    style: const TextStyle(
                      color: AppColors.outline,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Rp${product.price.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      color: AppColors.brown,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              onPressed: onToggle,
              icon: const Icon(Icons.favorite),
              color: AppColors.brown,
            ),
          ],
        ),
      ),
    );
  }
}
