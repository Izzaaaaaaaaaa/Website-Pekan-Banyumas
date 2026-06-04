// src/pages/Reports.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronDown, FileSpreadsheet, FileText,
    ArrowRight, ArrowLeft, IdCard, User,
    Download, AlertTriangle, X, Loader2,
    Users, TrendingUp, UserCheck, Info, Store, BarChart2, CalendarDays
} from 'lucide-react';
import { eventApi, reportsApi } from '../services/endpoints';
import { extractError } from '../lib/unwrap';
import { useToast } from '../components/Toast';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ITEMS_PER_PAGE = 15;

const getLocalDateStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// Format tanggal YYYY-MM-DD → "Sen, 1 Jan 2025"
const fmtTanggal = (s) => new Date(s + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
});

const Reports = () => {
    const toast = useToast();
    // ── Events list (untuk primary selector) ─────────────────────────────
    // ── Report tab ───────────────────────────────────────────────────────────
    const [reportTab, setReportTab] = useState('pengunjung'); // pengunjung | artisan_report | akumulasi

    const [events, setEvents]             = useState([]);
    const [isLoadingEvents, setLoadingEv] = useState(true);

    // ── Filter state ──────────────────────────────────────────────────────
    // selectedEventId kosong = belum pilih event (tampilkan placeholder)
    const [selectedEventId, setSelectedEventId] = useState('');
    // selectedDate kosong = semua hari event; isi = drill-down ke hari itu
    const [selectedDate, setSelectedDate]       = useState('');

    // ── Report data ───────────────────────────────────────────────────────
    const [reportData, setReportData]           = useState(null);
    const [isLoading, setIsLoading]             = useState(false);
    // tanggal_range HANYA diperbarui saat fetch full-event (tanpa selectedDate).
    // Ini mencegah pills hilang saat user drill-down ke hari tertentu.
    const [eventTanggalRange, setEventTanggalRange] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);

    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [exportFormat, setExportFormat] = useState('');
    const [isExporting, setIsExporting]   = useState(false);

    // ── Load daftar event saat mount ──────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                // eventApi.list returns the unwrapped Array<Event> directly.
                const raw = (await eventApi.list()) || [];
                // Urutkan: terbaru dulu berdasarkan tanggal
                const sorted = [...raw].sort((a, b) =>
                    new Date(b.tanggal) - new Date(a.tanggal)
                );
                setEvents(sorted);
                // Auto-pilih event aktif jika ada
                const aktif = sorted.find(e => e.status === 'aktif');
                if (aktif) setSelectedEventId(aktif.id);
            } catch (error) {
                toast.error(extractError(error, 'Gagal memuat daftar event.'));
            } finally {
                setLoadingEv(false);
            }
        })();
    }, [toast]);

    // ── Fetch laporan setiap kali filter berubah ──────────────────────────
    const fetchReports = useCallback(async () => {
        if (!selectedEventId && !selectedDate) {
            setReportData(null);
            return;
        }
        try {
            setIsLoading(true);
            const params = {};
            if (selectedEventId) params.event_id = selectedEventId;
            if (selectedDate)    params.tanggal   = selectedDate;
            if (!selectedEventId && !selectedDate) params.tanggal = getLocalDateStr();

            // reportsApi.list returns the unwrapped report payload directly.
            const data = (await reportsApi.list(params)) || null;
            setReportData(data);
            setCurrentPage(1);

            // Hanya update eventTanggalRange saat fetch full-event (tanpa drill-down tanggal).
            // Saat drill-down ke hari tertentu, tanggal_range dari response hanya berisi
            // 1 entry → jangan overwrite, biarkan pills tetap tampil dari state lama.
            if (!selectedDate && data?.tanggal_range) {
                setEventTanggalRange(data.tanggal_range);
            }
        } catch (error) {
            console.error('Gagal mengambil data laporan:', error);
            toast.error(extractError(error, 'Gagal mengambil data laporan.'));
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    }, [selectedEventId, selectedDate, toast]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    // Reset date drill-down, tanggal_range, dan page saat event berubah
    useEffect(() => {
        setSelectedDate('');
        setEventTanggalRange([]);
        setCurrentPage(1);
    }, [selectedEventId]);


    const handleOpenExportModal = (format) => {
        setExportFormat(format);
        setIsModalOpen(true);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const formatParam = exportFormat.toLowerCase() === 'excel' ? 'excel' : 'pdf';
            const safeName = (reportData?.nama || 'laporan').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
            const suffix = selectedDate || safeName;
            const title = `Laporan Kunjungan - ${reportData?.nama || 'Semua Event'}`;
            const filename = `laporan_kunjungan_${suffix}`;
            
            const headers = ['Identitas', 'Tipe', 'Waktu Masuk', 'Waktu Keluar', 'Durasi', 'Status'];
            const rows = filteredReports.map(r => {
                const isKolaborator = !!r.uid;
                
                let identitas = 'Pengunjung Manual';
                if (isKolaborator) {
                    const nama = r.nama || '-';
                    const idShort = r.uid ? r.uid.substring(0, 8) : '-';
                    identitas = `${nama} (UID: ${idShort})`;
                }

                const tipe = isKolaborator ? 'NFC' : 'Manual';
                const fmtD = (d) => d ? new Date(d).toLocaleString('id-ID') : '-';
                
                let durasi = '-';
                if (r.waktu_masuk && r.waktu_keluar) {
                    const diffMs = new Date(r.waktu_keluar) - new Date(r.waktu_masuk);
                    const mins = Math.max(0, Math.round(diffMs / 60000));
                    durasi = `${mins} mnt`;
                } else if (r.status === 'di_dalam') {
                    durasi = 'Masih di dalam';
                }
                
                return [
                    identitas,
                    tipe,
                    fmtD(r.waktu_masuk),
                    fmtD(r.waktu_keluar),
                    durasi,
                    r.status === 'di_dalam' ? 'Di Dalam' : 'Keluar'
                ];
            });

            if (formatParam === 'excel') {
                await exportExcel(filename, headers, rows, title);
            } else {
                const summaryRows = [
                    ['TOTAL', '', '', '', '', `${filteredReports.length} Pengunjung`]
                ];
                exportPDF(title, headers, rows, summaryRows);
            }
            
            setIsModalOpen(false);
        } catch (error) {
            toast.error(extractError(error, `Gagal mengunduh file ${exportFormat}. Silakan coba lagi.`));
            console.error(error);
        } finally {
            setIsExporting(false);
        }
    };

    // --- FILTER & PAGINATION ---

    // Backend returns the visitor list under `rows` (with a `ringkasan` summary
    // block). Older drafts read `detail`; keep it as a defensive fallback.
    const allDetail = reportData?.rows || reportData?.detail || [];

    const filteredReports = allDetail; // semua pengunjung ter-scan NFC

    // [FIX] Hitung halaman dan slice data untuk halaman aktif
    const totalItems = filteredReports.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const indexOfFirst = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    const indexOfLast = indexOfFirst + ITEMS_PER_PAGE;
    const pagedReports = filteredReports.slice(indexOfFirst, indexOfLast);

    // Generate nomor halaman yang ditampilkan (max 5 halaman di sekitar halaman aktif)
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        for (
            let i = Math.max(1, safeCurrentPage - delta);
            i <= Math.min(totalPages, safeCurrentPage + delta);
            i++
        ) {
            range.push(i);
        }
        return range;
    };

    return (
        <div className="font-[Montserrat] h-full flex flex-col relative space-y-4">

          {/* ── Report Tab Bar ── */}
          <div className="flex gap-1 bg-white rounded-[16px] border border-[#e4e7d4] p-1 shadow-sm self-start">
            {[
              { v:'pengunjung', l:'Laporan Pengunjung', Icon:Users },
              { v:'artisan_report',     l:'Laporan Artisan',       Icon:Store },
              { v:'akumulasi',  l:'Akumulasi Event',    Icon:BarChart2 },
            ].map(({ v, l, Icon }) => (
              <button key={v} onClick={() => setReportTab(v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-semibold transition ${reportTab===v ? 'bg-[#7a8a52] text-white shadow' : 'text-[#8a9070] hover:bg-[#f7f8f2]'}`}>
                <Icon size={14}/>{l}
              </button>
            ))}
          </div>

          {/* ── Tab: Pengunjung (existing) ── */}
          {reportTab === 'pengunjung' && (
          <div className="flex flex-col gap-6 flex-1">

            {/* RINGKASAN STATISTIK */}
            {reportData?.ringkasan && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#eef4eb] text-[#7a8a52] flex items-center justify-center shrink-0">
                            <Users size={18} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1e2010]">{reportData.ringkasan.total_kunjungan}</div>
                            <div className="text-xs text-[#8a9070]">Total Kunjungan</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#eef4eb] text-[#7a8a52] flex items-center justify-center shrink-0">
                            <UserCheck size={18} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1e2010]">{reportData.ringkasan.total_nfc}</div>
                            <div className="text-xs text-[#8a9070]">Pengunjung NFC</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-5 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <TrendingUp size={18} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#1e2010]">{reportData.ringkasan.total_unik ?? reportData.ringkasan.total_manual ?? "—"}</div>
                            <div className="text-xs text-[#8a9070]">Pengunjung Unik</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[16px] shadow-sm border border-[#e4e7d4] overflow-hidden flex flex-col flex-1">

                {/* TOOLBAR */}
                <div className="p-6 border-b border-[#e4e7d4] flex flex-col gap-4 bg-[#f7f8f2]/30 shrink-0">

                    {/* Baris 1: Event picker + filter tipe + export */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">

                            {/* Primary: Event picker */}
                            <div className="relative">
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    disabled={isLoadingEvents}
                                    className="appearance-none bg-white border border-[#e4e7d4] text-[#5a6040] py-2.5 pl-4 pr-10 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#7a8a52] text-sm font-medium cursor-pointer shadow-sm w-full sm:w-64 disabled:opacity-50"
                                >
                                    <option value="">
                                        {isLoadingEvents ? 'Memuat event...' : '— Pilih Event —'}
                                    </option>
                                    {events.map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            {ev.nama}
                                            {ev.status === 'aktif' ? ' ●' : ''}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[#8a9070]">
                                    <ChevronDown size={16} />
                                </div>
                            </div>

                        </div>

                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <button
                                onClick={() => handleOpenExportModal('Excel')}
                                disabled={!selectedEventId}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#eef0e0] text-[#7a8a52] hover:bg-[#eef4eb] border border-[#c8d09a] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-[12px] font-semibold text-sm transition"
                            >
                                <FileSpreadsheet size={16} /> Export Excel
                            </button>
                            <button
                                onClick={() => handleOpenExportModal('PDF')}
                                disabled={!selectedEventId}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-[#f7eeee] text-[#a05f5f] hover:bg-[#f7eeee] border border-[#dbb8b8] disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-[12px] font-semibold text-sm transition"
                            >
                                <FileText size={16} /> Export PDF
                            </button>
                        </div>
                    </div>

                    {/* Baris 2: Date pills — hanya tampil jika event punya lebih dari 1 hari */}
                    {eventTanggalRange.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-[#8a9070] font-medium shrink-0">Filter hari:</span>
                            <button
                                onClick={() => setSelectedDate('')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                    selectedDate === ''
                                        ? 'bg-[#7a8a52] text-white border-[#4f5c30]'
                                        : 'bg-white text-[#5a6040] border-[#e4e7d4] hover:border-[#7a8a52]'
                                }`}
                            >
                                Semua Hari ({eventTanggalRange.length})
                            </button>
                            {eventTanggalRange.map(tgl => (
                                <button
                                    key={tgl}
                                    onClick={() => setSelectedDate(tgl === selectedDate ? '' : tgl)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                                        selectedDate === tgl
                                            ? 'bg-[#7a8a52] text-white border-[#4f5c30]'
                                            : 'bg-white text-[#5a6040] border-[#e4e7d4] hover:border-[#7a8a52]'
                                    }`}
                                >
                                    {fmtTanggal(tgl)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* TABEL DATA */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                        <tr className="bg-white text-[#8a9070] text-xs uppercase tracking-wider border-b border-[#e4e7d4] sticky top-0 z-10">
                            <th className="px-6 py-4 font-semibold">Waktu Masuk</th>
                            <th className="px-6 py-4 font-semibold">Tipe</th>
                            <th className="px-6 py-4 font-semibold">Identitas</th>
                            <th className="px-6 py-4 font-semibold">Waktu Keluar</th>
                            <th className="px-6 py-4 font-semibold">Durasi</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                        </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-[#8a9070]">
                                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-[#7a8a52]" />
                                    Memuat data laporan...
                                </td>
                            </tr>
                        ) : !selectedEventId ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-[#8a9070]">
                                    Pilih event di atas untuk melihat laporan kunjungan.
                                </td>
                            </tr>
                        ) : pagedReports.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-[#8a9070]">
                                    Tidak ada data untuk filter yang dipilih.
                                </td>
                            </tr>
                        ) : (
                            pagedReports.map((row) => {
                                const isKolaborator = !!row.uid;

                                const waktuMasuk = row.waktu_masuk ? new Date(row.waktu_masuk) : null;
                                const waktuKeluar = row.waktu_keluar ? new Date(row.waktu_keluar) : null;
                                
                                let durasiMenit = row.durasi_menit;
                                if (durasiMenit == null && waktuMasuk && waktuKeluar) {
                                    durasiMenit = Math.max(0, Math.round((waktuKeluar - waktuMasuk) / 60000));
                                }

                                const fmtDate = (d) => d
                                    ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                                    : '-';
                                const fmtJam = (d) => d
                                    ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                    : '-';

                                return (
                                    <tr key={row.id} className="hover:bg-[#f7f8f2] transition">

                                        {/* Waktu Masuk — akurat untuk semua tipe */}
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-[#5a6040]">{fmtDate(waktuMasuk)}</div>
                                            <div className="text-xs text-[#8a9070]">{fmtJam(waktuMasuk)} WIB</div>
                                        </td>

                                        {/* Tipe */}
                                        <td className="px-6 py-4">
                                            {isKolaborator ? (
                                                <span className="inline-flex items-center gap-1.5 bg-[#eef0e0] text-[#4f5c30] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#eef0e0]">
                                                    <IdCard size={14} /> NFC
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 bg-[#eef0e0] text-[#5a6040] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#e4e7d4]">
                                                    <User size={14} /> Manual
                                                </span>
                                            )}
                                        </td>

                                        {/* Identitas */}
                                        <td className="px-6 py-4">
                                            {isKolaborator ? (
                                                <>
                                                    <div className="font-semibold text-[#1e2010]">{row.nama || '-'}</div>
                                                    <div className="text-xs text-[#8a9070] font-mono">
                                                        UID: {row.uid?.substring(0, 8)}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="font-medium text-[#8a9070] italic">Pengunjung Manual</div>
                                            )}
                                        </td>

                                        {/* Waktu Keluar */}
                                        <td className="px-6 py-4">
                                            {waktuKeluar ? (
                                                <>
                                                    <div className="font-medium text-[#5a6040]">{fmtDate(waktuKeluar)}</div>
                                                    <div className="text-xs text-[#8a9070]">{fmtJam(waktuKeluar)} WIB</div>
                                                </>
                                            ) : (
                                                <span className="text-xs text-[#8a9070]">—</span>
                                            )}
                                        </td>

                                        {/* Durasi */}
                                        <td className="px-6 py-4">
                                            {durasiMenit != null ? (
                                                <span className="text-sm text-[#5a6040] font-medium">
                                                    {durasiMenit} mnt
                                                </span>
                                            ) : row.status === 'di_dalam' ? (
                                                <span className="text-xs text-[#8a9070]">Masih di dalam</span>
                                            ) : (
                                                <span className="text-xs text-[#8a9070]">—</span>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {row.status === 'di_dalam' ? (
                                                <span className="text-[#7a8a52] font-bold flex items-center gap-1.5 text-sm">
                                                    <ArrowRight size={14} /> Di Dalam
                                                </span>
                                            ) : (
                                                <span className="text-[#8a9070] font-bold flex items-center gap-1.5 text-sm">
                                                    <ArrowLeft size={14} /> Keluar
                                                </span>
                                            )}
                                        </td>

                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>

                {/* [FIX] PAGINATION — sebelumnya sepenuhnya static/placeholder:
                    Prev/Next selalu disabled hardcoded, selalu menampilkan halaman 1,
                    tidak ada state page, semua data ditampilkan sekaligus.
                    Sekarang: fully functional dengan state currentPage, slice data,
                    nomor halaman dinamis, Prev/Next berfungsi. */}
                <div className="p-4 border-t border-[#e4e7d4] bg-white flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-[#8a9070] shrink-0">
                    <span>
                        {!selectedEventId
                            ? 'Pilih event untuk melihat data'
                            : totalItems === 0
                                ? 'Tidak ada data'
                                : `Menampilkan ${indexOfFirst + 1}–${Math.min(indexOfLast, totalItems)} dari ${totalItems} entri`
                        }
                        {reportData?.nama && (
                            <span className="ml-2 text-xs text-[#8a9070]">
                                — <strong className="text-[#5a6040]">{reportData.nama}</strong>
                                {selectedDate
                                    ? ` · ${fmtTanggal(selectedDate)}`
                                    : eventTanggalRange.length > 1
                                        ? ` · ${eventTanggalRange.length} hari`
                                        : eventTanggalRange.length === 1
                                            ? ` · ${fmtTanggal(eventTanggalRange[0])}`
                                            : ''
                                }
                            </span>
                        )}
                    </span>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            {/* Tombol Prev */}
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={safeCurrentPage === 1}
                                className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg hover:bg-[#f7f8f2] disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium"
                            >
                                &laquo; Prev
                            </button>

                            {/* Elipsis kiri */}
                            {getPageNumbers()[0] > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg hover:bg-[#f7f8f2] transition text-xs font-medium"
                                    >
                                        1
                                    </button>
                                    {getPageNumbers()[0] > 2 && (
                                        <span className="px-2 text-[#8a9070]">…</span>
                                    )}
                                </>
                            )}

                            {/* Nomor halaman di sekitar halaman aktif */}
                            {getPageNumbers().map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1.5 border rounded-lg transition text-xs font-medium ${
                                        page === safeCurrentPage
                                            ? 'bg-[#7a8a52] text-white border-[#4f5c30]'
                                            : 'border-[#e4e7d4] hover:bg-[#f7f8f2]'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {/* Elipsis kanan */}
                            {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                                <>
                                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                                        <span className="px-2 text-[#8a9070]">…</span>
                                    )}
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg hover:bg-[#f7f8f2] transition text-xs font-medium"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}

                            {/* Tombol Next */}
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={safeCurrentPage === totalPages}
                                className="px-3 py-1.5 border border-[#e4e7d4] rounded-lg hover:bg-[#f7f8f2] disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium"
                            >
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL EXPORT */}
            <ExportModal
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              subtitle="Laporan Kunjungan Event"
              details={[
                ['Event', reportData?.nama || events.find(e => e.id === selectedEventId)?.nama || '—'],
                ['Scope', selectedDate ? fmtTanggal(selectedDate) : eventTanggalRange.length > 1 ? `Seluruh Event (${eventTanggalRange.length} hari)` : 'Seluruh Event'],
                      ['Total Data', `${filteredReports.length} entri`],
                ['Format', exportFormat + ' Document'],
              ]}
              onExcel={() => { setExportFormat('Excel'); handleExport(); }}
              onPdf={()    => { setExportFormat('PDF');   handleExport(); }}
            />
          </div>
          )} {/* end pengunjung tab */}

          {/* ── Tab: Laporan Artisan ── */}
          {reportTab === 'artisan_report' && <ArtisanReport events={events} isLoadingEvents={isLoadingEvents}/>}

          {/* ── Tab: Akumulasi Event ── */}
          {reportTab === 'akumulasi' && <AccumulationReport events={events}/>}

        </div>
    );
};
// ── Shared client-side export helpers ────────────────────────────────────────
// Excel: Generated using exceljs for professional look
async function exportExcel(filename, headers, rows, title = '') {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Laporan');

  let startRow = 1;

  if (title) {
    sheet.mergeCells('A1', String.fromCharCode(64 + headers.length) + '1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1A3A2A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 30;
    startRow = 3;
  }

  // Add Headers
  const headerRow = sheet.getRow(startRow);
  headerRow.values = headers;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F6F4E' }
    };
    cell.font = {
      name: 'Arial',
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  headerRow.height = 25;

  // Add Data Rows
  rows.forEach((rowData, index) => {
    const dataRow = sheet.getRow(startRow + 1 + index);
    dataRow.values = rowData;
    dataRow.eachCell((cell) => {
      cell.font = { name: 'Arial' };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
      };
    });
    // Add slight background for alternating rows (optional)
    if (index % 2 === 1) {
      dataRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      });
    }
  });

  // Adjust column widths based on content
  sheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber >= startRow) { // Only check headers and data
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      }
    });
    column.width = Math.min(Math.max(maxLength + 2, 12), 40);
  });

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const finalFilename = filename.replace(/\.(csv|xls|xlsx)$/, '') + '.xlsx';
  saveAs(blob, finalFilename);
}

// PDF: print-friendly HTML opened in new window
function exportPDF(title, headers, rows, summaryRows) {
  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const sr  = summaryRows || [];
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:'Montserrat',Arial,sans-serif;font-size:11px;margin:20px;color:#111}
  h2{font-size:15px;margin-bottom:3px;color:#1a3a2a}
  .meta{font-size:10px;color:#666;margin-bottom:14px}
  table{width:100%;border-collapse:collapse}
  th{background:#2f6f4e;color:#fff;padding:6px 9px;text-align:left;font-size:10px;white-space:nowrap}
  td{padding:5px 9px;border-bottom:1px solid #e5e7eb;font-size:10px}
  tr.total td{font-weight:700;background:#f0fdf4;border-top:2px solid #2f6f4e}
  @media print{@page{margin:12mm}}
</style></head><body>
<h2>${esc(title)}</h2>
<div class="meta">Dicetak: ${new Date().toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} &nbsp;·&nbsp; Peken Banyumasan</div>
<table>
  <thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>
    ${rows.map(r=>`<tr>${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}
    ${sr.map(r=>`<tr class="total">${r.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}
  </tbody>
</table>
<script>window.onload=()=>window.print()</script>
</body></html>`;
  const w = window.open('','_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

// ── Shared Export Modal — reused by all 3 report tabs ─────────────────────────
function ExportModal({ open, onClose, subtitle, details, onExcel, onPdf }) {
  if (!open) return null;
  const formatDetail = details.find(d => d[0] === 'Format');
  const isExcel = formatDetail && formatDetail[1].includes('Excel');
  const isPdf = formatDetail && formatDetail[1].includes('PDF');

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#7a8a52] p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
              <Download size={20}/>
            </div>
            <div className="text-white">
              <h3 className="font-bold text-lg leading-tight">Konfirmasi Export</h3>
              <p className="text-[#eef0e0] text-xs">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#c8d09a] hover:text-white transition">
            <X size={22}/>
          </button>
        </div>
        <div className="p-6">
          <p className="text-[#5a6040] text-sm mb-4">Pastikan rincian berikut sudah benar:</p>
          <div className="bg-[#f7f8f2] rounded-[12px] p-4 border border-[#e4e7d4] mb-5 space-y-2 text-sm">
            {details.map(([label, val]) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-[#8a9070] shrink-0">{label}:</span>
                <span className="font-bold text-[#1e2010] text-right truncate">{val}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            {(!formatDetail || isExcel) && (
              <button onClick={() => { onExcel(); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#eef0e0] text-[#7a8a52] hover:bg-[#eef4eb] border border-[#c8d09a] px-4 py-2.5 rounded-[12px] font-semibold text-sm transition">
                <FileSpreadsheet size={16}/> Lanjutkan Export Excel
              </button>
            )}
            {(!formatDetail || isPdf) && (
              <button onClick={() => { onPdf(); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 bg-[#f7eeee] text-[#a05f5f] hover:bg-[#f7eeee] border border-[#dbb8b8] px-4 py-2.5 rounded-[12px] font-semibold text-sm transition">
                <FileText size={16}/> Lanjutkan Export PDF
              </button>
            )}
          </div>
        </div>
        <div className="px-6 py-3 bg-[#f7f8f2] border-t border-[#e4e7d4] flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 text-[#5a6040] font-semibold text-sm hover:bg-gray-200 rounded-[12px] transition">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
// ── Artisan Report Tab ─────────────────────────────────────────────────────────
const DEMO_ARTISAN_REPORT = [
  { id:'t1', nama_usaha:'Batik Sari Rahayu',    kategori:'Kriya & Fashion', omset:4850000, komisi_persen:15, transaksi:42, event_count:3, stand_terakhir:'A-3' },
  { id:'t2', nama_usaha:'Keripik Tempe Mrisi',  kategori:'Kuliner',         omset:2340000, komisi_persen:15, transaksi:98, event_count:2, stand_terakhir:'B-2' },
  { id:'t3', nama_usaha:'Calung Mas',           kategori:'Seni Pertunjukan',omset:1200000, komisi_persen:10, transaksi:24, event_count:4, stand_terakhir:'C-1' },
  { id:'t4', nama_usaha:'Tenun Lurik Cilacap',  kategori:'Kriya & Fashion', omset:3650000, komisi_persen:15, transaksi:31, event_count:2, stand_terakhir:'A-5' },
  { id:'t5', nama_usaha:'Dawet Ayu Bu Tari',    kategori:'Kuliner',         omset:1980000, komisi_persen:12, transaksi:76, event_count:3, stand_terakhir:'B-7' },
  { id:'t6', nama_usaha:'Anyam Bambu Banyumas', kategori:'Kriya & Fashion', omset:890000,  komisi_persen:15, transaksi:15, event_count:1, stand_terakhir:'A-2' },
];
// Money fields arrive from the API as Decimal strings ("1910000.00") — coerce
// with Number() so toLocaleString formats them (a raw string is returned as-is).
const fmtRp = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const IS_DUMMY = import.meta.env.VITE_DUMMY_MODE === 'true';

function ArtisanReport({ events = [] }) {
  const toast = useToast();
  const [selEvent,   setSelEvent]   = React.useState('');
  const [sortBy,     setSortBy]     = React.useState('omset');
  const [search,     setSearch]     = React.useState('');
  const [showExport, setShowExport] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState('');
  const [rawData,    setRawData]    = React.useState(IS_DUMMY ? DEMO_ARTISAN_REPORT : []);
  const [loading,    setLoading]    = React.useState(false);
  const [errorMsg,   setErrorMsg]   = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    const params = selEvent ? { event_id: selEvent } : {};
    reportsApi.artisan(params)
      .then(d => { setRawData(Array.isArray(d) ? d : []); })
      .catch(err => {
        if (!IS_DUMMY) {
          toast.error(extractError(err, 'Gagal memuat laporan artisan'));
          setErrorMsg('Belum ada data laporan artisan');
          setRawData([]);
        }
      })
      .finally(() => setLoading(false));
  }, [selEvent]);

  const data = React.useMemo(() =>
    rawData
      .filter(t => !search || t.nama_usaha.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'omset')     return b.omset - a.omset;
        if (sortBy === 'komisi')    return (b.omset * b.komisi_persen / 100) - (a.omset * a.komisi_persen / 100);
        if (sortBy === 'transaksi') return b.transaksi - a.transaksi;
        if (sortBy === 'event')     return b.event_count - a.event_count;
        return a.nama_usaha.localeCompare(b.nama_usaha);
      }),
    [rawData, sortBy, search]
  );

  const totalOmset  = data.reduce((s, t) => s + Number(t.omset || 0), 0);
  const totalKomisi = data.reduce((s, t) => s + Math.round(Number(t.omset || 0) * Number(t.komisi_persen || 0) / 100), 0);
  const totalTrx    = data.reduce((s, t) => s + Number(t.transaksi || 0), 0);

  const HDRS = ['Nama Usaha','Kategori','Stand Terakhir','Omset (Rp)','Komisi (Rp)','% Komisi','Netto (Rp)','Transaksi','Event Diikuti'];
  const makeRows = () => data.map(t => {
    const k = Math.round(t.omset * t.komisi_persen / 100);
    return [t.nama_usaha, t.kategori, t.stand_terakhir, t.omset, k, t.komisi_persen + '%', t.omset - k, t.transaksi, t.event_count + 'x'];
  });
  const makeTot = () => [['TOTAL (' + data.length + ' Artisan)', '', '', totalOmset, totalKomisi, '', totalOmset - totalKomisi, totalTrx, '']];

  return (
    <div className="space-y-4">

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Omset Artisan',   value: fmtRp(totalOmset),   cls: 'text-[#7a8a52]', bg: 'bg-[#eef4eb]' },
          { label: 'Total Komisi Masuk', value: fmtRp(totalKomisi),  cls: 'text-[#C4A24D]', bg: 'bg-[#f7f2e4]' },
          { label: 'Total Transaksi',    value: totalTrx + ' trx',   cls: 'text-[#6B8FA3]',  bg: 'bg-blue-100'  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.bg}`}>
              <Store size={18} className={s.cls} />
            </div>
            <div>
              <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-[#8a9070]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <select value={selEvent} onChange={e => setSelEvent(e.target.value)}
          className="px-3 py-2 border border-[#e4e7d4] rounded-[12px] text-sm text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-[#7a8a52]">
          <option value="">Semua Event</option>
          {events.map(e => <option key={e.id} value={e.id}>{e.nama || 'Event'}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama usaha..."
          className="px-3 py-2 border border-[#e4e7d4] rounded-[12px] text-sm focus:outline-none focus:border-[#7a8a52] w-48" />
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-[#8a9070] font-semibold uppercase tracking-wider">Urutkan:</span>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 border border-[#e4e7d4] rounded-[12px] text-sm text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-[#7a8a52]">
            <option value="omset">Omset Tertinggi</option>
            <option value="komisi">Komisi Terbesar</option>
            <option value="transaksi">Transaksi Terbanyak</option>
            <option value="event">Paling Sering Ikut</option>
            <option value="nama">Nama A–Z</option>
          </select>
          <button onClick={() => { setExportFormat('Excel'); setShowExport(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#eef0e0] text-[#7a8a52] hover:bg-[#eef4eb] border border-[#c8d09a] rounded-[12px] text-xs font-semibold transition whitespace-nowrap">
            <FileSpreadsheet size={13} /> Export Excel
          </button>
          <button onClick={() => { setExportFormat('PDF'); setShowExport(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#f7eeee] text-[#a05f5f] hover:bg-[#f7eeee] border border-[#dbb8b8] rounded-[12px] text-xs font-semibold transition whitespace-nowrap">
            <FileText size={13} /> Export PDF
          </button>
        </div>
        <p className="w-full text-[11px] text-[#8a9070] mt-1 flex items-center gap-1">
          <Info size={11}/> Export mengikuti filter aktif — cari nama Artisan tertentu untuk export per-Artisan
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm overflow-auto">
        {loading && (
          <div className="py-8 flex items-center justify-center gap-2 text-[#8a9070] text-sm">
            <Loader2 size={16} className="animate-spin"/><span>Memuat data artisan...</span>
          </div>
        )}
        {!loading && rawData.length === 0 && (
          <div className="py-12 text-center">
            <Store size={32} className="text-gray-200 mx-auto mb-3"/>
            <p className="text-sm font-semibold text-[#5a6040]">{errorMsg || 'Belum ada data laporan artisan'}</p>
            {!IS_DUMMY && <p className="text-xs text-[#8a9070] mt-1">Data akan muncul setelah backend live dan event selesai dijalankan.</p>}
          </div>
        )}
        {!loading && rawData.length > 0 && (
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead>
            <tr className="border-b border-[#e4e7d4] bg-[#f7f8f2]/80">
              {['Artisan', 'Kategori', 'Omset', 'Komisi', 'Netto', 'Trx', 'Event'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-bold text-[#8a9070] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(t => {
              const k = Math.round(t.omset * t.komisi_persen / 100);
              return (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-[#f7f8f2]/50 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#1e2010]">{t.nama_usaha}</p>
                    <p className="text-xs text-[#8a9070]">{t.stand_terakhir}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8a9070]">{t.kategori}</td>
                  <td className="px-4 py-3 font-semibold text-[#1e2010]">{fmtRp(t.omset)}</td>
                  <td className="px-4 py-3 text-[#B87272] text-xs">
                    −{fmtRp(k)} <span className="text-[#8a9070]">({t.komisi_persen}%)</span>
                  </td>
                  <td className="px-4 py-3 text-[#7a8a52] font-bold">{fmtRp(t.omset - k)}</td>
                  <td className="px-4 py-3 text-[#5a6040]">{t.transaksi}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-[#eaf0f4] text-[#6B8FA3] rounded-full text-xs font-bold">
                      {t.event_count}×
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#f7f8f2] border-t border-[#e4e7d4]">
              <td className="px-4 py-3 font-bold text-[#5a6040] text-sm" colSpan={2}>Total ({data.length} Artisan)</td>
              <td className="px-4 py-3 font-bold text-[#1e2010]">{fmtRp(totalOmset)}</td>
              <td className="px-4 py-3 font-bold text-[#B87272]">−{fmtRp(totalKomisi)}</td>
              <td className="px-4 py-3 font-bold text-[#7a8a52]">{fmtRp(totalOmset - totalKomisi)}</td>
              <td className="px-4 py-3 font-bold text-[#1e2010]">{totalTrx}</td>
              <td />
            </tr>
          </tfoot>
        </table>
        )}
      </div>

      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        subtitle="Laporan Artisan – Peken Banyumasan"
        details={[
          ['Total Artisan',      `${data.length} usaha`],
          ['Filter Event',    selEvent ? (events.find(e => e.id === selEvent)?.nama || selEvent) : 'Semua Event'],
          ['Filter Nama',     search || '—'],
          ['Total Omset',     `Rp ${totalOmset.toLocaleString('id-ID')}`],
          ['Total Transaksi', `${totalTrx} trx`],
          ['Format',          exportFormat + ' Document'],
        ]}
        onExcel={() => exportExcel('laporan_artisan', HDRS, makeRows(), 'Laporan Pendapatan Artisan')}
        onPdf={()   => exportPDF('Laporan Artisan – Peken Banyumasan', HDRS, makeRows(), makeTot())}
      />
    </div>
  );
}

// ── Accumulation Report Tab ───────────────────────────────────────────────────
const DEMO_ACCUM = [
  { id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', status:'mendatang',  pengunjung:0,    artisan_count:8,  kolaborator_count:12, omset_artisan:0,        komisi:0 },
  { id:'e2', nama:'Workshop Batik & Tenun Nusantara', tanggal:'2025-04-26', status:'mendatang', pengunjung:0,    artisan_count:3,  kolaborator_count:5,  omset_artisan:0,        komisi:0 },
  { id:'e4', nama:'Peken Banyumasan #12',             tanggal:'2025-03-20', status:'selesai',   pengunjung:1247, artisan_count:24, kolaborator_count:18, omset_artisan:28450000, komisi:4267500 },
];

function AccumulationReport({ events = [] }) {
  const toast = useToast();
  const [selEvent,   setSelEvent]   = React.useState('');
  const [showExport, setShowExport] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState('');
  const [data,       setData]       = React.useState(IS_DUMMY ? DEMO_ACCUM : []);
  const [loading,    setLoading]    = React.useState(false);
  const [errorMsg,   setErrorMsg]   = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    const params = selEvent ? { event_id: selEvent } : {};
    reportsApi.accumulation(params)
      .then(d => { setData(Array.isArray(d) ? d : []); })
      .catch(err => {
        if (!IS_DUMMY) {
          toast.error(extractError(err, 'Gagal memuat laporan akumulasi'));
          setErrorMsg('Belum ada data laporan akumulasi');
          setData([]);
        }
      })
      .finally(() => setLoading(false));
  }, [selEvent]);

  const selesai = data.filter(e => e.status === 'selesai');
  const totP    = selesai.reduce((s,e) => s + Number(e.pengunjung || 0), 0);
  const totO    = selesai.reduce((s,e) => s + Number(e.omset_artisan || 0), 0);
  const totK    = selesai.reduce((s,e) => s + Number(e.komisi || 0), 0);

  const HDRS = ['Nama Event','Tanggal','Status','Pengunjung','Kolaborator Hadir','Artisan','Omset Artisan (Rp)','Komisi (Rp)'];
  const ROWS = data.map(e => [e.nama, new Date(e.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }), e.status, e.pengunjung||0, e.kolaborator_count, e.artisan_count, e.omset_artisan||0, e.komisi||0]);
  const TOT  = selesai.length > 0
    ? [['TOTAL (selesai)','','', totP, selesai.reduce((s,e)=>s+e.kolaborator_count,0), selesai.reduce((s,e)=>s+e.artisan_count,0), totO, totK]]
    : [];

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center gap-2 text-[#8a9070] text-sm px-1">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          Memuat data akumulasi…
        </div>
      )}
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Event Selesai',     value: selesai.length + ' event', cls:'text-[#5a6040]' },
          { label:'Total Pengunjung',  value: totP.toLocaleString('id-ID'), cls:'text-[#7a8a52]' },
          { label:'Total Omset Artisan',  value: fmtRp(totO), cls:'text-[#C4A24D]' },
          { label:'Komisi Terkumpul',  value: fmtRp(totK), cls:'text-[#6B8FA3]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-5">
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-xs text-[#8a9070] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter event */}
      {events.length > 0 && (
        <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm p-4">
          <select value={selEvent} onChange={e => setSelEvent(e.target.value)}
            className="px-3 py-2 border border-[#e4e7d4] rounded-[12px] text-sm text-[#5a6040] bg-[#f7f8f2] focus:outline-none focus:border-[#7a8a52]">
            <option value="">Semua Event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.nama || 'Event'}</option>)}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#e4e7d4] shadow-sm overflow-auto">
        <div className="px-5 py-4 border-b border-[#e4e7d4] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[#7a8a52]"/>
            <p className="font-bold text-[#1e2010] text-sm">Ringkasan Per Event</p>
            <span className="text-[10px] text-[#8a9070] font-normal hidden sm:block">
              · Detail per-event ada di tab <button onClick={() => {}} className="text-[#7a8a52] underline underline-offset-2">Laporan Pengunjung</button>
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setExportFormat('Excel'); setShowExport(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#eef0e0] text-[#7a8a52] hover:bg-[#eef4eb] border border-[#c8d09a] rounded-[12px] text-xs font-semibold transition whitespace-nowrap">
              <FileSpreadsheet size={13}/> Export Excel
            </button>
            <button onClick={() => { setExportFormat('PDF'); setShowExport(true); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#f7eeee] text-[#a05f5f] hover:bg-[#f7eeee] border border-[#dbb8b8] rounded-[12px] text-xs font-semibold transition whitespace-nowrap">
              <FileText size={13}/> Export PDF
            </button>
          </div>
        </div>
        {!loading && data.length === 0 && (
          <div className="py-12 text-center">
            <CalendarDays size={32} className="text-gray-200 mx-auto mb-3"/>
            <p className="text-sm font-semibold text-[#5a6040]">{errorMsg || 'Belum ada data laporan akumulasi'}</p>
            {!IS_DUMMY && <p className="text-xs text-[#8a9070] mt-1">Data akan muncul setelah backend live dan event selesai dijalankan.</p>}
          </div>
        )}
        {!loading && data.length > 0 && (
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead><tr className="border-b border-[#e4e7d4] bg-[#f7f8f2]/80">
            {['Event','Tanggal','Pengunjung','Kolaborator','Artisan','Omset Artisan','Komisi','Status'].map(h => (
              <th key={h} className="px-4 py-3 text-xs font-bold text-[#8a9070] uppercase tracking-wider">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {data.map(e => (
              <tr key={e.id} className="border-b border-gray-50 hover:bg-[#f7f8f2]/50 transition">
                <td className="px-4 py-3 font-semibold text-[#1e2010] max-w-[180px]"><p className="truncate">{e.nama}</p></td>
                <td className="px-4 py-3 text-xs text-[#8a9070] whitespace-nowrap">{new Date(e.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
                <td className="px-4 py-3 font-semibold text-[#1e2010]">{e.pengunjung ? e.pengunjung.toLocaleString('id-ID') : '—'}</td>
                <td className="px-4 py-3 text-[#5a6040]">{e.kolaborator_count}</td>
                <td className="px-4 py-3 text-[#5a6040]">{e.artisan_count}</td>
                <td className="px-4 py-3 text-[#5a6040]">{e.omset_artisan ? fmtRp(e.omset_artisan) : '—'}</td>
                <td className="px-4 py-3 text-[#7a8a52] font-medium">{e.komisi ? fmtRp(e.komisi) : '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.status==='selesai' ? 'bg-[#eef0e0] text-[#7a8a52]' : 'bg-[#f7f2e4] text-[#C4A24D]'}`}>
                    {e.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {selesai.length > 0 && (
            <tfoot><tr className="bg-[#f7f8f2] border-t border-[#e4e7d4]">
              <td className="px-4 py-3 font-bold text-[#5a6040] text-sm" colSpan={2}>Total (selesai)</td>
              <td className="px-4 py-3 font-bold text-[#1e2010]">{totP.toLocaleString('id-ID')}</td>
              <td className="px-4 py-3 font-bold text-[#1e2010]">{selesai.reduce((s,e)=>s+e.kolaborator_count,0)}</td>
              <td className="px-4 py-3 font-bold text-[#1e2010]">{selesai.reduce((s,e)=>s+e.artisan_count,0)}</td>
              <td className="px-4 py-3 font-bold text-[#C4A24D]">{fmtRp(totO)}</td>
              <td className="px-4 py-3 font-bold text-[#7a8a52]">{fmtRp(totK)}</td>
              <td/>
            </tr></tfoot>
          )}
        </table>
        )}
      </div>

      <ExportModal
        open={showExport}
        onClose={() => setShowExport(false)}
        subtitle="Akumulasi Event – Peken Banyumasan"
        details={[
          ['Total Event', `${data.length} event`],
          ['Event Selesai', `${selesai.length} event`],
          ['Total Pengunjung', totP.toLocaleString('id-ID')],
          ['Total Omset Artisan', fmtRp(totO)],
          ['Total Komisi', fmtRp(totK)],
          ['Format', exportFormat + ' Document'],
        ]}
        onExcel={() => exportExcel('akumulasi_event', HDRS, ROWS, 'Laporan Akumulasi Event')}
        onPdf={()   => exportPDF('Akumulasi Event – Peken Banyumasan', HDRS, ROWS, TOT)}
      />
    </div>
  );
}

export default Reports;

