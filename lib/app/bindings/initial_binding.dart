import 'package:get/get.dart';
import '../controllers/auth_controller.dart';
import '../controllers/product_controller.dart';
import '../controllers/cart_controller.dart';
import '../controllers/location_controller.dart';
import '../controllers/favorite_controller.dart';

class InitialBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(AuthController());
    Get.put(ProductController());
    Get.put(CartController());
    Get.put(FavoriteController());
    Get.put(LocationController());
  }
}
