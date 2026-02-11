import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../controllers/location_controller.dart';
import '../routes/app_pages.dart';

class MapView extends StatelessWidget {
  MapView({super.key});

  final LocationController locationController = Get.find<LocationController>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lokasi Saya')),
      body: Obx(() {
        if (locationController.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        return Stack(
          children: [
            FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(
                  locationController.latitude.value,
                  locationController.longitude.value,
                ),
                initialZoom: 15,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.example.pumeow_v3',
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(
                        locationController.latitude.value,
                        locationController.longitude.value,
                      ),
                      width: 40,
                      height: 40,
                      child: const Icon(
                        Icons.location_pin,
                        color: Colors.red,
                        size: 40,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            Positioned(
              right: 16,
              bottom: 90,
              child: FloatingActionButton(
                heroTag: 'fab-location',
                child: const Icon(Icons.my_location),
                onPressed: () {
                  locationController.getCurrentLocation();
                },
              ),
            ),
            Positioned(
              left: 16,
              right: 16,
              bottom: 16,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () {
                  if (locationController.isLoading.value) {
                    Get.snackbar('Lokasi', 'Sedang memuat lokasi...');
                    return;
                  }
                  Get.toNamed(
                    Routes.PAYMENT_METHOD,
                    arguments: {
                      'lat': locationController.latitude.value,
                      'lng': locationController.longitude.value,
                      'address': locationController.address.value,
                    },
                  );
                },
                icon: const Icon(Icons.flag),
                label: const Text('Konfirmasi Lokasi & Pilih Pembayaran'),
              ),
            ),
          ],
        );
      }),
    );
  }
}
