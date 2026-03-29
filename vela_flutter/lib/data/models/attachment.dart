class Attachment {
  final int id;
  final int userId;
  final int? subjectId;
  final int? folderId;
  final String title;
  final String url;
  final String type;
  final String? platform;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Attachment({
    required this.id,
    required this.userId,
    this.subjectId,
    this.folderId,
    required this.title,
    required this.url,
    this.type = 'link',
    this.platform,
    this.createdAt,
    this.updatedAt,
  });

  factory Attachment.fromJson(Map<String, dynamic> json) {
    return Attachment(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      subjectId: json['subject_id'] as int?,
      folderId: json['folder_id'] as int?,
      title: json['title'] as String,
      url: json['url'] as String,
      type: (json['type'] as String?) ?? 'link',
      platform: json['platform'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'subject_id': subjectId,
      'folder_id': folderId,
      'title': title,
      'url': url,
      'type': type,
      'platform': platform,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Attachment copyWith({
    int? id,
    int? userId,
    int? subjectId,
    int? folderId,
    String? title,
    String? url,
    String? type,
    String? platform,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Attachment(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      subjectId: subjectId ?? this.subjectId,
      folderId: folderId ?? this.folderId,
      title: title ?? this.title,
      url: url ?? this.url,
      type: type ?? this.type,
      platform: platform ?? this.platform,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Attachment && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Attachment(id: $id, title: $title, type: $type)';
}
