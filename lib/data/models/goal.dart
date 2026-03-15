class Goal {
  final int id;
  final int userId;
  final int? subjectId;
  final String title;
  final String? description;
  final String category;
  final String status;
  final String? targetDate;
  final int targetHours;
  final int progress;
  final List<dynamic> tasks;
  final String? imageUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Goal({
    required this.id,
    required this.userId,
    this.subjectId,
    required this.title,
    this.description,
    this.category = 'PERSONAL',
    this.status = 'PLANNING',
    this.targetDate,
    this.targetHours = 100,
    this.progress = 0,
    this.tasks = const [],
    this.imageUrl,
    this.createdAt,
    this.updatedAt,
  });

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      subjectId: json['subject_id'] as int?,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: (json['category'] as String?) ?? 'PERSONAL',
      status: (json['status'] as String?) ?? 'PLANNING',
      targetDate: json['target_date'] as String?,
      targetHours: (json['target_hours'] as int?) ?? 100,
      progress: (json['progress'] as int?) ?? 0,
      tasks: (json['tasks'] as List<dynamic>?) ?? [],
      imageUrl: json['image_url'] as String?,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'subject_id': subjectId,
      'title': title,
      'description': description,
      'category': category,
      'status': status,
      'target_date': targetDate,
      'target_hours': targetHours,
      'progress': progress,
      'tasks': tasks,
      'image_url': imageUrl,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Goal copyWith({
    int? id,
    int? userId,
    int? subjectId,
    String? title,
    String? description,
    String? category,
    String? status,
    String? targetDate,
    int? targetHours,
    int? progress,
    List<dynamic>? tasks,
    String? imageUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Goal(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      subjectId: subjectId ?? this.subjectId,
      title: title ?? this.title,
      description: description ?? this.description,
      category: category ?? this.category,
      status: status ?? this.status,
      targetDate: targetDate ?? this.targetDate,
      targetHours: targetHours ?? this.targetHours,
      progress: progress ?? this.progress,
      tasks: tasks ?? this.tasks,
      imageUrl: imageUrl ?? this.imageUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
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
