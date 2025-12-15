import 'package:get/get.dart';
import '../models/product.dart';

class ProductController extends GetxController {
  var productList = <Product>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchProducts();
  }

  void fetchProducts() {
    // Hardcoded data dulu, nanti bisa dari API
    var products = [
      Product(
        id: 1,
        name: "Pudding Milk",
        variant: "Vanilla",
        description: "Pudding rasa vanilla.",
      ),
      Product(
        id: 2,
        name: "Pudding Chocolate",
        variant: "Chocolate",
        description: "Pudding rasa coklat.",
      ),
      Product(
        id: 3,
        name: "Pudding Mango",
        variant: "Mango",
        description: "Pudding rasa mangga.",
      ),
    ];
    productList.assignAll(products);
  }
}
