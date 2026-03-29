import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../core/utils/error_messages.dart';
import '../data/repositories/attachments_repository.dart';
import 'auth_provider.dart';

final attachmentsRepositoryProvider = Provider<AttachmentsRepository>((ref) {
  return AttachmentsRepository(ref.watch(dioClientProvider));
});

class Attachment {
  final String id; // String like 'attachment-123', 'task-456'
  final String type; // 'url' or 'note'
  final String source; // 'standalone', 'task', 'session'
  final int? sourceId;
  final String title;
  final String? url;
  final int? subjectId;
  final String? subjectName;
  final int? folderId;
  final String? folderName;
  final Map<String, dynamic>? metadata;
  final DateTime? createdAt;

  const Attachment({
    required this.id,
    this.type = 'url',
    this.source = 'standalone',
    this.sourceId,
    required this.title,
    this.url,
    this.subjectId,
    this.subjectName,
    this.folderId,
    this.folderName,
    this.metadata,
    this.createdAt,
  });

  String? get platform {
    if (metadata != null && metadata!['platform'] != null) {
      return metadata!['platform'] as String?;
    }
    if (url == null) return null;
    final u = url!.toLowerCase();
    if (u.contains('youtube.com') || u.contains('youtu.be')) return 'youtube';
    if (u.contains('github.com')) return 'github';
    if (u.contains('drive.google.com') || u.contains('docs.google.com'))
      return 'google_drive';
    if (u.contains('instagram.com')) return 'instagram';
    return null;
  }

  factory Attachment.fromJson(Map<String, dynamic> json) {
    return Attachment(
      id: json['id'].toString(),
      type: (json['type'] as String?) ?? 'url',
      source: (json['source'] as String?) ?? 'standalone',
      sourceId: json['source_id'] as int?,
      title: (json['title'] as String?) ?? '',
      url: json['url'] as String?,
      subjectId: json['subject_id'] as int?,
      subjectName: json['subject_name'] as String?,
      folderId: json['folder_id'] as int?,
      folderName: json['folder_name'] as String?,
      metadata: json['metadata'] is Map
          ? Map<String, dynamic>.from(json['metadata'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Attachment && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Attachment(id: $id, title: $title)';
}

class AttachmentsState {
  final List<Attachment> attachments;
  final int currentPage;
  final int totalPages;
  final int totalCount;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic> filters;

  const AttachmentsState({
    this.attachments = const [],
    this.currentPage = 1,
    this.totalPages = 1,
    this.totalCount = 0,
    this.isLoading = false,
    this.error,
    this.filters = const {},
  });

  AttachmentsState copyWith({
    List<Attachment>? attachments,
    int? currentPage,
    int? totalPages,
    int? totalCount,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? filters,
  }) {
    return AttachmentsState(
      attachments: attachments ?? this.attachments,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      totalCount: totalCount ?? this.totalCount,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      filters: filters ?? this.filters,
    );
  }

  bool get hasNextPage => currentPage < totalPages;
  bool get hasPreviousPage => currentPage > 1;
}

class AttachmentsNotifier extends StateNotifier<AttachmentsState> {
  final AttachmentsRepository _repository;

  AttachmentsNotifier(this._repository) : super(const AttachmentsState());

  Future<void> loadAttachments({
    Map<String, dynamic>? filters,
    int page = 1,
  }) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      filters: filters ?? state.filters,
    );
    try {
      final response = await _repository.getAll(
        filters: filters ?? state.filters,
        page: page,
      );

      final list = (response['data'] as List?) ?? [];
      final attachments = list
          .map((json) => Attachment.fromJson(Map<String, dynamic>.from(json)))
          .toList();

      final pagination = response['pagination'] as Map<String, dynamic>? ?? {};

      state = state.copyWith(
        attachments: attachments,
        currentPage: (pagination['page'] as int?) ?? page,
        totalPages: (pagination['totalPages'] as int?) ?? 1,
        totalCount: (pagination['total'] as int?) ?? attachments.length,
        isLoading: false,
      );
    } on DioException catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.message ?? ErrorMessages.attachmentLoadFailed,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: ErrorMessages.attachmentLoadFailed,
      );
    }
  }

  Future<Attachment> createAttachment(Map<String, dynamic> data) async {
    final json = await _repository.create(data);
    final attachment = Attachment.fromJson(json);
    state = state.copyWith(
      attachments: [attachment, ...state.attachments],
      totalCount: state.totalCount + 1,
    );
    return attachment;
  }

  Future<void> deleteAttachment(String id) async {
    // Parse the actual numeric ID from the composite string ID
    // Format: 'attachment-123', 'task-456', etc.
    final parts = id.split('-');
    final numericId = int.tryParse(parts.last) ?? 0;
    await _repository.delete(numericId);
    state = state.copyWith(
      attachments: state.attachments.where((a) => a.id != id).toList(),
      totalCount: state.totalCount - 1,
    );
  }

  Future<void> moveToSubject(String attachmentId, int? subjectId) async {
    await _repository.moveToSubject(attachmentId, subjectId);
    await loadAttachments(filters: state.filters, page: 1);
  }
}

final attachmentsProvider =
    StateNotifierProvider<AttachmentsNotifier, AttachmentsState>((ref) {
  return AttachmentsNotifier(ref.watch(attachmentsRepositoryProvider));
});
