abstract class ApiConstants {
  // Base URL - configure this for your environment
  static const String baseUrl = 'https://seiyul.in';
  static const String apiPath = '/vela/api';
  static String get apiBaseUrl => '$baseUrl$apiPath';

  // Timeout
  static const Duration requestTimeout = Duration(seconds: 15);

  // Auth endpoints
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';
  static const String me = '/auth/me';
  static const String mcpKey = '/auth/mcp-key';
  static const String regenerateMcpKey = '/auth/mcp-key/regenerate';
  static const String uploadPhoto = '/auth/upload-photo';

  // Subject endpoints
  static const String subjects = '/subjects';

  // Progress endpoints
  static const String progress = '/progress';
  static const String topics = '/progress/topics';
  static const String sessions = '/progress/sessions';
  static const String revisions = '/progress/revisions';
  static const String seedTopics = '/progress/seed';

  // Task endpoints
  static const String tasks = '/tasks';

  // Goal endpoints
  static const String goals = '/goals';
  static const String routines = '/routines';

  // Journal endpoints
  static const String journal = '/journal';

  // Note endpoints
  static const String notes = '/notes';
  static const String noteFolders = '/note-folders';
  static const String noteLinks = '/note-links';

  // Attachment endpoints
  static const String attachments = '/attachments';
  static const String attachmentFolders = '/attachment-folders';

  // Other endpoints
  static const String search = '/search';
  static const String ask = '/ask';
  static const String youtubeSearch = '/youtube/search';
  static const String supportReport = '/support/report';
}
