package com.vela.vela_flutter

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.embedding.android.FlutterActivity
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity(), EventChannel.StreamHandler {
    private var initialSharedPayload: Map<String, Any?>? = null
    private var eventSink: EventChannel.EventSink? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initialSharedPayload = extractSharedPayload(intent)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "vela/share_fallback"
        ).setMethodCallHandler { call: MethodCall, result: MethodChannel.Result ->
            when (call.method) {
                "getInitialSharedPayload" -> result.success(initialSharedPayload)
                else -> result.notImplemented()
            }
        }

        EventChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            "vela/share_fallback/events"
        ).setStreamHandler(this)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val payload = extractSharedPayload(intent)
        if (payload != null) {
            initialSharedPayload = payload
            eventSink?.success(payload)
        }
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }

    private fun extractSharedPayload(intent: Intent?): Map<String, Any?>? {
        if (intent == null) return null

        val action = intent.action ?: return null
        if (
            action != Intent.ACTION_SEND &&
            action != Intent.ACTION_SEND_MULTIPLE &&
            action != Intent.ACTION_VIEW
        ) {
            return null
        }

        val content = intent.getStringExtra(Intent.EXTRA_TEXT)?.trim()?.takeIf { it.isNotEmpty() }
            ?: clipDataText(intent.clipData)
            ?: contentFromUri(intent.data)

        val attachments = linkedMapOf<String, Map<String, String>>()
        addAttachmentUri(attachments, singleStreamUri(intent))
        addAttachmentUris(attachments, multipleStreamUris(intent))
        addAttachmentUris(attachments, clipDataUris(intent.clipData))
        if (content == null) {
            addAttachmentUri(attachments, attachmentUriFromData(intent.data))
        }

        if (content == null && attachments.isEmpty()) {
            return null
        }

        return mapOf(
            "sourceAction" to action,
            "content" to content,
            "attachments" to attachments.values.toList(),
        )
    }

    private fun singleStreamUri(intent: Intent): Uri? {
        @Suppress("DEPRECATION")
        return intent.getParcelableExtra(Intent.EXTRA_STREAM)
    }

    private fun multipleStreamUris(intent: Intent): List<Uri> {
        @Suppress("DEPRECATION")
        val uris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
        return uris ?: emptyList()
    }

    private fun clipDataUris(clipData: ClipData?): List<Uri> {
        if (clipData == null) return emptyList()
        return buildList {
            for (index in 0 until clipData.itemCount) {
                val uri = clipData.getItemAt(index).uri ?: continue
                add(uri)
            }
        }
    }

    private fun clipDataText(clipData: ClipData?): String? {
        if (clipData == null) return null
        for (index in 0 until clipData.itemCount) {
            val text = clipData.getItemAt(index).text?.toString()?.trim()
            if (!text.isNullOrEmpty()) return text
        }
        return null
    }

    private fun contentFromUri(uri: Uri?): String? {
        if (uri == null) return null
        return when (uri.scheme?.lowercase()) {
            "http", "https" -> uri.toString()
            else -> null
        }
    }

    private fun attachmentUriFromData(uri: Uri?): Uri? {
        if (uri == null) return null
        return when (uri.scheme?.lowercase()) {
            "content", "file" -> uri
            else -> null
        }
    }

    private fun addAttachmentUris(
        attachments: LinkedHashMap<String, Map<String, String>>,
        uris: List<Uri>
    ) {
        uris.forEach { uri -> addAttachmentUri(attachments, uri) }
    }

    private fun addAttachmentUri(
        attachments: LinkedHashMap<String, Map<String, String>>,
        uri: Uri?
    ) {
        if (uri == null) return
        val key = uri.toString()
        if (attachments.containsKey(key)) return

        val mimeType = contentResolver.getType(uri)
            ?: when (uri.toString().substringAfterLast('.', "").lowercase()) {
                "jpg", "jpeg", "png", "gif", "webp", "heic" -> "image/*"
                "mp4", "mov", "mkv", "webm" -> "video/*"
                "mp3", "wav", "m4a" -> "audio/*"
                else -> "*/*"
            }

        attachments[key] = mapOf(
            "path" to key,
            "mimeType" to mimeType,
            "type" to attachmentTypeForMime(mimeType),
        )
    }

    private fun attachmentTypeForMime(mimeType: String): String {
        return when {
            mimeType.startsWith("image") -> "image"
            mimeType.startsWith("video") -> "video"
            mimeType.startsWith("audio") -> "audio"
            else -> "file"
        }
    }
}
