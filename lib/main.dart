import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'app/bindings/initial_binding.dart';
import 'app/routes/app_pages.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load .env
  await dotenv.load(fileName: ".env");

  // Initialize Hive
  await Hive.initFlutter();
  await Hive.openBox('cart'); // Hive untuk cart lokal

  // Initialize Supabase
  await Supabase.initialize(
    url: dotenv.env['SUPABASE_URL']!,
    anonKey: dotenv.env['SUPABASE_ANON_KEY']!,
  );

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
      initialBinding: initialBinding ?? InitialBinding(),
      initialRoute: initialRoute ?? AppPages.INITIAL,
      getPages: pages ?? AppPages.pages,
    );
  }
}
