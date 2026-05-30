"""Bahasa Indonesia error message catalog.

Centralized so 4 backends emit identical user-facing strings. Reference
plan Section 24.11 for the canonical catalog. When the OpenAPI specs
update error message strings, mirror them here.

Naming convention: SCREAMING_SNAKE_CASE constants on the `ErrorMessages`
class. Group by HTTP status, then by domain.
"""

from typing import Final


class ErrorMessages:
    """Catalog of user-facing error strings (Bahasa Indonesia).

    DO NOT reformat or "improve" these strings — they are part of the FE
    contract and assertions in OpenAPI specs reference them verbatim.
    """

    # --- 400 Bad Request -----------------------------------------------------
    INVALID_REQUEST: Final[str] = "Permintaan tidak valid"
    INVALID_ACTION: Final[str] = "Aksi tidak valid"
    INVALID_IMAGE: Final[str] = "Hanya file gambar yang diperbolehkan"
    FILE_TOO_LARGE: Final[str] = "Ukuran file maksimal 2MB"
    STAND_NOT_FOUND: Final[str] = "Stand tidak ditemukan"
    INVALID_KATEGORI: Final[str] = "Nilai kategori_usaha tidak valid"
    INVALID_SUBSEKTOR: Final[str] = "Nilai subsektor tidak valid"
    INVALID_EVENT_STATUS_TRANSITION: Final[str] = "Transisi status event tidak valid"
    NO_ACTIVE_EVENT: Final[str] = (
        "Tidak ada event yang sedang berlangsung. Input pengunjung hanya aktif saat event berjalan."
    )

    # --- 401 Unauthorized ----------------------------------------------------
    SESSION_EXPIRED: Final[str] = "Sesi Anda telah berakhir"
    INVALID_CREDENTIALS: Final[str] = "Email atau password salah"

    # --- 403 Forbidden -------------------------------------------------------
    FORBIDDEN: Final[str] = "Anda tidak memiliki akses"
    ACCOUNT_NOT_ACTIVE: Final[str] = "Akun Anda tidak aktif"
    ACCOUNT_SUSPENDED: Final[str] = "Akun Anda disuspend"
    ACCOUNT_PENDING: Final[str] = "Akun Anda masih menunggu persetujuan"
    ACCOUNT_REJECTED: Final[str] = "Pendaftaran akun Anda ditolak"

    # --- 404 Not Found -------------------------------------------------------
    NOT_FOUND: Final[str] = "Sumber daya tidak ditemukan"
    ARTISAN_NOT_FOUND: Final[str] = "Artisan tidak ditemukan"
    KOLABORATOR_NOT_FOUND: Final[str] = "Kolaborator tidak ditemukan"
    EVENT_NOT_FOUND: Final[str] = "Event tidak ditemukan"
    REQUEST_NOT_FOUND: Final[str] = "Permintaan tidak ditemukan"
    PETUGAS_NOT_FOUND: Final[str] = "Petugas tidak ditemukan"
    KARYA_NOT_FOUND: Final[str] = "Karya tidak ditemukan"
    STORY_NOT_FOUND: Final[str] = "Story tidak ditemukan"
    PROFILE_NOT_FOUND: Final[str] = "Profil tidak ditemukan"
    NOTIFICATION_NOT_FOUND: Final[str] = "Notifikasi tidak ditemukan"

    # --- 409 Conflict --------------------------------------------------------
    EMAIL_REGISTERED: Final[str] = "Email sudah terdaftar"
    USERNAME_TAKEN: Final[str] = "Username sudah digunakan"
    ALREADY_REGISTERED: Final[str] = "Anda sudah mendaftar"
    DUPLICATE_REQUEST: Final[str] = "Permintaan duplikat"
    STAND_OCCUPIED: Final[str] = "Stand sudah ditempati"

    # --- 422 Unprocessable Entity -------------------------------------------
    VALIDATION_FAILED: Final[str] = "Validasi gagal"

    # --- 500 Internal Server Error ------------------------------------------
    INTERNAL_ERROR: Final[str] = "Terjadi kesalahan pada server"

    # --- 501 Not Implemented (STUB endpoints) -------------------------------
    NOT_IMPLEMENTED: Final[str] = "Fitur belum tersedia"
    OTP_GATEWAY_DISABLED: Final[str] = "OTP gateway belum dikonfigurasi"
