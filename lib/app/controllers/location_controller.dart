import 'package:get/get.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

class LocationController extends GetxController {
  // STATE
  var latitude = 0.0.obs;
  var longitude = 0.0.obs;
  var address = ''.obs;
  var isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    getCurrentLocation();
  }

  Future<void> getCurrentLocation() async {
    try {
      isLoading.value = true;

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        Get.snackbar('Error', 'GPS tidak aktif');
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          Get.snackbar('Error', 'Izin lokasi ditolak');
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        Get.snackbar(
          'Error',
          'Izin lokasi ditolak permanen, aktifkan di setting',
        );
        return;
      }

      final Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      latitude.value = position.latitude;
      longitude.value = position.longitude;
      await _resolveAddress(position.latitude, position.longitude);
    } catch (e) {
      Get.snackbar('Error', e.toString());
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _resolveAddress(double lat, double lng) async {
    try {
      final placemarks = await placemarkFromCoordinates(lat, lng);
      if (placemarks.isNotEmpty) {
        final p = placemarks.first;
        final parts = [
          if (p.subLocality != null && p.subLocality!.isNotEmpty)
            p.subLocality,
          if (p.locality != null && p.locality!.isNotEmpty) p.locality,
          if (p.subAdministrativeArea != null &&
              p.subAdministrativeArea!.isNotEmpty)
            p.subAdministrativeArea,
          if (p.administrativeArea != null && p.administrativeArea!.isNotEmpty)
            p.administrativeArea,
          if (p.country != null && p.country!.isNotEmpty) p.country,
        ];
        address.value = parts.join(', ');
      }
    } catch (_) {
      // ignore if reverse geocode fails
    }
  }
}
