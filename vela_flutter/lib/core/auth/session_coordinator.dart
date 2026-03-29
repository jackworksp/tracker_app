import 'dart:async';

class SessionCoordinator {
  SessionCoordinator._();

  static final SessionCoordinator instance = SessionCoordinator._();

  final StreamController<void> _unauthorizedController =
      StreamController<void>.broadcast();

  Stream<void> get unauthorizedStream => _unauthorizedController.stream;

  void notifyUnauthorized() {
    if (!_unauthorizedController.isClosed) {
      _unauthorizedController.add(null);
    }
  }
}
