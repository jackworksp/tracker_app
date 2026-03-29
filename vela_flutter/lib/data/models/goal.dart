class Goal {
  final int id;
  final int userId;
  final String title;
  final String? description;
  final String category;
  final String status;
  final String? targetDate;
  final int targetHours;
  final String? imageUrl;
  final DateTime? createdAt;

  const Goal({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.category = 'PERSONAL',
    this.status = 'PLANNING',
    this.targetDate,
    this.targetHours = 100,
    this.imageUrl,
    this.createdAt,
  });

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: (json['category'] as String?) ?? 'PERSONAL',
      status: (json['status'] as String?) ?? 'PLANNING',
      targetDate: json['target_date'] as String?,
      targetHours: (json['target_hours'] as int?) ?? 100,
      imageUrl: json['image_url'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'description': description,
      'category': category,
      'status': status,
      'target_date': targetDate,
      'target_hours': targetHours,
      'image_url': imageUrl,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  Goal copyWith({
    int? id,
    int? userId,
    String? title,
    String? description,
    String? category,
    String? status,
    String? targetDate,
    int? targetHours,
    String? imageUrl,
    DateTime? createdAt,
  }) {
    return Goal(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      status: status ?? this.status,
      targetDate: targetDate ?? this.targetDate,
      targetHours: targetHours ?? this.targetHours,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Goal && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Goal(id: $id, title: $title, status: $status)';
}
