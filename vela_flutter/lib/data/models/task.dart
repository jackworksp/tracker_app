class Task {
  final int id;
  final int userId;
  final int? subjectId;
  final int? goalId;
  final int? parentTaskId;
  final String type;
  final String title;
  final String? url;
  final String? content;
  final bool completed;
  final String status;
  final List<String> tags;
  final int? rating;
  final DateTime? reminderTime;
  final String? alertType;
  final DateTime? reminderSnoozedUntil;
  final bool reminderDismissed;
  final String? attachmentUrl;
  final int? folderId;
  final List<dynamic> subtasks;
  final List<dynamic> resources;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Task({
    required this.id,
    required this.userId,
    this.subjectId,
    this.goalId,
    this.parentTaskId,
    this.type = 'TASK',
    required this.title,
    this.url,
    this.content,
    this.completed = false,
    this.status = 'TODO',
    this.tags = const [],
    this.rating,
    this.reminderTime,
    this.alertType = 'basic',
    this.reminderSnoozedUntil,
    this.reminderDismissed = false,
    this.attachmentUrl,
    this.folderId,
    this.subtasks = const [],
    this.resources = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      subjectId: json['subject_id'] as int?,
      goalId: json['goal_id'] as int?,
      parentTaskId: json['parent_task_id'] as int?,
      type: (json['type'] as String?) ?? 'TASK',
      title: json['title'] as String,
      url: json['url'] as String?,
      content: json['content'] as String?,
      completed: (json['completed'] as bool?) ?? false,
      status: (json['status'] as String?) ?? 'TODO',
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      rating: json['rating'] as int?,
      reminderTime: json['reminder_time'] != null ? DateTime.parse(json['reminder_time']) : null,
      alertType: (json['alert_type'] as String?) ?? 'basic',
      reminderSnoozedUntil: json['reminder_snoozed_until'] != null ? DateTime.parse(json['reminder_snoozed_until']) : null,
      reminderDismissed: (json['reminder_dismissed'] as bool?) ?? false,
      attachmentUrl: json['attachment_url'] as String?,
      folderId: json['folder_id'] as int?,
      subtasks: (json['subtasks'] as List<dynamic>?) ?? [],
      resources: (json['resources'] as List<dynamic>?) ?? [],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'subject_id': subjectId,
      'goal_id': goalId,
      'parent_task_id': parentTaskId,
      'type': type,
      'title': title,
      'url': url,
      'content': content,
      'completed': completed,
      'status': status,
      'tags': tags,
      'rating': rating,
      'reminder_time': reminderTime?.toIso8601String(),
      'alert_type': alertType,
      'reminder_snoozed_until': reminderSnoozedUntil?.toIso8601String(),
      'reminder_dismissed': reminderDismissed,
      'attachment_url': attachmentUrl,
      'folder_id': folderId,
      'subtasks': subtasks,
      'resources': resources,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }

  Task copyWith({
    int? id,
    int? userId,
    int? subjectId,
    int? goalId,
    int? parentTaskId,
    String? type,
    String? title,
    String? url,
    String? content,
    bool? completed,
    String? status,
    List<String>? tags,
    int? rating,
    DateTime? reminderTime,
    String? alertType,
    DateTime? reminderSnoozedUntil,
    bool? reminderDismissed,
    String? attachmentUrl,
    int? folderId,
    List<dynamic>? subtasks,
    List<dynamic>? resources,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Task(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      subjectId: subjectId ?? this.subjectId,
      goalId: goalId ?? this.goalId,
      parentTaskId: parentTaskId ?? this.parentTaskId,
      type: type ?? this.type,
      title: title ?? this.title,
      url: url ?? this.url,
      content: content ?? this.content,
      completed: completed ?? this.completed,
      status: status ?? this.status,
      tags: tags ?? this.tags,
      rating: rating ?? this.rating,
      reminderTime: reminderTime ?? this.reminderTime,
      alertType: alertType ?? this.alertType,
      reminderSnoozedUntil: reminderSnoozedUntil ?? this.reminderSnoozedUntil,
      reminderDismissed: reminderDismissed ?? this.reminderDismissed,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      folderId: folderId ?? this.folderId,
      subtasks: subtasks ?? this.subtasks,
      resources: resources ?? this.resources,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Task && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() => 'Task(id: $id, title: $title, status: $status)';
}
