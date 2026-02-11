import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/material.dart';

import '../models/product.dart';
import '../services/supabase_service.dart';

class PurchaseHistoryEntry {
  final Product product;
  final int quantity;
  final String method; // pickup / delivery
  final DateTime createdAt;
  final String? orderId;

  PurchaseHistoryEntry({
    required this.product,
    required this.quantity,
    required this.method,
    required this.createdAt,
    this.orderId,
  });
}

class CartController extends GetxController {
  final SupabaseService _supabaseService = SupabaseService();
  final SupabaseClient _supabase = Supabase.instance.client;

  var cartItems = <Product, int>{}.obs;
  var purchaseHistory = <PurchaseHistoryEntry>[].obs;
  var isSubmitting = false.obs;

  void addToCart(Product product) {
    if (cartItems.containsKey(product)) {
      cartItems[product] = cartItems[product]! + 1;
    } else {
      cartItems[product] = 1;
    }
    cartItems.refresh();
  }

  void removeFromCart(Product product) {
    if (!cartItems.containsKey(product)) return;
    if (cartItems[product]! > 1) {
      cartItems[product] = cartItems[product]! - 1;
    } else {
      cartItems.remove(product);
    }
    cartItems.refresh();
  }

  Future<void> checkout(
    String method, {
    double? lat,
    double? lng,
    bool syncToSupabase = true,
  }) async {
    if (cartItems.isEmpty) return;

    final user = _supabase.auth.currentUser;
    if (syncToSupabase && user == null) {
      Get.snackbar('Login', 'Silakan login terlebih dahulu untuk checkout.');
      return;
    }

    isSubmitting.value = true;

    final now = DateTime.now();
    String? orderId;

    try {
      if (syncToSupabase) {
        orderId = await _supabaseService.createOrder(
          method: method,
          cartItems: cartItems,
          lat: lat,
          lng: lng,
        );
      }

      purchaseHistory.addAll(
        cartItems.entries.map(
          (e) => PurchaseHistoryEntry(
            product: e.key,
            quantity: e.value,
            method: method,
            createdAt: now,
            orderId: orderId,
          ),
        ),
      );
      purchaseHistory.refresh();

      cartItems.clear();
      cartItems.refresh();

      Get.snackbar(
        'Checkout',
        orderId != null
            ? 'Pesanan tercatat di Supabase (ID: $orderId)'
            : 'Pesanan tersimpan lokal.',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFFF3E6D0),
        colorText: const Color(0xFF4B2E19),
        margin: const EdgeInsets.all(12),
        borderRadius: 12,
        duration: const Duration(seconds: 4),
      );
    } catch (e) {
      Get.snackbar(
        'Checkout',
        'Gagal memproses: $e',
        snackPosition: SnackPosition.TOP,
        backgroundColor: const Color(0xFFFDECEC),
        colorText: const Color(0xFF4B2E19),
        margin: const EdgeInsets.all(12),
        borderRadius: 12,
      );
    } finally {
      isSubmitting.value = false;
    }
  }
}
