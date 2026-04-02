function normalizePlatform(platform) {
  const normalized = platform?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "google-drive") return "google_drive";
  return normalized;
}

function detectAttachmentPlatform(url) {
  const normalizedUrl = (url || "").trim().toLowerCase();
  if (!normalizedUrl) return "link";
  if (
    normalizedUrl.includes("youtube.com") ||
    normalizedUrl.includes("youtu.be")
  ) {
    return "youtube";
  }
  if (normalizedUrl.includes("instagram.com")) {
    return "instagram";
  }
  if (
    normalizedUrl.includes("docs.google.com") ||
    normalizedUrl.includes("drive.google.com")
  ) {
    return "google_drive";
  }
  return "link";
}

function buildDocumentCondition(urlExpression, attachmentTypeExpression) {
  return `(
        LOWER(COALESCE(${attachmentTypeExpression}, '')) IN ('pdf', 'document')
        OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%.pdf%'
        OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%docs.google.com%'
        OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%drive.google.com%'
    )`;
}

function buildImageCondition(urlExpression, attachmentTypeExpression) {
  return `(
        LOWER(COALESCE(${attachmentTypeExpression}, '')) = 'image'
        OR LOWER(COALESCE(${urlExpression}, '')) ~ '\\.(jpg|jpeg|png|gif|webp|bmp|svg)(\\?|#|$)'
    )`;
}

function buildYoutubeCondition(urlExpression, platformExpression) {
  return `(
        LOWER(COALESCE(${platformExpression}, '')) = 'youtube'
        OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%youtube.com%'
        OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%youtu.be%'
    )`;
}

function buildInstagramCondition(urlExpression, platformExpression) {
  return `(
        LOWER(COALESCE(${platformExpression}, '')) = 'instagram'
        OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%instagram.com%'
    )`;
}

function buildPlatformFilterClause({
  platformParam,
  urlExpression,
  platformExpression,
}) {
  return `(
        $${platformParam}::TEXT IS NULL OR
        (
            $${platformParam} = 'youtube' AND ${buildYoutubeCondition(urlExpression, platformExpression)}
        ) OR (
            $${platformParam} = 'instagram' AND ${buildInstagramCondition(urlExpression, platformExpression)}
        ) OR (
            $${platformParam} = 'google_drive' AND (
                LOWER(COALESCE(${platformExpression}, '')) IN ('google_drive', 'google-drive')
                OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%docs.google.com%'
                OR LOWER(COALESCE(${urlExpression}, '')) LIKE '%drive.google.com%'
            )
        ) OR (
            LOWER(COALESCE(${platformExpression}, '')) = $${platformParam}
        )
    )`;
}

function buildFileTypeFilterClause({
  fileTypeParam,
  typeExpression,
  urlExpression,
  platformExpression,
  attachmentTypeExpression,
}) {
  const documentCondition = buildDocumentCondition(
    urlExpression,
    attachmentTypeExpression,
  );
  const imageCondition = buildImageCondition(
    urlExpression,
    attachmentTypeExpression,
  );
  const youtubeCondition = buildYoutubeCondition(
    urlExpression,
    platformExpression,
  );
  const instagramCondition = buildInstagramCondition(
    urlExpression,
    platformExpression,
  );

  return `(
        $${fileTypeParam}::TEXT IS NULL OR
        (
            $${fileTypeParam} = 'pdf'
            AND LOWER(COALESCE(${typeExpression}, '')) = 'url'
            AND ${documentCondition}
        ) OR (
            $${fileTypeParam} = 'image'
            AND LOWER(COALESCE(${typeExpression}, '')) = 'url'
            AND ${imageCondition}
        ) OR (
            $${fileTypeParam} = 'link'
            AND LOWER(COALESCE(${typeExpression}, '')) = 'url'
            AND NOT ${documentCondition}
            AND NOT ${imageCondition}
            AND NOT ${youtubeCondition}
            AND NOT ${instagramCondition}
        )
    )`;
}

module.exports = {
  normalizePlatform,
  detectAttachmentPlatform,
  buildPlatformFilterClause,
  buildFileTypeFilterClause,
};
