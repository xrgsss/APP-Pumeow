import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';

import 'package:pumeow_v3/main.dart';

void main() {
  testWidgets('MyApp renders provided initial route', (WidgetTester tester) async {
    final testPages = [
      GetPage(
        name: '/',
        page: () => const Scaffold(body: Text('Home')),
      ),
    ];

    await tester.pumpWidget(
      MyApp(
        initialRoute: '/',
        pages: testPages,
        initialBinding: BindingsBuilder(() {}),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
  });
}
