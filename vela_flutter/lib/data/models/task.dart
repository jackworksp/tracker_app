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
  final String? priority;
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
    this.priority,
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
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
              [],
      priority: json['priority'] as String?,
      rating: json['rating'] as int?,
      reminderTime: json['reminder_time'] != null
          ? DateTime.parse(json['reminder_time'])
          : null,
      alertType: (json['alert_type'] as String?) ?? 'basic',
      reminderSnoozedUntil: json['reminder_snoozed_until'] != null
          ? DateTime.parse(json['reminder_snoozed_until'])
          : null,
      reminderDismissed: (json['reminder_dismissed'] as bool?) ?? false,
      attachmentUrl: json['attachment_url'] as String?,
      folderId: json['folder_id'] as int?,
      subtasks: (json['subtasks'] as List<dynamic>?) ?? [],
      resources: (json['resources'] as List<dynamic>?) ?? [],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{
      'id': id,
      'user_id': userId,
      'type': type,
      'title': title,
      'completed': completed,
      'status': status,
      'tags': tags,
      'alert_type': alertType,
      'reminder_dismissed': reminderDismissed,
      'subtasks': subtasks,
      'resources': resources,
    };
    if (subjectId != null) json['subject_id'] = subjectId;
    if (goalId != null) json['goal_id'] = goalId;
    if (parentTaskId != null) json['parent_task_id'] = parentTaskId;
    if (url != null) json['url'] = url;
    if (content != null) json['content'] = content;
    if (priority != null) json['priority'] = priority;
    if (rating != null) json['rating'] = rating;
    if (reminderTime != null)
      json['reminder_time'] = reminderTime!.toIso8601String();
    if (reminderSnoozedUntil != null) {
      json['reminder_snoozed_until'] = reminderSnoozedUntil!.toIso8601String();
    }
    if (attachmentUrl != null) json['attachment_url'] = attachmentUrl;
    if (folderId != null) json['folder_id'] = folderId;
    if (createdAt != null) json['created_at'] = createdAt!.toIso8601String();
    if (updatedAt != null) json['updated_at'] = updatedAt!.toIso8601String();
    return json;
  }

  // Sentinel object used by [copyWith] to distinguish "pass null explicitly"
  // from "not provided" for nullable fields that may need to be cleared.
  static const Object _unset = Object();

  Task copyWith({
    int? id,
    int? userId,
    Object? subjectId = _unset,
    Object? goalId = _unset,
    Object? parentTaskId = _unset,
    String? type,
    String? title,
    String? url,
    String? content,
    bool? completed,
    String? status,
    List<String>? tags,
    String? priority,
    int? rating,
    // Use Object? + _unset sentinel so callers can pass null to clear these.
    Object? reminderTime = _unset,
    String? alertType,
    Object? reminderSnoozedUntil = _unset,
    bool? reminderDismissed,
    String? attachmentUrl,
    Object? folderId = _unset,
    List<dynamic>? subtasks,
    List<dynamic>? resources,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Task(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      subjectId:
          identical(subjectId, _unset) ? this.subjectId : subjectId as int?,
      goalId: identical(goalId, _unset) ? this.goalId : goalId as int?,
      parentTaskId: identical(parentTaskId, _unset)
          ? this.parentTaskId
          : parentTaskId as int?,
      type: type ?? this.type,
      title: title ?? this.title,
      url: url ?? this.url,
      content: content ?? this.content,
      completed: completed ?? this.completed,
      status: status ?? this.status,
      tags: tags ?? this.tags,
      priority: priority ?? this.priority,
      rating: rating ?? this.rating,
      reminderTime: identical(reminderTime, _unset)
          ? this.reminderTime
          : reminderTime as DateTime?,
      alertType: alertType ?? this.alertType,
      reminderSnoozedUntil: identical(reminderSnoozedUntil, _unset)
          ? this.reminderSnoozedUntil
          : reminderSnoozedUntil as DateTime?,
      reminderDismissed: reminderDismissed ?? this.reminderDismissed,
      attachmentUrl: attachmentUrl ?? this.attachmentUrl,
      folderId: identical(folderId, _unset) ? this.folderId : folderId as int?,
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
