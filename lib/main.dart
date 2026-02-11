import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';

import 'app/bindings/initial_binding.dart';
import 'app/routes/app_pages.dart';
import 'app/models/product.dart';
import 'app/models/product_adapter.dart';
import 'app/services/notification_service.dart';
import 'app/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env
  await dotenv.load(fileName: ".env");

  // Initialize Firebase (for push notification)
  await Firebase.initializeApp();

  // Initialize Hive
  await Hive.initFlutter();
  if (!Hive.isAdapterRegistered(productTypeId)) {
    Hive.registerAdapter(ProductAdapter());
  }
  await Hive.openBox('cart'); // Hive untuk cart lokal
  await Hive.openBox<Product>('products'); // Hive untuk daftar produk lokal
  await Hive.openBox('favorites'); // Hive untuk produk favorit

  // Initialize Supabase
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
    authOptions: const FlutterAuthClientOptions(
      autoRefreshToken: true,
    ),
  );

  // Initialize notifications (permission + listeners)
  await NotificationService.initialize();

  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({
    super.key,
    this.initialBinding,
    this.pages,
    this.initialRoute,
  });

  final Bindings? initialBinding;
  final List<GetPage<dynamic>>? pages;
  final String? initialRoute;

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'PumeowID',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialBinding: initialBinding ?? InitialBinding(),
      initialRoute: initialRoute ?? AppPages.INITIAL,
      getPages: pages ?? AppPages.pages,
    );
  }
}
