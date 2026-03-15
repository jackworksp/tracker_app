class NoteFolder {
  final int id;
  final int userId;
  final String name;
  final int? parentId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const NoteFolder({
    required this.id,
    required this.userId,
    required this.name,
    this.parentId,
    this.createdAt,
    this.updatedAt,
  });

  factory NoteFolder.fromJson(Map<String, dynamic> json) {
    return NoteFolder(
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

  NoteFolder copyWith({
    int? id,
    int? userId,
    String? name,
    int? parentId,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return NoteFolder(
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
      other is NoteFolder && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'NoteFolder(id: $id, name: $name)';
}
