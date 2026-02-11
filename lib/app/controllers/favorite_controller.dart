import 'package:get/get.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../models/product.dart';

class FavoriteController extends GetxController {
  static const _boxName = 'favorites';

  late Box _box;
  final favoriteIds = <int>{}.obs;

  @override
  void onInit() {
    super.onInit();
    _load();
  }

  Future<void> _load() async {
    _box = Hive.isBoxOpen(_boxName)
        ? Hive.box(_boxName)
        : await Hive.openBox(_boxName);
    final stored = _box.get('ids', defaultValue: <int>[]) as List<dynamic>;
    favoriteIds.value =
        stored.whereType<int>().toSet(); // keep only valid int IDs
  }

  bool isFavorite(Product product) => favoriteIds.contains(product.id);

  Future<void> toggle(Product product) async {
    if (isFavorite(product)) {
      favoriteIds.remove(product.id);
    } else {
      favoriteIds.add(product.id);
    }
    favoriteIds.refresh();
    await _box.put('ids', favoriteIds.toList());
  }

  List<Product> favoriteProducts(Iterable<Product> products) {
    return products.where((p) => favoriteIds.contains(p.id)).toList();
  }
}
