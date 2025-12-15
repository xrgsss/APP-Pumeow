import 'package:get/get.dart';

import '../views/login_view.dart';
import '../views/register_view.dart';
import '../views/home_view.dart';
import '../views/product_detail_view.dart';
import '../views/cart_view.dart';
import '../bindings/initial_binding.dart';

part 'app_routes.dart';

class AppPages {
  static const INITIAL = Routes.LOGIN;

  static final pages = [
    GetPage(
      name: Routes.LOGIN,
      page: () => LoginView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.REGISTER,
      page: () => RegisterView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.HOME,
      page: () => HomeView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.PRODUCT_DETAIL,
      page: () => ProductDetailView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.CART,
      page: () => CartView(),
      binding: InitialBinding(),
    ),
  ];
}
