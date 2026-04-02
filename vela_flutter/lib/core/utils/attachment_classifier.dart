class AttachmentClassification {
  final String kind;
  final String? platform;

  const AttachmentClassification({
    required this.kind,
    this.platform,
  });
}

class AttachmentClassifier {
  static const Set<String> _documentHosts = {
    'docs.google.com',
    'drive.google.com',
  };

  static const Set<String> _imageExtensions = {
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'bmp',
    'svg',
  };

  static AttachmentClassification classify({
    String? url,
    String? type,
    Map<String, dynamic>? metadata,
  }) {
    final normalizedUrl = (url ?? '').trim().toLowerCase();
    final normalizedType = (type ?? '').trim().toLowerCase();
    final metadataPlatform =
        _normalizePlatform(metadata?['platform'] as String?);
    final attachmentType =
        (metadata?['attachment_type'] as String?)?.trim().toLowerCase();

    final platform = metadataPlatform ?? _platformFromUrl(normalizedUrl);

    if (platform == 'youtube') {
      return const AttachmentClassification(
          kind: 'youtube', platform: 'youtube');
    }

    if (platform == 'instagram') {
      return const AttachmentClassification(
        kind: 'instagram',
        platform: 'instagram',
      );
    }

    if (_isDocument(
      normalizedUrl: normalizedUrl,
      normalizedType: normalizedType,
      attachmentType: attachmentType,
    )) {
      return AttachmentClassification(kind: 'document', platform: platform);
    }

    if (_isImage(
      normalizedUrl: normalizedUrl,
      normalizedType: normalizedType,
      attachmentType: attachmentType,
    )) {
      return AttachmentClassification(kind: 'image', platform: platform);
    }

    return AttachmentClassification(kind: 'link', platform: platform);
  }

  static String? _platformFromUrl(String url) {
    if (url.contains('youtube.com') || url.contains('youtu.be')) {
      return 'youtube';
    }
    if (url.contains('instagram.com')) {
      return 'instagram';
    }
    if (url.contains('docs.google.com') || url.contains('drive.google.com')) {
      return 'google_drive';
    }
    if (url.contains('github.com')) {
      return 'github';
    }
    return null;
  }

  static String? _normalizePlatform(String? platform) {
    final normalized = platform?.trim().toLowerCase();
    if (normalized == null || normalized.isEmpty) return null;
    if (normalized == 'google-drive') return 'google_drive';
    return normalized;
  }

  static bool _isDocument({
    required String normalizedUrl,
    required String normalizedType,
    required String? attachmentType,
  }) {
    if (normalizedType == 'pdf' || normalizedType == 'document') return true;
    if (attachmentType == 'pdf' || attachmentType == 'document') return true;
    if (normalizedUrl.contains('.pdf')) return true;
    return _documentHosts.any(normalizedUrl.contains);
  }

  static bool _isImage({
    required String normalizedUrl,
    required String normalizedType,
    required String? attachmentType,
  }) {
    if (normalizedType == 'image') return true;
    if (attachmentType == 'image') return true;
    return _imageExtensions.any(
      (ext) => RegExp('\\.$ext(\\?|#|\$)', caseSensitive: false)
          .hasMatch(normalizedUrl),
    );
  }
}
