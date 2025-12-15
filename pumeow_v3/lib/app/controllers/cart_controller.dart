import 'package:get/get.dart';
import '../models/product.dart';

class CartController extends GetxController {
  var cartItems = <Product, int>{}.obs;

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
}
