import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/auth_controller.dart';
import '../routes/app_pages.dart';

class RegisterView extends StatelessWidget {
  final authController = Get.find<AuthController>();

  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  RegisterView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: confirmPasswordController,
              decoration: const InputDecoration(labelText: 'Confirm Password'),
              obscureText: true,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                final email = emailController.text.trim();
                final pass = passwordController.text.trim();
                final confirmPass = confirmPasswordController.text.trim();

                if (email.isEmpty || pass.isEmpty) {
                  Get.snackbar(
                    'Error',
                    'Email dan password tidak boleh kosong',
                  );
                  return;
                }

                if (pass != confirmPass) {
                  Get.snackbar(
                    'Error',
                    'Password dan konfirmasi password tidak sama',
                  );
                  return;
                }

                // Kirim ke Supabase
                authController.register(email, pass);
              },
              child: const Text('Register'),
            ),
            TextButton(
              onPressed: () => Get.offNamed(Routes.LOGIN),
              child: const Text("Sudah punya akun? Login"),
            ),
          ],
        ),
      ),
    );
  }
}
