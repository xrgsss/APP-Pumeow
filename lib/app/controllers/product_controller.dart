import 'package:get/get.dart';
import 'package:hive/hive.dart';

import '../models/product.dart';

class ProductController extends GetxController {
  var productList = <Product>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchProducts();
  }

  Future<void> fetchProducts() async {
    final box = Hive.isBoxOpen('products')
        ? Hive.box<Product>('products')
        : await Hive.openBox<Product>('products');

    if (box.isEmpty) {
      await box.addAll(_defaultProducts);
    }

    productList.assignAll(box.values);
  }

  static const List<Product> _defaultProducts = [
    Product(
      id: 1,
      name: "Pudding Milk",
      variant: "Vanilla",
      price: 12000.0,
      description: "Pudding rasa vanilla lembut dengan topping fresh cream.",
      imageAsset: "assets/images/pudding milk.png",
      location: "Dapur Pumeow, Malang",
      rating: 4.7,
    ),
    Product(
      id: 2,
      name: "Pudding Chocolate",
      variant: "Chocolate",
      price: 13000.0,
      description: "Pudding coklat pekat dengan lapisan ganache tipis.",
      imageAsset: "assets/images/pudding coklat.png",
      location: "Dapur Pumeow, Malang",
      rating: 4.8,
    ),
    Product(
      id: 3,
      name: "Pudding Mango",
      variant: "Mango",
      price: 14000.0,
      description: "Pudding mangga dengan puree asli dan aroma tropis.",
      imageAsset: "assets/images/pudding mangga.png",
      location: "Dapur Pumeow, Malang",
      rating: 4.6,
    ),
    Product(
      id: 4,
      name: "Pudding Taro",
      variant: "Taro",
      price: 15000.0,
      description: "Pudding taro ungu lembut dengan aroma talas manis.",
      imageAsset: "assets/images/pudding taro.png",
      location: "Dapur Pumeow, Malang",
      rating: 4.7,
    ),
    Product(
      id: 5,
      name: "Pudding Pandan",
      variant: "Pandan",
      price: 15000.0,
      description: "Pudding pandan wangi dengan santan gurih dan gula merah.",
      imageAsset: "assets/images/pudding pandan.png",
      location: "Dapur Pumeow, Malang",
      rating: 4.6,
    ),
    Product(
      id: 6,
      name: "Pudding Buah",
      variant: "Buah",
      price: 16000.0,
      description: "Pudding creamy dengan topping potongan buah segar.",
      imageAsset: "assets/images/pudding buah.png",
      location: "Dapur Pumeow, Malang",
      rating: 4.8,
    ),
  ];
}
