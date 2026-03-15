class AttachmentFolder {
  final int id;
  final int userId;
  final String name;
  final int? parentId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const AttachmentFolder({
    required this.id,
    required this.userId,
    required this.name,
    this.parentId,
    this.createdAt,
    this.updatedAt,
  });

  factory AttachmentFolder.fromJson(Map<String, dynamic> json) {
    return AttachmentFolder(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      name: json['name'] as String,
      parentId: json['parent_id'] as int?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'parent_id': parentId,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  AttachmentFolder copyWith({
    int? id,
    int? userId,
    String? name,
    int? parentId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return AttachmentFolder(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      parentId: parentId ?? this.parentId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AttachmentFolder && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'AttachmentFolder(id: $id, name: $name)';
}
