class Note {
  final int id;
  final int userId;
  final int? folderId;
  final int? subjectId;
  final String title;
  final String? content;
  final List<String> tags;
  final bool isPinned;
  final String color;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Note({
    required this.id,
    required this.userId,
    this.folderId,
    this.subjectId,
    required this.title,
    this.content,
    this.tags = const [],
    this.isPinned = false,
    this.color = '#ffffff',
    this.createdAt,
    this.updatedAt,
  });

  factory Note.fromJson(Map<String, dynamic> json) {
    return Note(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      folderId: json['folder_id'] as int?,
      subjectId: json['subject_id'] as int?,
      title: json['title'] as String,
      content: json['content'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      isPinned: (json['is_pinned'] as bool?) ?? false,
      color: (json['color'] as String?) ?? '#ffffff',
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'folder_id': folderId,
      'subject_id': subjectId,
      'title': title,
      'content': content,
      'tags': tags,
      'is_pinned': isPinned,
      'color': color,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Note copyWith({
    int? id,
    int? userId,
    int? folderId,
    int? subjectId,
    String? title,
    String? content,
    List<String>? tags,
    bool? isPinned,
    String? color,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Note(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      folderId: folderId ?? this.folderId,
      subjectId: subjectId ?? this.subjectId,
      title: title ?? this.title,
      content: content ?? this.content,
      tags: tags ?? this.tags,
      isPinned: isPinned ?? this.isPinned,
      color: color ?? this.color,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Note && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Note(id: $id, title: $title)';
}
