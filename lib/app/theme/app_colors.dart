import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color brown = Color(0xFFB1713B);
  static const Color darkBrown = Color(0xFF4B2E19);
  static const Color orange = Color(0xFFE28B3A);
  static const Color cream = Color(0xFFF3E6D0);
  static const Color outline = Color(0xFF2F2116);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFB1713B), Color(0xFFE28B3A)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
