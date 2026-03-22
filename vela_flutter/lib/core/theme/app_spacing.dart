abstract class AppSpacing {
  AppSpacing._();

  static const double s0 = 0.0;
  static const double s0_5 = 2.0;
  static const double s1 = 4.0;
  static const double s2 = 8.0;
  static const double s3 = 12.0;
  static const double s4 = 16.0;
  static const double s5 = 20.0;
  static const double s6 = 24.0;
  static const double s8 = 32.0;
  static const double s10 = 40.0;
  static const double s12 = 48.0;
  static const double s16 = 64.0;
  static const double s20 = 80.0;
  static const double s24 = 96.0;

  // Issue 01: WCAG 2.5.5 minimum touch target size (44×44px).
  // All interactive elements (buttons, icon buttons, nav items, inputs)
  // must use this as their minWidth/minHeight in BoxConstraints.
  static const double minTouchTarget = 44.0;

  // Issue 11: FAB clearance — minimum bottom padding so content isn't hidden
  // behind the FAB (56px) + 16px margin + 8px breathing room = 80px.
  // Always add MediaQuery.of(context).padding.bottom on top of this.
  static const double fabClearance = 80.0;
}
