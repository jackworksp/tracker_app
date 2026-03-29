import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:youtube_player_flutter/youtube_player_flutter.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/link_utils.dart';
import '../../../providers/attachments_provider.dart';

/// Entry point — routes to the right viewer based on content type.
///
/// YouTube  → full-screen [_YoutubePlayerPage] pushed via rootNavigator
///            (fixes the fullscreen-button navigator context bug in modals)
/// Image    → bottom-sheet [_ImageViewer] with pinch-to-zoom
/// WebView  → bottom-sheet [_WebViewer] with loading indicator
class AttachmentViewerModal {
  static void show(BuildContext context, Attachment attachment) {
    final url = attachment.url ?? '';
    final resolvedUrl = LinkUtils.resolveUrl(url);
    final platform = attachment.platform ?? LinkUtils.detectPlatform(url);
    final isYoutube = platform == 'youtube' && LinkUtils.isYoutubeUrl(url);
    final youtubeId = isYoutube ? LinkUtils.extractYoutubeId(url) : null;

    if (youtubeId != null) {
      // ── YouTube: push a real full-screen page so the player's own
      //    fullscreen button uses the root navigator and works correctly.
      Navigator.of(context, rootNavigator: true).push(
        MaterialPageRoute(
          fullscreenDialog: true,
          builder: (_) => _YoutubePlayerPage(
            attachment: attachment,
            videoId: youtubeId,
          ),
        ),
      );
      return;
    }

    // ── Everything else: bottom-sheet viewer
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BottomSheetViewer(
        attachment: attachment,
        url: resolvedUrl,
      ),
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// YouTube full-screen page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class _YoutubePlayerPage extends StatefulWidget {
  final Attachment attachment;
  final String videoId;

  const _YoutubePlayerPage({
    required this.attachment,
    required this.videoId,
  });

  @override
  State<_YoutubePlayerPage> createState() => _YoutubePlayerPageState();
}

class _YoutubePlayerPageState extends State<_YoutubePlayerPage> {
  late final YoutubePlayerController _controller;

  @override
  void initState() {
    super.initState();
    _controller = YoutubePlayerController(
      initialVideoId: widget.videoId,
      flags: const YoutubePlayerFlags(
        autoPlay: true,
        mute: false,
        enableCaption: true,
        forceHD: false,
      ),
    );
  }

  @override
  void dispose() {
    // Restore portrait after leaving the page (in case player locked landscape)
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    // YoutubePlayerBuilder is required so the built-in fullscreen button
    // can push/pop a landscape overlay properly using THIS page's navigator.
    return YoutubePlayerBuilder(
      player: YoutubePlayer(
        controller: _controller,
        showVideoProgressIndicator: true,
        progressIndicatorColor: colors.brandAccent,
        progressColors: ProgressBarColors(
          playedColor: colors.brandAccent,
          handleColor: colors.brandAccent,
        ),
      ),
      builder: (context, player) {
        return Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            elevation: 0,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.attachment.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'youtube.com',
                  style: TextStyle(
                      fontSize: 11, color: Colors.white.withAlpha(153)),
                ),
              ],
            ),
            actions: [
              IconButton(
                tooltip: 'Open in YouTube',
                onPressed: () => LinkUtils.openUrl(widget.attachment.url ?? ''),
                icon:
                    const Icon(Icons.open_in_new_rounded, color: Colors.white),
              ),
            ],
          ),
          body: Column(
            children: [
              // Player takes its natural 16:9 height
              player,

              // Info panel below the player
              Expanded(
                child: Container(
                  color: colors.bgPrimary,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.attachment.title,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: colors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (widget.attachment.url != null)
                        Text(
                          widget.attachment.url!,
                          style:
                              TextStyle(fontSize: 13, color: colors.textLink),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bottom-sheet wrapper (WebView + Image)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class _BottomSheetViewer extends StatelessWidget {
  final Attachment attachment;
  final String url;

  const _BottomSheetViewer({required this.attachment, required this.url});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    final isImage = RegExp(
      r'\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$',
      caseSensitive: false,
    ).hasMatch(url);

    if (isImage) {
      return DraggableScrollableSheet(
        initialChildSize: 0.92,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, __) => _SheetContainer(
          attachment: attachment,
          colors: colors,
          url: url,
          child: _ImageViewer(url: url, colors: colors),
        ),
      );
    }

    return SafeArea(
      top: false,
      child: FractionallySizedBox(
        heightFactor: 0.92,
        alignment: Alignment.bottomCenter,
        child: _SheetContainer(
          attachment: attachment,
          colors: colors,
          url: url,
          child: _WebViewer(url: url, colors: colors),
        ),
      ),
    );
  }
}

class _SheetContainer extends StatelessWidget {
  final Attachment attachment;
  final VelaColorScheme colors;
  final String url;
  final Widget child;

  const _SheetContainer({
    required this.attachment,
    required this.colors,
    required this.url,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: colors.bgPrimary,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: colors.surfaceBorder,
                borderRadius: BorderRadius.circular(9999),
              ),
            ),
          ),

          // Toolbar
          _SheetToolbar(attachment: attachment, colors: colors, url: url),
          const Divider(height: 1),

          // Content
          Expanded(
            child: ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(bottom: Radius.circular(20)),
              child: child,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Sheet Toolbar ────────────────────────────────────────────────────────────

class _SheetToolbar extends StatelessWidget {
  final Attachment attachment;
  final VelaColorScheme colors;
  final String url;

  const _SheetToolbar({
    required this.attachment,
    required this.colors,
    required this.url,
  });

  @override
  Widget build(BuildContext context) {
    String domain = '';
    try {
      domain = Uri.parse(url).host;
    } catch (_) {}

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 8, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  attachment.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: colors.textPrimary,
                  ),
                ),
                if (domain.isNotEmpty)
                  Text(
                    domain,
                    style: TextStyle(fontSize: 12, color: colors.textTertiary),
                  ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Open in browser',
            onPressed: () => LinkUtils.openUrl(url),
            icon:
                Icon(Icons.open_in_browser_rounded, color: colors.brandAccent),
          ),
          IconButton(
            tooltip: 'Close',
            onPressed: () => Navigator.of(context).pop(),
            icon: Icon(Icons.close_rounded, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

// ─── Image Viewer ─────────────────────────────────────────────────────────────

class _ImageViewer extends StatelessWidget {
  final String url;
  final VelaColorScheme colors;

  const _ImageViewer({required this.url, required this.colors});

  @override
  Widget build(BuildContext context) {
    return InteractiveViewer(
      minScale: 0.5,
      maxScale: 5.0,
      child: Center(
        child: Image.network(
          url,
          fit: BoxFit.contain,
          loadingBuilder: (context, child, progress) {
            if (progress == null) return child;
            return Center(
              child: CircularProgressIndicator(
                color: colors.brandAccent,
                value: progress.expectedTotalBytes != null
                    ? progress.cumulativeBytesLoaded /
                        progress.expectedTotalBytes!
                    : null,
              ),
            );
          },
          errorBuilder: (_, __, ___) => Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.broken_image_outlined,
                  size: 64, color: colors.textTertiary),
              const SizedBox(height: 12),
              Text(
                'Image could not be loaded',
                style: TextStyle(color: colors.textSecondary, fontSize: 14),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── WebView Viewer ───────────────────────────────────────────────────────────

class _WebViewer extends StatefulWidget {
  final String url;
  final VelaColorScheme colors;

  const _WebViewer({required this.url, required this.colors});

  @override
  State<_WebViewer> createState() => _WebViewerState();
}

class _WebViewerState extends State<_WebViewer> {
  static final Set<Factory<OneSequenceGestureRecognizer>> _gestureRecognizers =
      {
    Factory<OneSequenceGestureRecognizer>(() => EagerGestureRecognizer()),
  };

  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _isLoading = true),
        onPageFinished: (_) => setState(() => _isLoading = false),
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        WebViewWidget(
          controller: _controller,
          gestureRecognizers: _gestureRecognizers,
        ),
        if (_isLoading)
          Center(
            child: CircularProgressIndicator(color: widget.colors.brandAccent),
          ),
      ],
    );
  }
}
