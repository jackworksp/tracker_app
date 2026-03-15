import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'dart:async';
import 'dart:convert';
import '../../../core/theme/app_colors.dart';
import '../../../core/constants/api_constants.dart';
import '../../../providers/auth_provider.dart';

class ChatMessage {
  final String role; // 'user' or 'assistant'
  final String content;
  final bool isStreaming;

  ChatMessage({
    required this.role,
    required this.content,
    this.isStreaming = false,
  });

  ChatMessage copyWith({String? content, bool? isStreaming}) {
    return ChatMessage(
      role: role,
      content: content ?? this.content,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }
}

class AskScreen extends ConsumerStatefulWidget {
  const AskScreen({super.key});

  @override
  ConsumerState<AskScreen> createState() => _AskScreenState();
}

class _AskScreenState extends ConsumerState<AskScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();
  final List<ChatMessage> _messages = [];

  bool _isStreaming = false;
  CancelToken? _cancelToken;

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _cancelToken?.cancel();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isStreaming) return;

    _inputController.clear();
    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text));
      _messages.add(ChatMessage(
        role: 'assistant',
        content: '',
        isStreaming: true,
      ));
      _isStreaming = true;
    });
    _scrollToBottom();

    try {
      final dioClient = ref.read(dioClientProvider);
      _cancelToken = CancelToken();

      // Build messages payload for the API
      final apiMessages = _messages
          .where((m) => m.content.isNotEmpty || m.isStreaming == false)
          .map((m) => {'role': m.role, 'content': m.content})
          .toList();
      // Remove the empty streaming assistant message from the payload
      if (apiMessages.isNotEmpty && apiMessages.last['content'] == '') {
        apiMessages.removeLast();
      }

      final response = await dioClient.dio.post(
        ApiConstants.ask,
        data: {'messages': apiMessages},
        options: Options(
          responseType: ResponseType.stream,
          headers: {'Accept': 'text/event-stream'},
        ),
        cancelToken: _cancelToken,
      );

      final stream = response.data.stream as Stream<List<int>>;
      final assistantIndex = _messages.length - 1;
      final buffer = StringBuffer();
      String lineBuffer = '';

      await for (final chunk in stream) {
        if (!mounted) break;
        final decoded = utf8.decode(chunk);
        lineBuffer += decoded;

        // Process complete lines
        while (lineBuffer.contains('\n')) {
          final newlineIndex = lineBuffer.indexOf('\n');
          final line = lineBuffer.substring(0, newlineIndex).trim();
          lineBuffer = lineBuffer.substring(newlineIndex + 1);

          if (line.startsWith('data: ')) {
            final data = line.substring(6).trim();
            if (data == '[DONE]') {
              continue;
            }
            try {
              final json = jsonDecode(data);
              final content = json['choices']?[0]?['delta']?['content'] ??
                  json['content'] ??
                  json['text'] ??
                  '';
              if (content is String && content.isNotEmpty) {
                buffer.write(content);
                if (mounted) {
                  setState(() {
                    _messages[assistantIndex] = _messages[assistantIndex]
                        .copyWith(content: buffer.toString());
                  });
                  _scrollToBottom();
                }
              }
            } catch (_) {
              // Non-JSON data line, could be plain text streaming
              if (data.isNotEmpty) {
                buffer.write(data);
                if (mounted) {
                  setState(() {
                    _messages[assistantIndex] = _messages[assistantIndex]
                        .copyWith(content: buffer.toString());
                  });
                  _scrollToBottom();
                }
              }
            }
          }
        }
      }

      // Finalize
      if (mounted) {
        setState(() {
          _messages[assistantIndex] = _messages[assistantIndex].copyWith(
            content: buffer.toString().isEmpty
                ? 'Sorry, I could not generate a response.'
                : buffer.toString(),
            isStreaming: false,
          );
          _isStreaming = false;
        });
        _scrollToBottom();
      }
    } on DioException catch (e) {
      if (e.type == DioExceptionType.cancel) {
        // Cancelled by user
      } else {
        _handleStreamError(e.message ?? 'Failed to get response');
      }
    } catch (e) {
      _handleStreamError(e.toString());
    }
  }

  void _handleStreamError(String error) {
    if (!mounted) return;
    final assistantIndex = _messages.length - 1;
    setState(() {
      if (assistantIndex >= 0 && _messages[assistantIndex].role == 'assistant') {
        _messages[assistantIndex] = _messages[assistantIndex].copyWith(
          content: _messages[assistantIndex].content.isEmpty
              ? 'Something went wrong. Please try again.'
              : _messages[assistantIndex].content,
          isStreaming: false,
        );
      }
      _isStreaming = false;
    });
  }

  void _clearChat() {
    _cancelToken?.cancel();
    setState(() {
      _messages.clear();
      _isStreaming = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? AppColors.dark : AppColors.light;

    return Scaffold(
      backgroundColor: colors.bgPrimary,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(colors),
            Expanded(
              child: _messages.isEmpty
                  ? _buildGreeting(colors)
                  : _buildMessagesList(colors),
            ),
            _buildComposer(colors),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(VelaColorScheme colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: colors.bgPrimary,
        border: Border(
          bottom: BorderSide(color: colors.surfaceBorder, width: 0.5),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: colors.brandAccent.withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              Icons.auto_awesome,
              color: colors.brandAccent,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          Text(
            'Vela AI',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: colors.textPrimary,
            ),
          ),
          const Spacer(),
          if (_messages.isNotEmpty)
            GestureDetector(
              onTap: _clearChat,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: colors.surfaceCard,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.delete_outline,
                  color: colors.textTertiary,
                  size: 20,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildGreeting(VelaColorScheme colors) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: colors.brandAccent.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                Icons.auto_awesome,
                color: colors.brandAccent,
                size: 36,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'How can I help you today?',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: colors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Ask me anything about your studies,\ntasks, or notes.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 15,
                color: colors.textTertiary,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesList(VelaColorScheme colors) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final isUser = message.role == 'user';
        return _buildMessageBubble(message, isUser, colors);
      },
    );
  }

  Widget _buildMessageBubble(
    ChatMessage message,
    bool isUser,
    VelaColorScheme colors,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 28,
              height: 28,
              margin: const EdgeInsets.only(top: 2),
              decoration: BoxDecoration(
                color: colors.brandAccent.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.auto_awesome,
                color: colors.brandAccent,
                size: 14,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isUser)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      'Vela',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: colors.textTertiary,
                      ),
                    ),
                  ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isUser
                        ? colors.brandAccent
                        : colors.surfaceCard,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 16),
                    ),
                    border: isUser
                        ? null
                        : Border.all(color: colors.surfaceBorder),
                  ),
                  child: message.isStreaming && message.content.isEmpty
                      ? _buildStreamingIndicator(colors)
                      : Text.rich(
                          TextSpan(
                            text: message.content,
                            children: [
                              if (message.isStreaming)
                                TextSpan(
                                  text: ' \u258C',
                                  style: TextStyle(
                                    color: colors.brandAccent,
                                    fontWeight: FontWeight.w300,
                                  ),
                                ),
                            ],
                          ),
                          style: TextStyle(
                            fontSize: 15,
                            color: isUser
                                ? colors.textInverse
                                : colors.textPrimary,
                            height: 1.45,
                          ),
                        ),
                ),
              ],
            ),
          ),
          if (isUser) const SizedBox(width: 36),
        ],
      ),
    );
  }

  Widget _buildStreamingIndicator(VelaColorScheme colors) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(
            strokeWidth: 1.5,
            color: colors.brandAccent,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          'Thinking...',
          style: TextStyle(
            fontSize: 14,
            color: colors.textTertiary,
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildComposer(VelaColorScheme colors) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        color: colors.bgPrimary,
        border: Border(
          top: BorderSide(color: colors.surfaceBorder, width: 0.5),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Container(
                constraints: const BoxConstraints(maxHeight: 120),
                decoration: BoxDecoration(
                  color: colors.surfaceCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: colors.surfaceBorder),
                ),
                child: TextField(
                  controller: _inputController,
                  focusNode: _focusNode,
                  maxLines: null,
                  textInputAction: TextInputAction.newline,
                  onChanged: (_) => setState(() {}),
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 15,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Ask anything...',
                    hintStyle: TextStyle(color: colors.textTertiary),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: (_inputController.text.trim().isNotEmpty && !_isStreaming)
                  ? _sendMessage
                  : null,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: (_inputController.text.trim().isNotEmpty &&
                          !_isStreaming)
                      ? colors.brandAccent
                      : colors.surfaceCard,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  Icons.arrow_upward,
                  color: (_inputController.text.trim().isNotEmpty &&
                          !_isStreaming)
                      ? colors.textInverse
                      : colors.textDisabled,
                  size: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
