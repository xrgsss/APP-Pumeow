import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/product.dart';

class SupabaseService {
  SupabaseService() : _client = Supabase.instance.client;

  final SupabaseClient _client;

  Future<List<Product>> fetchProducts() async {
    final data = await _client.from('products').select();
    final list = data as List<dynamic>;
    return list.map((e) => Product.fromMap(e as Map<String, dynamic>)).toList();
  }

  Future<Product?> createProduct(Product product) async {
    final payload = product.toJson();
    payload.remove('id');
    final res = await _client.from('products').insert(payload).select().maybeSingle();
    if (res == null) return null;
    return Product.fromMap(res);
  }

  Future<Product?> updateProduct(Product product) async {
    final payload = product.toJson();
    final res = await _client
        .from('products')
        .update(payload)
        .eq('id', product.id)
        .select()
        .maybeSingle();
    if (res == null) return null;
    return Product.fromMap(res);
  }

  Future<void> deleteProduct(int id) async {
    await _client.from('products').delete().eq('id', id);
  }

  Future<List<Map<String, dynamic>>> fetchOrders() async {
    final data = await _client.from('orders').select(
        'id, user_id, buyer_email, method, total, created_at, order_items (product_id, quantity, price)');
    return (data as List<dynamic>).cast<Map<String, dynamic>>();
  }

  Future<String?> createOrder({
    required String method,
    required Map<Product, int> cartItems,
    double? lat,
    double? lng,
  }) async {
    final user = _client.auth.currentUser;
    final total = cartItems.entries.fold<double>(
      0,
      (sum, e) => sum + (e.key.price * e.value),
    );

    final orderPayload = {
      'user_id': user?.id,
      'buyer_email': user?.email,
      'method': method,
      'total': total,
      'lat': lat,
      'lng': lng,
    };

    final orderResp =
        await _client.from('orders').insert(orderPayload).select().maybeSingle();
    final orderId = orderResp != null ? orderResp['id']?.toString() : null;

    if (orderId != null && cartItems.isNotEmpty) {
      final itemsPayload = cartItems.entries.map((entry) {
        return {
          'order_id': orderId,
          'product_id': entry.key.id,
          'quantity': entry.value,
          'price': entry.key.price,
        };
      }).toList();

      await _client.from('order_items').insert(itemsPayload);
    }

    return orderId;
  }
}
