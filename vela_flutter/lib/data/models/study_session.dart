class StudySession {
  final int id;
  final int? subjectId;
  final int? goalId;
  final String date;
  final String? day;
  final String? activity;
  final int timeSpent;
  final String? topicsCovered;
  final String? notes;
  final int revisionCount;
  final String type;
  final String? url;
  final int? folderId;
  final DateTime? createdAt;
  final int attachmentCount;

  const StudySession({
    required this.id,
    this.subjectId,
    this.goalId,
    required this.date,
    this.day,
    this.activity,
    this.timeSpent = 0,
    this.topicsCovered,
    this.notes,
    this.revisionCount = 0,
    this.type = 'STUDY',
    this.url,
    this.folderId,
    this.createdAt,
    this.attachmentCount = 0,
  });

  factory StudySession.fromJson(Map<String, dynamic> json) {
    return StudySession(
      id: json['id'] as int,
      subjectId: json['subject_id'] as int?,
      goalId: json['goal_id'] as int?,
      date: json['date'] as String,
      day: json['day'] as String?,
      activity: json['activity'] as String?,
      timeSpent: (json['time_spent'] as int?) ?? 0,
      topicsCovered: json['topics_covered'] as String?,
      notes: json['notes'] as String?,
      revisionCount: (json['revision_count'] as int?) ?? 0,
      type: (json['type'] as String?) ?? 'STUDY',
      url: json['url'] as String?,
      folderId: json['folder_id'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      attachmentCount: (json['attachment_count'] as int?) ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'subject_id': subjectId,
      'goal_id': goalId,
      'date': date,
      'day': day,
      'activity': activity,
      'time_spent': timeSpent,
      'topics_covered': topicsCovered,
      'notes': notes,
      'revision_count': revisionCount,
      'type': type,
      'url': url,
      'folder_id': folderId,
      'created_at': createdAt?.toIso8601String(),
      'attachment_count': attachmentCount,
    };
  }

  StudySession copyWith({
    int? id,
    int? subjectId,
    int? goalId,
    String? date,
    String? day,
    String? activity,
    int? timeSpent,
    String? topicsCovered,
    String? notes,
    int? revisionCount,
    String? type,
    String? url,
    int? folderId,
    DateTime? createdAt,
    int? attachmentCount,
  }) {
    return StudySession(
      id: id ?? this.id,
      subjectId: subjectId ?? this.subjectId,
      goalId: goalId ?? this.goalId,
      date: date ?? this.date,
      day: day ?? this.day,
      activity: activity ?? this.activity,
      timeSpent: timeSpent ?? this.timeSpent,
      topicsCovered: topicsCovered ?? this.topicsCovered,
      notes: notes ?? this.notes,
      revisionCount: revisionCount ?? this.revisionCount,
      type: type ?? this.type,
      url: url ?? this.url,
      folderId: folderId ?? this.folderId,
      createdAt: createdAt ?? this.createdAt,
      attachmentCount: attachmentCount ?? this.attachmentCount,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StudySession &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() =>
      'StudySession(id: $id, date: $date, timeSpent: $timeSpent)';
}
