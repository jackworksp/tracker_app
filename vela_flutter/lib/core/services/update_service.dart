import 'dart:io';
import 'package:dio/dio.dart';
import 'package:open_file_plus/open_file_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import '../constants/api_constants.dart';

class UpdateInfo {
  final String latestBuildNumber;
  final String currentBuildNumber;
  final String buildDate;
  final String tag;

  const UpdateInfo({
    required this.latestBuildNumber,
    required this.currentBuildNumber,
    required this.buildDate,
    required this.tag,
  });

  bool get hasUpdate {
    final latest = int.tryParse(latestBuildNumber) ?? 0;
    final current = int.tryParse(currentBuildNumber) ?? 0;
    return latest > current;
  }
}

class UpdateService {
  static final _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
  ));

  static const String _versionUrl = '${ApiConstants.baseUrl}/vela/version.json';
  static const String _apkUrl = '${ApiConstants.baseUrl}/vela/app-release.apk';

  Future<UpdateInfo> checkForUpdate() async {
    final packageInfo = await PackageInfo.fromPlatform();
    final response = await _dio.get<Map<String, dynamic>>(_versionUrl);
    final data = response.data!;
    return UpdateInfo(
      latestBuildNumber: data['version']?.toString() ?? '0',
      currentBuildNumber: packageInfo.buildNumber,
      buildDate: data['buildDate']?.toString() ?? '',
      tag: data['tag']?.toString() ?? '',
    );
  }

  /// Downloads the APK and triggers the system package installer.
  /// [onProgress] receives values from 0.0 to 1.0.
  Future<void> downloadAndInstall({
    required void Function(double progress) onProgress,
  }) async {
    final dir = await getExternalStorageDirectory() ?? await getTemporaryDirectory();
    final apkPath = '${dir.path}/vela_update.apk';
    final file = File(apkPath);

    await _dio.download(
      _apkUrl,
      apkPath,
      onReceiveProgress: (received, total) {
        if (total > 0) onProgress(received / total);
      },
      options: Options(followRedirects: true, maxRedirects: 5),
    );

    await OpenFile.open(file.path);
  }
}
