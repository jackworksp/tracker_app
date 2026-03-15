import 'package:url_launcher/url_launcher.dart';

class LinkUtils {
  static Future<void> openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  static String? extractYoutubeId(String url) {
    final regex = RegExp(
      r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
    );
    final match = regex.firstMatch(url);
    return match?.group(1);
  }

  static bool isYoutubeUrl(String url) {
    return extractYoutubeId(url) != null;
  }

  static String getYoutubeThumbnail(String videoId) {
    return 'https://img.youtube.com/vi/$videoId/hqdefault.jpg';
  }

  static String? detectPlatform(String url) {
    if (url.contains('youtube.com') || url.contains('youtu.be')) return 'youtube';
    if (url.contains('github.com')) return 'github';
    if (url.contains('stackoverflow.com')) return 'stackoverflow';
    if (url.contains('medium.com')) return 'medium';
    if (url.contains('dev.to')) return 'dev.to';
    return null;
  }
}
