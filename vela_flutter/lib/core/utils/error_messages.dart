// ---------------------------------------------------------------------------
// Issue 06 — Specific, actionable error messages
// Use these constants and helpers everywhere instead of raw exception strings.
// ---------------------------------------------------------------------------

abstract class ErrorMessages {
  ErrorMessages._();

  // --- Network ---
  static const String networkError =
      "Can't connect to the server. Check your internet connection and try again.";
  static const String timeoutError =
      'Request timed out. Please check your connection and try again.';
  static const String serverError =
      'Something went wrong on our end. Please try again in a moment.';

  // --- Authentication ---
  static const String invalidCredentials =
      'Email or password is incorrect. Please try again.';
  static const String sessionExpired =
      'Your session has expired. Please log in again.';
  static const String accountAlreadyExists =
      'An account with this email already exists. Try logging in instead.';

  // --- Tasks ---
  static const String taskTitleRequired =
      "Please enter a task title (e.g. 'Study for exam').";
  static const String taskLoadFailed =
      "Couldn't load tasks. Check your connection and pull down to retry.";
  static const String taskSaveFailed =
      "Couldn't save task. Check your connection and try again.";
  static const String taskDeleteFailed =
      "Couldn't delete task. Please try again.";

  // --- Sessions ---
  static const String sessionActivityRequired =
      "Please enter what you studied (e.g. 'React Hooks chapter 3').";
  static const String sessionDurationInvalid =
      'Duration must be between 1 minute and 12 hours.';
  static const String sessionLoadFailed =
      "Couldn't load sessions. Pull down to retry.";
  static const String sessionSaveFailed =
      "Couldn't save session. Check your connection and try again.";
  static const String sessionDeleteFailed =
      "Couldn't delete session. Please try again.";

  // --- Notes ---
  static const String noteTitleRequired =
      "Please enter a note title before saving.";
  static const String noteLoadFailed =
      "Couldn't load notes. Pull down to retry.";
  static const String noteSaveFailed =
      "Couldn't save note. Check your connection and try again.";
  static const String noteDeleteFailed =
      "Couldn't delete note. Please try again.";

  // --- Attachments ---
  static const String attachmentUrlRequired =
      'Please enter a URL to save (e.g. https://youtube.com/...).';
  static const String attachmentUrlInvalid =
      'That URL doesn\'t look valid. Please check it and try again.';
  static const String attachmentLoadFailed =
      "Couldn't load attachments. Pull down to retry.";
  static const String attachmentSaveFailed =
      "Couldn't save attachment. Check your connection and try again.";
  static const String attachmentDeleteFailed =
      "Couldn't delete attachment. Please try again.";
  static String fileTooLarge(int maxMb) =>
      'File is too large. Maximum size is ${maxMb}MB. Try a smaller file.';
  static String invalidFileType(List<String> allowed) =>
      'Invalid file type. Allowed: ${allowed.join(', ')}.';

  // --- Goals ---
  static const String goalTitleRequired =
      "Please enter a goal title before saving.";
  static const String goalLoadFailed =
      "Couldn't load goals. Pull down to retry.";
  static const String goalSaveFailed =
      "Couldn't save goal. Check your connection and try again.";
  static const String goalDeleteFailed =
      "Couldn't delete goal. Please try again.";

  // --- Routines ---
  static const String routineTitleRequired =
      "Please enter a routine title before saving.";
  static const String routineLoadFailed =
      "Couldn't load routines. Pull down to retry.";
  static const String routineSaveFailed =
      "Couldn't save routine. Check your connection and try again.";
  static const String routineDeleteFailed =
      "Couldn't delete routine. Please try again.";
  static const String routineToggleFailed =
      "Couldn't update routine completion. Please try again.";

  // --- Validation helpers ---
  static String requiredField(String fieldName) =>
      '$fieldName is required. Please fill it in before continuing.';

  // --- DioException mapper ---
  /// Convert a Dio error message (produced by ErrorInterceptor) into a
  /// user-friendly string that callers can display directly.
  static String fromDioMessage(String? raw) {
    if (raw == null || raw.isEmpty) return serverError;
    final lower = raw.toLowerCase();
    if (lower.contains('timed out') || lower.contains('timeout')) {
      return timeoutError;
    }
    if (lower.contains('no internet') ||
        lower.contains('connection') ||
        lower.contains('socket')) {
      return networkError;
    }
    if (lower.contains('session expired') || lower.contains('unauthorized')) {
      return sessionExpired;
    }
    // Return the raw message if it already looks specific enough
    if (raw.length > 10) return raw;
    return serverError;
  }
}
