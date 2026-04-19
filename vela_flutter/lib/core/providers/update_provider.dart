import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/update_service.dart';

class UpdateNotifier extends AsyncNotifier<UpdateInfo?> {
  final _service = UpdateService();

  @override
  Future<UpdateInfo?> build() async => null; // idle until triggered

  Future<UpdateInfo> checkForUpdate() async {
    state = const AsyncLoading();
    final info = await AsyncValue.guard(() => _service.checkForUpdate());
    state = info;
    return info.value!;
  }
}

final updateProvider = AsyncNotifierProvider<UpdateNotifier, UpdateInfo?>(
  UpdateNotifier.new,
);
