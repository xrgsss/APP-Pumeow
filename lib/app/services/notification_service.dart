import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final FlutterLocalNotificationsPlugin _localNotifications =
    FlutterLocalNotificationsPlugin();

const AndroidNotificationChannel _defaultChannel = AndroidNotificationChannel(
  'default_channel',
  'Notifikasi Default',
  importance: Importance.high,
);

Future<void> _showLocal(RemoteMessage message) =>
    NotificationService.showLocal(message);

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  await _showLocal(message);
}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // Android notification channel for heads-up notifications
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_defaultChannel);

    // Request permission (required on iOS/Android 13+)
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // Log token (useful for testing push via Firebase console)
    final token = await _messaging.getToken();
    debugPrint('FCM token: $token');

    // FCM listeners
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    FirebaseMessaging.onMessage.listen(_showLocal);
    FirebaseMessaging.onMessageOpenedApp.listen(_showLocal);
  }

  static Future<void> showLocal(RemoteMessage message) async {
    final notification = message.notification;
    final title = notification?.title ?? message.data['title'] ?? 'Notifikasi';
    final body = notification?.body ?? message.data['body'] ?? 'Pesan baru';

    await _localNotifications.show(
      notification.hashCode,
      title,
      body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _defaultChannel.id,
          _defaultChannel.name,
          channelDescription: 'Notifikasi push dari Firebase',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: message.messageId,
    );
  }

  static Future<void> showSampleNotification() async {
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      'Contoh Notifikasi',
      'Ini contoh notifikasi lokal dari aplikasi.',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _defaultChannel.id,
          _defaultChannel.name,
          channelDescription: 'Notifikasi push dari Firebase',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }
}
