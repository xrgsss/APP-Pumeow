import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../controllers/auth_controller.dart';
import '../routes/app_pages.dart';
import '../theme/app_colors.dart';

class ResetPasswordView extends StatefulWidget {
  const ResetPasswordView({super.key});

  @override
  State<ResetPasswordView> createState() => _ResetPasswordViewState();
}

class _ResetPasswordViewState extends State<ResetPasswordView> {
  final AuthController authController = Get.find<AuthController>();
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    if (!_formKey.currentState!.validate()) return;

    final newPass = newPasswordController.text.trim();
    final success = await authController.updatePassword(newPass);

    if (success) {
      Get.offAllNamed(Routes.LOGIN);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reset Password'),
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
                      Icons.vpn_key,
                      size: 38,
                      color: AppColors.brown,
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                const Text(
                  'Password Baru',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.darkBrown,
                  ),
                ),
                const SizedBox(height: 8),

                const Text(
                  'Silakan masukkan password baru untuk akun Anda.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 28),

                // PASSWORD BARU
                TextFormField(
                  controller: newPasswordController,
                  obscureText: _obscureNew,
                  decoration: InputDecoration(
                    labelText: 'Password Baru',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureNew ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscureNew = !_obscureNew),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    final trimmed = (value ?? '').trim();
                    if (trimmed.isEmpty) {
                      return 'Password baru wajib diisi';
                    }
                    if (trimmed.length < 6) {
                      return 'Password minimal 6 karakter';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // KONFIRMASI PASSWORD
                TextFormField(
                  controller: confirmPasswordController,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'Konfirmasi Password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirm ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    final trimmed = (value ?? '').trim();
                    if (trimmed.isEmpty) {
                      return 'Konfirmasi password wajib diisi';
                    }
                    if (trimmed != newPasswordController.text.trim()) {
                      return 'Konfirmasi password tidak cocok';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),

                // BUTTON RESET PASSWORD
                Obx(
                  () => ElevatedButton(
                    onPressed: authController.isLoading.value ? null : _handleReset,
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
                            'Reset Password',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 16),

                TextButton(
                  onPressed: () => Get.offNamed(Routes.LOGIN),
                  child: const Text('Batal dan Kembali ke Login'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
