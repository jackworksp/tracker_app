import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_utils.dart';
import '../../../data/repositories/search_repository.dart';
import '../../../data/repositories/attachments_repository.dart';
import '../../../providers/auth_provider.dart';

enum SearchFilter { all, tasks, sessions, files }

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  Timer? _debounce;

  SearchFilter _activeFilter = SearchFilter.all;
  bool _isLoading = false;
  String _query = '';
  List<Map<String, dynamic>> _allResults = [];
  Map<SearchFilter, int> _counts = {};

  SearchRepository? _searchRepository;
  AttachmentsRepository? _attachmentsRepository;

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _initRepositories() {
    if (_searchRepository == null) {
      final dioClient = ref.read(dioClientProvider);
      _searchRepository = SearchRepository(dioClient);
      _attachmentsRepository = AttachmentsRepository(dioClient);
    }
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.trim().isEmpty) {
      setState(() {
        _query = '';
        _allResults = [];
        _counts = {};
        _isLoading = false;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _performSearch(query.trim());
    });
  }

  Future<void> _performSearch(String query) async {
    _initRepositories();
    setState(() {
      _isLoading = true;
      _query = query;
    });

    try {
      final results = await Future.wait([
        _searchRepository!.search(query),
        _attachmentsRepository!.getAll(filters: {'search': query}),
      ]);

      final searchData = results[0];
      final attachmentsData = results[1];

      final List<Map<String, dynamic>> combined = [];

      // Parse tasks
      if (searchData['tasks'] != null) {
        for (final item in (searchData['tasks'] as List)) {
          combined.add({
            'type': 'task',
            'title': item['title'] ?? 'Untitled Task',
            'status': item['status'] ?? 'pending',
            'date': item['due_date'] ?? item['created_at'],
            'raw': item,
          });
        }
      }

      // Parse sessions
      if (searchData['sessions'] != null) {
        for (final item in (searchData['sessions'] as List)) {
          combined.add({
            'type': 'session',
            'title': item['topic_name'] ?? item['title'] ?? 'Study Session',
            'status': '${item['duration_minutes'] ?? 0} min',
            'date': item['started_at'] ?? item['created_at'],
            'raw': item,
          });
        }
      }

      // Parse files/attachments
      if (attachmentsData['attachments'] != null) {
        for (final item in (attachmentsData['attachments'] as List)) {
          combined.add({
            'type': 'file',
            'title': item['name'] ?? item['file_name'] ?? 'Untitled File',
            'status': item['file_type'] ?? 'file',
            'date': item['created_at'],
            'raw': item,
          });
        }
      }

      // Count by type
      final counts = <SearchFilter, int>{
        SearchFilter.all: combined.length,
        SearchFilter.tasks: combined.where((r) => r['type'] == 'task').length,
        SearchFilter.sessions:
            combined.where((r) => r['type'] == 'session').length,
        SearchFilter.files: combined.where((r) => r['type'] == 'file').length,
      };

      if (mounted) {
        setState(() {
          _allResults = combined;
          _counts = counts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _allResults = [];
          _counts = {};
        });
      }
    }
  }

  List<Map<String, dynamic>> get _filteredResults {
    if (_activeFilter == SearchFilter.all) return _allResults;
    final typeStr = _activeFilter.name;
    return _allResults.where((r) => r['type'] == typeStr).toList();
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'task':
        return Icons.check_circle_outline;
      case 'session':
        return Icons.timer_outlined;
      case 'file':
        return Icons.attach_file;
      default:
        return Icons.article_outlined;
    }
  }

  Color _colorForType(String type, VelaColorScheme colors) {
    switch (type) {
      case 'task':
        return colors.stateInfo;
      case 'session':
        return colors.stateWarning;
      case 'file':
        return colors.brandAccent;
      default:
        return colors.textSecondary;
    }
  }

  String _labelForType(String type) {
    switch (type) {
      case 'task':
        return 'Task';
      case 'session':
        return 'Session';
      case 'file':
        return 'File';
      default:
        return 'Item';
    }
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
            _buildSearchBar(colors),
            if (_query.isNotEmpty) _buildFilterBar(colors),
            Expanded(child: _buildBody(colors)),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(VelaColorScheme colors) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Container(
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.surfaceBorder),
        ),
        child: Row(
          children: [
            const SizedBox(width: 12),
            Icon(Icons.search, color: colors.textTertiary, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _searchController,
                focusNode: _focusNode,
                autofocus: true,
                onChanged: _onSearchChanged,
                style: TextStyle(color: colors.textPrimary, fontSize: 16),
                decoration: InputDecoration(
                  hintText: 'Search tasks, sessions, files...',
                  hintStyle: TextStyle(color: colors.textTertiary),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            if (_searchController.text.isNotEmpty)
              GestureDetector(
                onTap: () {
                  _searchController.clear();
                  _onSearchChanged('');
                },
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child:
                      Icon(Icons.close, color: colors.textTertiary, size: 18),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar(VelaColorScheme colors) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: SearchFilter.values.map((filter) {
          final isActive = _activeFilter == filter;
          final count = _counts[filter] ?? 0;
          final label = filter == SearchFilter.all
              ? 'All'
              : '${filter.name[0].toUpperCase()}${filter.name.substring(1)}';
          final displayLabel =
              _allResults.isNotEmpty ? '$label ($count)' : label;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(
                displayLabel,
                style: TextStyle(
                  color: isActive ? colors.textInverse : colors.textSecondary,
                  fontSize: 13,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
              selected: isActive,
              onSelected: (_) => setState(() => _activeFilter = filter),
              backgroundColor: colors.surfaceCard,
              selectedColor: colors.brandAccent,
              side: BorderSide(
                color: isActive ? colors.brandAccent : colors.surfaceBorder,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              showCheckmark: false,
              padding: const EdgeInsets.symmetric(horizontal: 4),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildBody(VelaColorScheme colors) {
    // Initial empty state
    if (_query.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search, size: 64, color: colors.textDisabled),
              const SizedBox(height: 16),
              Text(
                'Search across all your tasks,\nsessions, and files',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: colors.textTertiary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Loading
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(
          color: colors.brandAccent,
          strokeWidth: 2,
        ),
      );
    }

    // No results
    final filtered = _filteredResults;
    if (filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.search_off, size: 48, color: colors.textDisabled),
              const SizedBox(height: 16),
              Text(
                'No results for "$_query"',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 16,
                  color: colors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Try a different search term',
                style: TextStyle(fontSize: 14, color: colors.textTertiary),
              ),
            ],
          ),
        ),
      );
    }

    // Results list
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) =>
          _buildResultCard(filtered[index], colors),
    );
  }

  Widget _buildResultCard(Map<String, dynamic> result, VelaColorScheme colors) {
    final type = result['type'] as String;
    final title = result['title'] as String;
    final status = result['status'] as String? ?? '';
    final dateStr = result['date'] as String?;

    String dateDisplay = '';
    if (dateStr != null) {
      try {
        final date = DateTime.parse(dateStr);
        dateDisplay = VelaDateUtils.timeAgo(date);
      } catch (_) {
        dateDisplay = '';
      }
    }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.surfaceBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _colorForType(type, colors).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _iconForType(type),
              color: _colorForType(type, colors),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                    color: colors.textPrimary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    if (status.isNotEmpty) ...[
                      Text(
                        status,
                        style: TextStyle(
                          fontSize: 12,
                          color: colors.textTertiary,
                        ),
                      ),
                      if (dateDisplay.isNotEmpty)
                        Text(
                          '  ·  ',
                          style: TextStyle(
                            fontSize: 12,
                            color: colors.textDisabled,
                          ),
                        ),
                    ],
                    if (dateDisplay.isNotEmpty)
                      Text(
                        dateDisplay,
                        style: TextStyle(
                          fontSize: 12,
                          color: colors.textTertiary,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _colorForType(type, colors).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              _labelForType(type),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: _colorForType(type, colors),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
