import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../screens/auth/landing_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/shared/app_shell.dart';
import '../screens/tasks/tasks_screen.dart';
import '../screens/sessions/timeline_screen.dart';
import '../screens/attachments/attachments_screen.dart';
import '../screens/notes/notes_screen.dart';
import '../screens/ask/ask_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/goals/goals_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/routines/routines_screen.dart';
import '../screens/attachments/share_receive_screen.dart';
import '../screens/shared/splash_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

// Issue 05: allows main.dart to override the initial route when the app is
// launched via a share intent.  Default is '/landing'.
final initialLocationProvider = Provider<String>((ref) => '/landing');

/// A ChangeNotifier that listens to auth state changes
/// so GoRouter can react without being recreated
class AuthChangeNotifier extends ChangeNotifier {
  AuthChangeNotifier(Ref ref) {
    ref.listen<AuthState>(authProvider, (_, __) {
      notifyListeners();
    });
  }
}

final _authChangeNotifierProvider = Provider<AuthChangeNotifier>((ref) {
  return AuthChangeNotifier(ref);
});

final routerProvider = Provider<GoRouter>((ref) {
  final authChangeNotifier = ref.watch(_authChangeNotifierProvider);
  final initialLocation = ref.watch(initialLocationProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: initialLocation,
    refreshListenable: authChangeNotifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuth = authState.isAuthenticated;
      final isCheckingAuth = authState.isCheckingAuth;
      final location = state.matchedLocation;
      final isAuthRoute = location == '/landing' ||
          location == '/login' ||
          location == '/signup';

      // While checking auth, show splash screen
      if (isCheckingAuth) return location == '/splash' ? null : '/splash';

      // Auth check done — always leave the splash screen
      if (location == '/splash') return isAuth ? '/tasks' : '/landing';

      // Not authenticated and not on an auth route -> go to landing
      if (!isAuth && !isAuthRoute) return '/landing';

      // Authenticated and on an auth route -> go to tasks
      if (isAuth && isAuthRoute) return '/tasks';

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/landing',
        builder: (context, state) => const LandingScreen(),
      ),
      // Issue 05 — Share receive screen: opened when another app shares
      // content to Vela via Android's share sheet.  Lives outside the shell
      // so it gets its own AppBar with a close button (Issue 04).
      GoRoute(
        path: '/share-receive',
        builder: (context, state) => const ShareReceiveScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/tasks',
                builder: (context, state) => const TasksScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/timeline',
                builder: (context, state) => const TimelineScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/attachments',
                builder: (context, state) => const AttachmentsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/notes',
                builder: (context, state) => const NotesScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/ask',
                builder: (context, state) => const AskScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/search',
                builder: (context, state) => const SearchScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/goals',
                builder: (context, state) => const GoalsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/routines',
                builder: (context, state) => const RoutinesScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
