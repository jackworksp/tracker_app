class ImportantDate {
  final int id;
  final int userId;
  final String title;
  final String? description;
  final String category;
  final DateTime date;
  final String? time;
  final String recurrence;
  final List<int> reminderOffsetsDays;
  final int? taskId;
  final int? goalId;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? nextOccurrence;

  const ImportantDate({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    this.category = 'other',
    required this.date,
    this.time,
    this.recurrence = 'none',
    this.reminderOffsetsDays = const [7, 1, 0],
    this.taskId,
    this.goalId,
    this.createdAt,
    this.updatedAt,
    this.nextOccurrence,
  });

  factory ImportantDate.fromJson(Map<String, dynamic> json) {
    return ImportantDate(
      id: json['id'] as int,
      userId: json['user_id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: (json['category'] as String?) ?? 'other',
      date: DateTime.parse(json['date'] as String),
      time: json['time'] as String?,
      recurrence: (json['recurrence'] as String?) ?? 'none',
      reminderOffsetsDays: (json['reminder_offsets_days'] as List<dynamic>?)
              ?.map((item) => int.parse(item.toString()))
              .toList() ??
          const [7, 1, 0],
      taskId: json['task_id'] as int?,
      goalId: json['goal_id'] as int?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.parse(json['updated_at'])
          : null,
      nextOccurrence: json['next_occurrence'] != null
          ? DateTime.parse(json['next_occurrence'])
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
      'date': _dateOnly(date),
      'time': time,
      'recurrence': recurrence,
      'reminder_offsets_days': reminderOffsetsDays,
      'task_id': taskId,
      'goal_id': goalId,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'next_occurrence': nextOccurrence != null ? _dateOnly(nextOccurrence!) : null,
    };
  }

  DateTime get displayDate => nextOccurrence ?? date;
  bool get repeatsYearly => recurrence == 'yearly';

  static String _dateOnly(DateTime value) {
    return value.toIso8601String().split('T').first;
  }
}
