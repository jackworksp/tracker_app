import 'package:url_launcher/url_launcher.dart';

class LinkUtils {
  static String resolveUrl(String url) {
    if (url.isEmpty) return url;

    try {
      final uri = Uri.parse(url);
      final host = uri.host.toLowerCase();
      if (host == 'www.instagram.com' || host == 'instagram.com') {
        final match =
            RegExp(r'^/(reel|p)/([A-Za-z0-9_-]+)').firstMatch(uri.path);
        if (match != null) {
          final code = match.group(2);
          if (code != null && code.isNotEmpty) {
            return 'https://imginn.com/p/$code/';
          }
        }
      }
    } catch (_) {
      // Invalid URL — fall through and return as-is.
    }

    return url;
  }

  static Future<void> openUrl(String url) async {
    final uri = Uri.parse(resolveUrl(url));
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // URL could not be launched
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
    if (url.contains('youtube.com') || url.contains('youtu.be'))
      return 'youtube';
    if (url.contains('github.com')) return 'github';
    if (url.contains('stackoverflow.com')) return 'stackoverflow';
    if (url.contains('medium.com')) return 'medium';
    if (url.contains('dev.to')) return 'dev.to';
    return null;
  }
}
