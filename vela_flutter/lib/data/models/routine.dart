class Routine {
  final int id;
  final int userId;
  final String title;
  final String? description;
  final String frequency;
  final String category;
  final String color;
  final bool active;
  final int streak;
  final bool isCompletedToday;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Routine({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.frequency = 'DAILY',
    this.category = 'GENERAL',
    this.color = 'blue',
    this.active = true,
    this.streak = 0,
    this.isCompletedToday = false,
    this.createdAt,
    this.updatedAt,
  });

  factory Routine.fromJson(Map<String, dynamic> json) {
    return Routine(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      frequency: (json['frequency'] as String?) ?? 'DAILY',
      category: (json['category'] as String?) ?? 'GENERAL',
      color: (json['color'] as String?) ?? 'blue',
      active: (json['active'] as bool?) ?? true,
      streak: (json['streak'] as int?) ?? 0,
      isCompletedToday: (json['is_completed_today'] as bool?) ?? false,
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
      'title': title,
      'description': description,
      'frequency': frequency,
      'category': category,
      'color': color,
      'active': active,
      'streak': streak,
      'is_completed_today': isCompletedToday,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Routine copyWith({
    int? id,
    int? userId,
    String? title,
    String? description,
    String? frequency,
    String? category,
    String? color,
    bool? active,
    int? streak,
    bool? isCompletedToday,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Routine(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      frequency: frequency ?? this.frequency,
      category: category ?? this.category,
      color: color ?? this.color,
      active: active ?? this.active,
      streak: streak ?? this.streak,
      isCompletedToday: isCompletedToday ?? this.isCompletedToday,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
