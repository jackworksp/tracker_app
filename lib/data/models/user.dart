import 'dart:convert';

class User {
  final int id;
  final String userId;
  final String? name;
  final int? activeSubjectId;
  final String? profilePhotoUrl;
  final String? mcpApiKey;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const User({
    required this.id,
    required this.userId,
    this.name,
    this.activeSubjectId,
    this.profilePhotoUrl,
    this.mcpApiKey,
    this.createdAt,
    this.updatedAt,
  });

  String get email => userId;

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      userId: json['user_id'] as String,
      name: json['name'] as String?,
      activeSubjectId: json['active_subject_id'] as int?,
      profilePhotoUrl: json['profile_photo_url'] as String?,
      mcpApiKey: json['mcp_api_key'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'active_subject_id': activeSubjectId,
      'profile_photo_url': profilePhotoUrl,
      'mcp_api_key': mcpApiKey,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  User copyWith({
    int? id,
    String? userId,
    String? name,
    int? activeSubjectId,
    String? profilePhotoUrl,
    String? mcpApiKey,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      activeSubjectId: activeSubjectId ?? this.activeSubjectId,
      profilePhotoUrl: profilePhotoUrl ?? this.profilePhotoUrl,
      mcpApiKey: mcpApiKey ?? this.mcpApiKey,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String toJsonString() => jsonEncode(toJson());

  static User fromJsonString(String json) => User.fromJson(jsonDecode(json));

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'User(id: $id, name: $name, userId: $userId)';
}
