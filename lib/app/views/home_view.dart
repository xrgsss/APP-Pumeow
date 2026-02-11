import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/product_controller.dart';
import '../controllers/cart_controller.dart';
import '../controllers/favorite_controller.dart';
import '../controllers/auth_controller.dart';
import '../models/product.dart';
import '../routes/app_pages.dart';
import '../theme/app_colors.dart';

class HomeView extends StatefulWidget {
  const HomeView({super.key});

  @override
  State<HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<HomeView> {
  final ProductController productController = Get.find<ProductController>();
  final CartController cartController = Get.find<CartController>();
  final FavoriteController favoriteController = Get.find<FavoriteController>();
  final AuthController authController = Get.find<AuthController>();
  final TextEditingController searchController = TextEditingController();
  String selectedVariant = 'Semua';

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.cream,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: AppColors.brown.withOpacity(0.12),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _navButton(
                icon: Icons.person_outline,
                onTap: () => Get.toNamed(Routes.PROFILE),
              ),
              _navButton(
                icon: Icons.favorite_border,
                onTap: () => Get.toNamed(Routes.FAVORITES),
              ),
              _navButton(
                icon: Icons.shopping_cart_outlined,
                onTap: () => Get.toNamed(Routes.CART),
              ),
              if (authController.isAdmin)
                _navButton(
                  icon: Icons.dashboard_customize_outlined,
                  onTap: () => Get.toNamed(Routes.ADMIN_DASHBOARD),
                ),
            ],
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(theme),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: _buildSearchBar(theme),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: _buildFilterChips(theme),
            ),
            const SizedBox(height: 6),
            Expanded(
              child: Obx(() {
                final query = searchController.text.toLowerCase();

                final filteredProducts = productController.productList.where((p) {
                  final matchQuery = p.name.toLowerCase().contains(query) ||
                      p.variant.toLowerCase().contains(query) ||
                      p.description.toLowerCase().contains(query);
                  final matchFilter =
                      selectedVariant == 'Semua' || p.variant == selectedVariant;
                  return matchQuery && matchFilter;
                }).toList();

                if (filteredProducts.isEmpty) {
                  return const Center(child: Text('Produk tidak ditemukan'));
                }

                return ListView.builder(
                  padding:
                      const EdgeInsets.only(left: 16, right: 16, bottom: 12),
                  itemCount: filteredProducts.length,
                  itemBuilder: (_, index) {
                    final product = filteredProducts[index];
                    return _ProductCard(
                      theme: theme,
                      product: product,
                      favoriteController: favoriteController,
                      onTap: () {
                        Get.toNamed(Routes.PRODUCT_DETAIL,
                            arguments: product);
                      },
                      onAddToCart: () {
                        cartController.addToCart(product);
                        Get.snackbar(
                          'Keranjang',
                          '${product.name} ditambahkan',
                          snackPosition: SnackPosition.TOP,
                          backgroundColor:
                              AppColors.cream.withOpacity(0.92),
                          colorText: AppColors.darkBrown,
                          margin: const EdgeInsets.all(14),
                          borderRadius: 16,
                          icon: const Icon(
                            Icons.shopping_cart_outlined,
                            color: AppColors.brown,
                          ),
                        );
                      },
                    );
                  },
                );
              }),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    final surface = theme.cardTheme.color ?? Colors.white;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            decoration: BoxDecoration(
              color: surface,
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                  color: AppColors.brown.withOpacity(0.12),
                  blurRadius: 18,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.orange.withOpacity(0.14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.emoji_food_beverage,
                    color: AppColors.brown,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Pumeow Pudding',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.darkBrown,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Dessert lembut untuk temani harimu',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: AppColors.darkBrown.withOpacity(0.65),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(ThemeData theme) {
    final surface = theme.cardTheme.color ?? Colors.white;

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              surface,
              surface.withOpacity(0.9),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          border: Border.all(color: AppColors.brown.withOpacity(0.15)),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: AppColors.brown.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: TextField(
          controller: searchController,
          onChanged: (_) => setState(() {}),
          decoration: const InputDecoration(
            hintText: 'Cari pudding...',
            hintStyle: TextStyle(color: AppColors.outline),
            prefixIcon: Icon(Icons.search, color: AppColors.darkBrown),
            suffixIcon: Icon(Icons.tune_rounded, color: AppColors.darkBrown),
            border: InputBorder.none,
            contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 15),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips(ThemeData theme) {
    final surface = theme.cardTheme.color ?? Colors.white;

    return Obx(() {
      final variants = [
        'Semua',
        ...productController.productList.map((p) => p.variant).toSet(),
      ];

      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: variants.map((variant) {
            final isSelected = selectedVariant == variant;
            return Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ChoiceChip(
                label: Text(variant),
                selected: isSelected,
                onSelected: (_) => setState(() => selectedVariant = variant),
                selectedColor: AppColors.orange.withOpacity(0.18),
                backgroundColor: surface,
                side: BorderSide(
                  color: isSelected
                      ? AppColors.orange
                      : AppColors.outline.withOpacity(0.2),
                ),
                labelStyle: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: isSelected
                      ? AppColors.darkBrown
                      : AppColors.outline,
                ),
              ),
            );
          }).toList(),
        ),
      );
    });
  }

  Widget _circleButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Ink(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.cream,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppColors.brown.withOpacity(0.12),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Icon(
          icon,
          color: AppColors.darkBrown,
        ),
      ),
    );
  }

  Widget _navButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Ink(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppColors.brown.withOpacity(0.1),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Icon(
          icon,
          color: AppColors.darkBrown,
          size: 22,
        ),
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  const _ProductCard({
    required this.theme,
    required this.product,
    required this.favoriteController,
    required this.onTap,
    required this.onAddToCart,
  });

  final ThemeData theme;
  final Product product;
  final FavoriteController favoriteController;
  final VoidCallback onTap;
  final VoidCallback onAddToCart;

  @override
  Widget build(BuildContext context) {
    final surface = theme.cardTheme.color ?? Colors.white;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppColors.brown.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 110,
                  height: 100,
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
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xffe6f7ef),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            product.variant.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.darkBrown,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Obx(() {
                          final isFavorite =
                              favoriteController.isFavorite(product);
                          return IconButton(
                            onPressed: () => favoriteController.toggle(product),
                            icon: Icon(
                              isFavorite
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                            ),
                            color: isFavorite
                                ? AppColors.brown
                                : AppColors.outline.withOpacity(0.7),
                          );
                        }),
                        IconButton(
                          onPressed: onAddToCart,
                          icon: const Icon(Icons.add_shopping_cart_outlined),
                          color: AppColors.outline.withOpacity(0.8),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      product.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppColors.darkBrown,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(
                          Icons.location_on_outlined,
                          size: 16,
                          color: AppColors.outline,
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            product.location,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.outline,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          size: 18,
                          color: Color(0xffffc400),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          product.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            color: AppColors.darkBrown,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Rp${product.price.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppColors.brown,
                            fontSize: 17,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: product.isAvailable
                                ? AppColors.orange.withOpacity(0.14)
                                : AppColors.outline.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(30),
                          ),
                          child: Text(
                            product.isAvailable ? 'Tersedia' : 'Habis',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: product.isAvailable
                                  ? AppColors.darkBrown
                                  : AppColors.outline,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
