import 'package:get/get.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../routes/app_pages.dart';

class AuthController extends GetxController {
  final SupabaseClient supabase = Supabase.instance.client;

  var isLoading = false.obs;
  var lastLoginEmail = ''.obs;
  var lastLoginPassword = ''.obs;

  @override
  void onInit() {
    super.onInit();

    // Auto handling login/logout
    supabase.auth.onAuthStateChange.listen((data) {
      final event = data.event;

      final hasSession = data.session != null;

      if (event == AuthChangeEvent.signedIn ||
          (event == AuthChangeEvent.initialSession && hasSession)) {
        Get.offAllNamed(Routes.HOME);
      } else if (event == AuthChangeEvent.signedOut) {
        Get.offAllNamed(Routes.LOGIN);
      }
    });
  }

  @override
  void onReady() {
    super.onReady();

    // If a session is already persisted locally, skip the login screen.
    if (supabase.auth.currentSession != null) {
      Get.offAllNamed(Routes.HOME);
    }
  }

  // REGISTER
  Future<void> register(String email, String password) async {
    try {
      isLoading.value = true;

      final response = await supabase.auth.signUp(
        email: email,
        password: password,
      );

      if (response.user != null) {
        Get.snackbar("Success", "Registered successfully");
      }
    } on AuthException catch (e) {
      Get.snackbar("Error", e.message);
    } finally {
      isLoading.value = false;
    }
  }

  // LOGIN
  Future<void> login(String email, String password) async {
    try {
      isLoading.value = true;

      final response = await supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        lastLoginEmail.value = email;
        lastLoginPassword.value = password;
        Get.snackbar("Success", "Login successful");
        Get.offAllNamed(Routes.HOME);
      }
    } on AuthException catch (e) {
      Get.snackbar("Login Failed", e.message);
    } finally {
      isLoading.value = false;
    }
  }

  // LOGOUT
  Future<void> logout() async {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      Get.snackbar("Error", "Failed to logout");
    }
  }

  // CHECK SESSION
  bool isLoggedIn() {
    return supabase.auth.currentUser != null;
  }

  bool get isAdmin =>
      supabase.auth.currentUser?.email?.toLowerCase() == 'admin@gmail.com';
}
