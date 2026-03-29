import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:share_handler/share_handler.dart';

class AndroidSharePayload {
  AndroidSharePayload({
    required this.sourceAction,
    this.content,
    this.attachments = const [],
  });

  final String sourceAction;
  final String? content;
  final List<SharedAttachment> attachments;

  bool get hasContent => content?.trim().isNotEmpty == true;
  bool get hasAttachments => attachments.isNotEmpty;
  bool get hasPayload => hasContent || hasAttachments;

  SharedMedia toSharedMedia() {
    return SharedMedia(
      content: hasContent ? content : null,
      attachments: attachments,
    );
  }

  static AndroidSharePayload? fromMap(dynamic value) {
    if (value is! Map) return null;

    final raw = Map<Object?, Object?>.from(value);
    final content = (raw['content'] as String?)?.trim();
    final sourceAction = (raw['sourceAction'] as String?) ?? 'UNKNOWN';
    final rawAttachments = raw['attachments'] as List?;

    final attachments = rawAttachments
            ?.whereType<Map>()
            .map((attachment) =>
                _decodeAttachment(Map<Object?, Object?>.from(attachment)))
            .whereType<SharedAttachment>()
            .toList() ??
        const <SharedAttachment>[];

    final payload = AndroidSharePayload(
      sourceAction: sourceAction,
      content: content?.isEmpty == true ? null : content,
      attachments: attachments,
    );

    return payload.hasPayload ? payload : null;
  }

  static SharedAttachment? _decodeAttachment(Map<Object?, Object?> raw) {
    final path = raw['path'] as String?;
    final typeName = (raw['type'] as String?) ?? 'file';
    if (path == null || path.isEmpty) return null;

    return SharedAttachment(
      path: path,
      type: switch (typeName) {
        'image' => SharedAttachmentType.image,
        'video' => SharedAttachmentType.video,
        'audio' => SharedAttachmentType.audio,
        _ => SharedAttachmentType.file,
      },
    );
  }
}

class AndroidShareBridge {
  AndroidShareBridge._();

  static const MethodChannel _methodChannel =
      MethodChannel('vela/share_fallback');
  static const EventChannel _eventChannel =
      EventChannel('vela/share_fallback/events');

  static Future<AndroidSharePayload?> getInitialSharedPayload() async {
    if (!Platform.isAndroid) return null;

    try {
      final payload = await _methodChannel.invokeMethod<dynamic>(
        'getInitialSharedPayload',
      );
      return AndroidSharePayload.fromMap(payload);
    } catch (_) {
      return null;
    }
  }

  static Stream<AndroidSharePayload> get sharedPayloadStream {
    if (!Platform.isAndroid) return const Stream<AndroidSharePayload>.empty();

    return _eventChannel
        .receiveBroadcastStream()
        .map(AndroidSharePayload.fromMap)
        .where((payload) => payload != null)
        .cast<AndroidSharePayload>();
  }
}

class SharePayloadStore {
  SharePayloadStore._();

  static final SharePayloadStore instance = SharePayloadStore._();

  final StreamController<SharedMedia> _controller =
      StreamController<SharedMedia>.broadcast();

  SharedMedia? _currentMedia;
  String? _lastSignature;

  SharedMedia? get currentMedia => _currentMedia;
  Stream<SharedMedia> get stream => _controller.stream;
  bool get hasPayload => _hasPayload(_currentMedia);

  bool setFromSharedMedia(SharedMedia? media) {
    if (!_hasPayload(media)) return false;
    return _store(media!);
  }

  bool setFromAndroidPayload(AndroidSharePayload? payload) {
    if (payload?.hasPayload != true) return false;
    return _store(payload!.toSharedMedia());
  }

  void clear() {
    _currentMedia = null;
    _lastSignature = null;
  }

  bool _store(SharedMedia media) {
    final signature = _signatureFor(media);
    if (signature == _lastSignature) return false;

    _currentMedia = media;
    _lastSignature = signature;
    _controller.add(media);
    return true;
  }

  bool _hasPayload(SharedMedia? media) {
    if (media == null) return false;
    return media.content?.trim().isNotEmpty == true ||
        media.attachments?.isNotEmpty == true;
  }

  String _signatureFor(SharedMedia media) {
    final attachmentPaths = media.attachments
            ?.whereType<SharedAttachment>()
            .map((attachment) => attachment.path)
            .join('|') ??
        '';
    return '${media.content ?? ''}::$attachmentPaths';
  }
}
