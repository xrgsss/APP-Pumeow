import 'package:get/get.dart';

import '../views/login_view.dart';
import '../views/register_view.dart';
import '../views/home_view.dart';
import '../views/product_detail_view.dart';
import '../views/cart_view.dart';
import '../bindings/initial_binding.dart';
import '../views/map_view.dart';
import '../views/profile_view.dart';
import '../views/checkout_view.dart';
import '../views/payment_view.dart';
import '../views/payment_simulation_view.dart';
import '../views/payment_success_view.dart';
import '../views/admin_dashboard_view.dart';
import '../views/favorites_view.dart';

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
    GetPage(
      name: Routes.FAVORITES,
      page: () => FavoritesView(),
      binding: InitialBinding(),
    ),
    GetPage(name: Routes.MAP, page: () => MapView(), binding: InitialBinding()),
    GetPage(
      name: Routes.PROFILE,
      page: () => ProfileView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.CHECKOUT,
      page: () => CheckoutView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.PAYMENT_METHOD,
      page: () => PaymentView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.PAYMENT_SIMULATION,
      page: () => PaymentSimulationView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.PAYMENT_SUCCESS,
      page: () => PaymentSuccessView(),
      binding: InitialBinding(),
    ),
    GetPage(
      name: Routes.ADMIN_DASHBOARD,
      page: () => AdminDashboardView(),
      binding: InitialBinding(),
    ),
  ];
}
