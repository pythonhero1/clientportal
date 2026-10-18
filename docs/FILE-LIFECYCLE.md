# File lifecycle

## Approved behavior

Files are private S3-compatible objects. PostgreSQL stores their metadata, authorization and history. The API issues access only after checking the activated user, project and file grants.

Application version history preserves earlier versions. Feedback, review status and approval refer to a version, not only to the logical file. Updating a file does not silently transfer approval to the new version.

| Category | Approved extensions |
| --- | --- |
| Images | JPG, JPEG, PNG, WebP, GIF |
| Documents | PDF, DOCX, TXT |
| Spreadsheets | XLSX, CSV |
| Design files | SVG, PSD, AI, EPS |
| Archives | ZIP |
| Video | MP4, MOV |
| Audio | MP3, WAV |

Maximum file size is 500 MB. Define the exact byte interpretation in the reviewed upload contract before implementation; the engineering recommendation is decimal MB, or 500,000,000 bytes.

## State transitions

1. Upload authorization checks permission, declared type, capacity and proposed size.
2. Upload goes directly to a private temporary/quarantine object key, using resumable multipart transfer where appropriate.
3. Server-side completion checks actual object size, type/integrity and the required inspection result. A client-supplied success flag does not release the object.
4. The completed immutable version becomes available according to its shared/internal classification and review status.
5. Archived files remain stored until an authorized deletion action; archive is not a deletion timer.
6. Owner can soft-delete a file. Recovery is available during the approved 90-day window.
7. After the recovery window, the file remains restricted pending Owner authorization for permanent deletion. There is no automatic purge. Do not promise restoration outside the approved window without a decision.

Store a full audit of creation, upload completion, version changes, access-grant changes, review/approval actions, archive, soft deletion, restoration and permanent deletion. Record actor, authorized scope, target/version, time and outcome without storing credentials or access tokens.

## Engineering proposal for review

Use AWS SDK v3 S3-compatible client operations. Use random immutable object keys and short-lived download authorization. An issued URL can remain usable until it expires; do not claim immediate revocation of already-issued object URLs. If strict immediate revocation is required, review a streaming authorization proxy and its capacity separately.

Quarantine untrusted files and scan with a verified ClamAV deployment or a reviewed managed service. Check scanner size limits against 500 MB and every accepted category. An unsupported or oversized scan result is not a clean result. SVG/HTML-like content must not execute in the portal origin; archives and design formats need bounded processing and safe downloads.

Do not route every 500 MB file through Node memory. Capacity checks need the hosting/storage plan first. Application permissions and size/type checks remain necessary even with signed uploads.

Abandoned multipart cleanup may remove uncommitted temporary uploads only. It must not delete archived versions or soft-deleted files under the retention rules.

## Drive documents

Project documents use Drive links only. Their link metadata is private project data. Opening a link is still governed by Google's access controls, so Owner must set the correct recipient permissions in Drive. The portal does not make a publicly shared Drive document private. Do not create Drive synchronization, mirror files into S3, or add signatures without a new decision.
