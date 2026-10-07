import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../routes/app_pages.dart';
import '../theme/app_colors.dart';

class ForgotPasswordView extends StatefulWidget {
  const ForgotPasswordView({super.key});

  @override
  State<ForgotPasswordView> createState() => _ForgotPasswordViewState();
}

class _ForgotPasswordViewState extends State<ForgotPasswordView> {
  final AuthController authController = Get.find<AuthController>();
  final TextEditingController emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool emailSent = false;

  @override
  void dispose() {
    emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    final email = emailController.text.trim();
    final success = await authController.sendPasswordResetEmail(email);

    if (success) {
      setState(() {
        emailSent = true;
      });
      Get.snackbar(
        'Instruksi Terkirim',
        'Jika email terdaftar, instruksi reset password telah dikirim ke email Anda.',
        snackPosition: SnackPosition.TOP,
        backgroundColor: AppColors.cream,
        colorText: AppColors.darkBrown,
        margin: const EdgeInsets.all(12),
        borderRadius: 12,
        duration: const Duration(seconds: 4),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lupa Password'),
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.brown.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.lock_reset,
                      size: 40,
                      color: AppColors.brown,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                const Text(
                  'Lupa Password',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.darkBrown,
                  ),
                ),
                const SizedBox(height: 8),

                const Text(
                  'Masukkan email yang terdaftar untuk mendapatkan link reset password.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 24),

                if (emailSent) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.check_circle, color: Color(0xFF16A34A), size: 20),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Instruksi reset password telah dikirim ke email Anda jika terdaftar. Silakan periksa inbox atau spam.',
                            style: TextStyle(
                              color: Color(0xFF166534),
                              fontSize: 13,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // EMAIL FIELD
                TextFormField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    prefixIcon: const Icon(Icons.email_outlined),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    final trimmed = (value ?? '').trim();
                    if (trimmed.isEmpty) {
                      return 'Email wajib diisi';
                    }
                    if (!GetUtils.isEmail(trimmed)) {
                      return 'Format email tidak valid';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 20),

                // BUTTON KIRIM LINK
                Obx(
                  () => ElevatedButton(
                    onPressed: authController.isLoading.value ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: authController.isLoading.value
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'Kirim Link Reset Password',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 16),

                // KEMBALI KE LOGIN
                TextButton(
                  onPressed: () => Get.offNamed(Routes.LOGIN),
                  child: const Text('Kembali ke Login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
