import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  LogIn,
  LogOut,
  RefreshCw,
  ScanLine,
  User,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { dashboardApi } from "../services/endpoints";
import { getUserRole } from "../lib/auth";
import { STORAGE_KEYS, STORAGE_EVENTS } from "../lib/storageKeys";
import { extractError } from "../lib/unwrap";
import { useToast } from "../components/Toast";
import { supabaseRealtime } from "../lib/supabase";

// ── Event countdown hook (shared: HARI · JAM · MENIT) ────────────────────────
function useEventCountdown(tanggal, jamMulai) {
  const [time, setTime] = React.useState({ d: "00", j: "00", m: "00" });
  const [selesai, setSelesai] = React.useState(false);

  React.useEffect(() => {
    if (!tanggal) return;
    const target = tanggal
      ? new Date(`${tanggal}T${jamMulai || "08:00"}:00+07:00`)
      : null;

    function tick() {
      const diff = target - new Date();
      if (diff <= 0) {
        setTime({ d: "00", j: "00", m: "00" });
        setSelesai(true);
        return;
      }
      setSelesai(false);
      setTime({
        d: String(Math.floor(diff / 86400000)).padStart(2, "0"),
        j: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0"),
        m: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"),
      });
    }
    tick();
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [tanggal]);

  return { time, selesai };
}

// Compact inline countdown badge for event cards (Tailwind)
function EventCountdownBadge({ tanggal, jamMulai }) {
  const { time, selesai } = useEventCountdown(tanggal, jamMulai);
  if (selesai)
    return (
      <span className="text-[10px] font-semibold text-[#8a9070]">Selesai</span>
    );
  return (
    <div className="flex items-center gap-1 mt-2">
      {[
        ["d", "H"],
        ["j", "J"],
        ["m", "M"],
      ].map(([k, u]) => (
        <div
          key={k}
          className="bg-[#7a8a52] text-white rounded-lg px-1.5 py-0.5 text-center min-w-[28px]"
        >
          <div className="text-[11px] font-black leading-none">{time[k]}</div>
          <div className="text-[8px] opacity-70 font-semibold leading-none mt-0.5">
            {u}
          </div>
        </div>
      ))}
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [stats, setStats] = useState({
    di_dalam: 0,
    total_masuk: 0,
    total_keluar: 0,
    total_harian: 0,
  });
  const [activities, setActivities] = useState([]);
  const [activeEventId, setActiveEventId] = useState(null);
  const [namaEvent, setNamaEvent] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [submittingAction, setSubmittingAction] = useState(null);
  const [flashKey, setFlashKey] = useState(0);
  const [scannerBuffer, setScannerBuffer] = useState("");
  const [scannerState, setScannerState] = useState("idle");
  const [scannerResult, setScannerResult] = useState(null);
  const [realtimeStatus, setRealtimeStatus] = useState(
    supabaseRealtime ? "connecting" : "disabled",
  );

  const activeEventIdRef = useRef(null);
  const scannerInputRef = useRef(null);
  const errorToastStats = useRef(false);
  const errorToastActivities = useRef(false);
  const statsIntervalRef = useRef(null);
  const activitiesIntervalRef = useRef(null);

  // ── REALTIME SUBSCRIPTION REFS ─────────────────────────────────────────────
  const realtimeChannelRef = useRef(null);
  const isRealtimeSubscribedRef = useRef(false);

  const userRole = getUserRole();

  useEffect(() => {
    const refocus = () => scannerInputRef.current?.focus();
    refocus();
    window.addEventListener("focus", refocus);
    document.addEventListener("click", refocus);
    return () => {
      window.removeEventListener("focus", refocus);
      document.removeEventListener("click", refocus);
    };
  }, []);

  const fetchStats = useCallback(
    async (silent = false) => {
      try {
        console.log(
          "[POLLING] FETCH STATS",
          silent ? "(silent)" : "(foreground)",
        );
        if (!silent) setIsLoadingStats(true);
        // dashboardApi.stats returns the unwrapped data payload per the Phase 0 contract.
        const data = (await dashboardApi.stats()) || {};
        setStats({
          di_dalam: data.di_dalam || 0,
          total_masuk: data.total_masuk || 0,
          total_keluar: data.total_keluar || 0,
          total_harian: data.total_harian || 0,
        });

        if (data?.event_id) {
          setActiveEventId(data.event_id);
          activeEventIdRef.current = data.event_id;
          setNamaEvent(data.nama_event || null);
          localStorage.setItem(
            STORAGE_KEYS.ACTIVE_EVENT,
            JSON.stringify({
              id: data.event_id,
              nama: data.nama_event || null,
            }),
          );
        } else {
          setActiveEventId(null);
          activeEventIdRef.current = null;
          setNamaEvent(null);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_EVENT);
        }

        window.dispatchEvent(new CustomEvent(STORAGE_EVENTS.EVENT_UPDATE));
        if (silent) setFlashKey((k) => k + 1);
      } catch (error) {
        // Silent polling cycles must not spam toasts; only the foreground
        // fetch surfaces an error. Either way we log for diagnostics.
        console.error("[POLLING] FETCH STATS ERROR:", error.message);
        if (!silent && !errorToastStats.current) {
          toast.error(extractError(error, "Gagal mengambil statistik."));
          errorToastStats.current = true;
          setTimeout(() => {
            errorToastStats.current = false;
          }, 10000);
        }
      } finally {
        if (!silent) setIsLoadingStats(false);
      }
    },
    [toast],
  );

  const fetchActivities = useCallback(
    async (silent = false) => {
      try {
        console.log(
          "[POLLING] FETCH ACTIVITIES",
          silent ? "(silent)" : "(foreground)",
        );
        if (!silent) setIsLoadingActivities(true);
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        const params = { tanggal: today };
        if (activeEventIdRef.current)
          params.event_id = activeEventIdRef.current;
        const rows = (await dashboardApi.visitors(params)) || [];
        const sortTime = (row) =>
          row.status === "keluar" && row.waktu_keluar
            ? new Date(row.waktu_keluar)
            : new Date(row.waktu_masuk);
        const sorted = [...rows].sort((a, b) => sortTime(b) - sortTime(a));
        setActivities(sorted.slice(0, 10));
      } catch (error) {
        console.error("[POLLING] FETCH ACTIVITIES ERROR:", error.message);
        if (!silent && !errorToastActivities.current) {
          toast.error(extractError(error, "Gagal mengambil aktivitas."));
          errorToastActivities.current = true;
          setTimeout(() => {
            errorToastActivities.current = false;
          }, 10000);
        }
      } finally {
        if (!silent) setIsLoadingActivities(false);
      }
    },
    [toast],
  );

  const startPolling = useCallback(() => {
    if (document.visibilityState !== "visible") {
      console.log("[POLLING] SKIP START (tab not visible)");
      return;
    }

    // ✅ GUARD: Stats polling sudah aktif? Return saja.
    if (statsIntervalRef.current) {
      console.log("[POLLING] STATS ALREADY RUNNING - skip duplicate");
      return;
    }

    // ✅ GUARD: Activities polling sudah aktif? Return saja.
    if (activitiesIntervalRef.current) {
      console.log("[POLLING] ACTIVITIES ALREADY RUNNING - skip duplicate");
      return;
    }

    console.log("[POLLING] ▶ START STATS POLLING (30s interval)");
    statsIntervalRef.current = setInterval(() => {
      fetchStats(true);
    }, 30000);

    console.log("[POLLING] ▶ START ACTIVITIES POLLING (15s interval)");
    activitiesIntervalRef.current = setInterval(() => {
      fetchActivities(true);
    }, 15000);
  }, [fetchStats, fetchActivities]);

  const stopPolling = useCallback(() => {
    if (statsIntervalRef.current) {
      console.log("[POLLING] ⏹ STOP STATS POLLING");
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (activitiesIntervalRef.current) {
      console.log("[POLLING] ⏹ STOP ACTIVITIES POLLING");
      clearInterval(activitiesIntervalRef.current);
      activitiesIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("[VISIBILITY] TAB ACTIVE - resume polling");
        fetchStats(true);
        fetchActivities(true);
        startPolling();
      } else {
        console.log("[VISIBILITY] TAB INACTIVE - stop polling");
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPolling, stopPolling, fetchStats, fetchActivities]);

  useEffect(() => {
    console.log("[EFFECT] DASHBOARD MOUNT - initial load + polling + realtime");

    // Initial fetch
    fetchStats();
    fetchActivities();

    // Start polling
    startPolling();

    let realtimeTimeout = null;

    // ── REALTIME SUBSCRIPTION ──────────────────────────────────────────────
    // Guard: hanya subscribe 1x, tidak double-subscribe saat React StrictMode
    if (supabaseRealtime && !isRealtimeSubscribedRef.current) {
      console.log("[REALTIME] ▶ SUBSCRIBE to visitors table changes");
      isRealtimeSubscribedRef.current = true;

      realtimeChannelRef.current = supabaseRealtime
        .channel("dashboard-kunjungan-privacy")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "visitors" },
          () => {
            console.log("[REALTIME] ▶ RECEIVED UPDATE - debouncing refresh");
            if (realtimeTimeout) clearTimeout(realtimeTimeout);
            realtimeTimeout = setTimeout(() => {
              fetchStats(true);
              fetchActivities(true);
            }, 2000);
          },
        )
        .subscribe((status) => {
          console.log("[REALTIME] STATUS:", status);
          if (status === "SUBSCRIBED") setRealtimeStatus("connected");
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
            setRealtimeStatus("error");
          else if (status === "CLOSED") setRealtimeStatus("disabled");
        });
    } else if (!supabaseRealtime) {
      console.log("[REALTIME] DISABLED - no supabaseRealtime client");
      setRealtimeStatus("disabled");
    }

    return () => {
      console.log("[EFFECT] DASHBOARD UNMOUNT - cleanup");

      // Cleanup polling
      stopPolling();

      // Cleanup realtime subscription
      if (realtimeChannelRef.current && supabaseRealtime) {
        console.log("[REALTIME] ⏹ UNSUBSCRIBE from visitors table");
        supabaseRealtime.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
        isRealtimeSubscribedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeEventId) {
      console.log(
        "[EFFECT] ACTIVE EVENT CHANGED:",
        activeEventId,
        "- refetch activities",
      );
      fetchActivities(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEventId]);

  const handleManualInput = async (aksi) => {
    if (!activeEventId) {
      toast.warning("Event aktif belum terdeteksi.");
      return;
    }
    try {
      setSubmittingAction(aksi);
      await dashboardApi.manualEntry({ aksi, event_id: activeEventId });
      toast.success(
        `Pengunjung ${aksi === "masuk" ? "masuk" : "keluar"} berhasil dicatat.`,
      );
      await Promise.all([fetchStats(true), fetchActivities(true)]);
    } catch (error) {
      toast.error(extractError(error, `Gagal mencatat pengunjung ${aksi}.`));
      console.error(error);
    } finally {
      setSubmittingAction(null);
    }
  };

  const processScannerTap = useCallback(
    async (rawUid) => {
      const scannedUid = String(rawUid || "").trim();
      if (!scannedUid) return;

      if (!activeEventIdRef.current) {
        setScannerState("error");
        setScannerResult({ ok: false, message: "Tidak ada event aktif." });
        toast.warning("Tidak ada event aktif.");
        setTimeout(() => setScannerState("idle"), 1800);
        return;
      }

      setScannerState("scanning");
      try {
        // dashboardApi.visitorTap replaces the legacy raw fetch('/tap'). This
        // routes through the shared apiClient → consistent auth header, 401
        // handling, and error-message parsing. Returns the unwrapped payload
        // { aksi, nama, uid, ... } directly.
        const data = await dashboardApi.visitorTap({
          uid: scannedUid,
          timestamp: new Date().toISOString(),
        });

        const aksi = data?.aksi;
        setScannerState(aksi === "keluar" ? "success-keluar" : "success-masuk");
        setScannerResult({ ok: true, ...data });
        toast.success(
          aksi === "keluar"
            ? "Pengunjung berhasil tap keluar."
            : "Pengunjung berhasil tap masuk.",
        );

        await Promise.all([fetchStats(true), fetchActivities(true)]);
      } catch (error) {
        const message = extractError(error, "Tap NFC gagal diproses.");
        setScannerState("error");
        setScannerResult({ ok: false, message });
        toast.error(message);
      } finally {
        setScannerBuffer("");
        setTimeout(() => {
          setScannerState("idle");
          scannerInputRef.current?.focus();
        }, 1800);
      }
    },
    [fetchActivities, fetchStats, toast],
  );

  const handleScannerKeyDown = useCallback(
    async (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      const scannedUid = scannerBuffer.trim();
      setScannerBuffer("");
      await processScannerTap(scannedUid);
    },
    [processScannerTap, scannerBuffer],
  );

  const handleScannerChange = useCallback((event) => {
    const nextValue = event.target.value || "";
    setScannerBuffer(nextValue);
    if (nextValue.trim()) setScannerState("scanning");
  }, []);

  const getActivityTime = (activity) => {
    if (activity.status === "keluar" && activity.waktu_keluar)
      return new Date(activity.waktu_keluar);
    return new Date(activity.waktu_masuk);
  };

  const getScannerHeadline = () => {
    if (scannerState === "error") return "Tap gagal diproses";
    if (scannerState === "scanning") return "Membaca kartu NFC…";
    return scannerResult?.ok
      ? "UID: " + (scannerResult?.uid || "").substring(0, 8)
      : "Menunggu tap pengunjung";
  };

  const getScannerSubtext = () => {
    if (scannerState === "error")
      return scannerResult?.message || "Kartu tidak dikenali.";
    if (scannerState === "success-keluar") return "Tercatat keluar";
    if (scannerState === "success-masuk") return "Tercatat masuk";
    if (scannerState === "scanning") return "Reader aktif";
    return "Siap menerima tap pengunjung";
  };

  const scannerTone =
    scannerState === "error"
      ? "border-[#dbb8b8] bg-[#f7eeee]"
      : scannerState === "success-keluar"
        ? "border-[#b8badc] bg-[#eeeef8]"
        : scannerState === "success-masuk"
          ? "border-[#b8d4b0] bg-[#eef4eb]"
          : scannerState === "scanning"
            ? "border-[#dcc882] bg-[#f7f2e4]"
            : "border-[#e4e7d4] bg-white";

  const isManualButtonDisabled = submittingAction !== null || !activeEventId;

  const RealtimeBadge = () => {
    if (realtimeStatus === "connected") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7A9B6A] bg-[#eef4eb] border border-[#b8d4b0] px-2 py-0.5 rounded-full">
          <Wifi size={11} className="animate-pulse" /> Realtime
        </span>
      );
    }
    if (realtimeStatus === "connecting") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C4A24D] bg-[#f7f2e4] border border-[#dcc882] px-2 py-0.5 rounded-full">
          <RefreshCw size={11} className="animate-spin" /> Connecting…
        </span>
      );
    }
    if (realtimeStatus === "error") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B87272] bg-[#f7eeee] border border-[#dbb8b8] px-2 py-0.5 rounded-full">
          <WifiOff size={11} /> Backup Polling
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8a9070] bg-[#f2f4e8] border border-[#e4e7d4] px-2 py-0.5 rounded-full">
        <RefreshCw size={11} /> Polling
      </span>
    );
  };

  const statCards = [
    {
      key: "di_dalam",
      label: "Sedang di Dalam",
      value: stats.di_dalam,
      icon: Users,
      iconTone: "bg-[#eef4eb] text-[#7A9B6A]",
      meta: "Live",
      metaTone: "text-[#7a8a52]",
    },
    {
      key: "total_masuk",
      label: "Tap Masuk",
      value: stats.total_masuk,
      icon: LogIn,
      iconTone: "bg-[#eef0e0] text-[#7a8a52]",
      meta: "Hari ini",
      metaTone: "text-[#8a9070]",
    },
    {
      key: "total_keluar",
      label: "Tap Keluar",
      value: stats.total_keluar,
      icon: LogOut,
      iconTone: "bg-[#f7eeee] text-[#B87272]",
      meta: "Hari ini",
      metaTone: "text-[#8a9070]",
    },
    {
      key: "total_harian",
      label: "Kunjungan Hari Ini",
      value: stats.total_harian,
      icon: CalendarCheck,
      iconTone: "bg-[#eeeef8] text-[#7A80B0]",
      meta: namaEvent || "Event aktif",
      metaTone: "text-[#8a9070]",
    },
  ];

  return (
    <div className="space-y-4 font-sans pb-1">
      <style>{`
        @keyframes value-flash { 0% { background-color: transparent; } 25% { background-color: #eef4eb; } 100% { background-color: transparent; } }
        @keyframes row-flash { 0% { background-color: transparent; } 25% { background-color: #f2f4e8; } 100% { background-color: transparent; } }
        .value-flash { animation: value-flash 0.75s ease-out; }
        .row-flash { animation: row-flash 0.75s ease-out; }
      `}</style>

      {!isLoadingStats && !activeEventId && (
        <div className="bg-[#f7f2e4] border border-[#dcc882] rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-[#C4A24D] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#7a5c1a]">
              Tidak ada event aktif
            </p>
            <p className="text-xs text-[#C4A24D] mt-0.5 leading-relaxed">
              Tombol input manual dinonaktifkan. Tap NFC juga tidak akan
              diterima sampai ada event aktif.
            </p>
          </div>
          {userRole === "admin" && (
            <Link
              to="/events"
              className="shrink-0 flex items-center gap-1.5 bg-[#C4A24D] hover:bg-[#b08f3a] text-white text-xs font-semibold px-3 py-2 rounded-lg transition whitespace-nowrap"
            >
              <Calendar size={13} /> Kelola Event <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="bg-white p-4 rounded-2xl border border-[#e4e7d4]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="text-[13px] text-[#8a9070] font-medium leading-tight">
                    {item.label}
                  </div>
                  <div className={`text-[11px] mt-1 ${item.metaTone}`}>
                    {item.meta}
                  </div>
                </div>
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${item.iconTone}`}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-3xl md:text-[32px] font-bold leading-none text-[#1e2010]">
                {isLoadingStats ? (
                  "..."
                ) : (
                  <span
                    key={`${item.key}-${flashKey}`}
                    className="value-flash inline-block px-1 rounded-lg"
                  >
                    {item.value}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🆕 Event Mendatang */}
      <div className="bg-white rounded-2xl border border-[#e4e7d4] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#1e2010] flex items-center gap-2">
            <CalendarCheck size={16} className="text-[#7a8a52]" /> Event
            Mendatang
          </h3>
          <button
            onClick={() => navigate("/events")}
            className="text-xs text-[#7a8a52] hover:underline font-medium"
          >
            Lihat Semua →
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              nama: "Festival Budaya Banyumasan 2025",
              tanggal: "2025-05-17",
              jam_mulai: "08:00",
              jam_selesai: "22:00",
              lokasi: "Alun-Alun Purwokerto",
              peserta_count: 34,
              kapasitas: 200,
            },
            {
              nama: "Workshop Batik & Tenun Nusantara",
              tanggal: "2025-04-26",
              jam_mulai: "09:00",
              jam_selesai: "17:00",
              lokasi: "Gedung Kebudayaan Cilacap",
              peserta_count: 18,
              kapasitas: 30,
            },
            {
              nama: "Pameran Kriya Ekraf Regional",
              tanggal: "2025-06-10",
              jam_mulai: "10:00",
              jam_selesai: "21:00",
              lokasi: "Mall Cilacap Raya",
              peserta_count: 0,
              kapasitas: 500,
            },
          ].map((ev) => (
            <div
              key={ev.nama}
              className="bg-[#f7f8f2] border border-[#e4e7d4] rounded-xl p-4 hover:border-[#c8d09a] transition cursor-pointer"
              onClick={() => navigate("/events")}
            >
              <p className="font-semibold text-[#1e2010] text-sm leading-snug line-clamp-2 mb-1">
                {ev.nama}
              </p>
              <p className="text-[#8a9070] text-xs">{ev.lokasi}</p>
              {/* Countdown badges: H / J / M */}
              <EventCountdownBadge
                tanggal={ev.tanggal}
                jamMulai={ev.jam_mulai}
              />
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-[#8a9070] mb-1">
                  <span>{ev.peserta_count} peserta</span>
                  <span>
                    {Math.round((ev.peserta_count / ev.kapasitas) * 100)}%
                  </span>
                </div>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7a8a52] rounded-full"
                    style={{
                      width: `${Math.min(100, (ev.peserta_count / ev.kapasitas) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[236px,minmax(0,1fr)] gap-4 lg:items-stretch">
        <div className="space-y-4">
          <input
            ref={scannerInputRef}
            type="text"
            value={scannerBuffer}
            onChange={handleScannerChange}
            onKeyDown={handleScannerKeyDown}
            autoComplete="off"
            inputMode="none"
            className="absolute opacity-0 pointer-events-none w-px h-px"
            aria-hidden="true"
          />

          <div
            className={`p-2.5 rounded-2xl shadow-sm border transition-colors ${scannerTone}`}
            onClick={() => scannerInputRef.current?.focus()}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-[#1e2010]">
                Tap NFC Pengunjung
              </h3>
              <div className="w-7 h-7 rounded-2xl bg-[#eef4eb] text-[#7A9B6A] flex items-center justify-center shrink-0">
                <ScanLine size={14} />
              </div>
            </div>

            <div className="rounded-2xl bg-gray-900 text-white px-3 py-2.5 min-h-[88px] flex flex-col justify-center">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#8a9070] font-semibold mb-1.5">
                Tap Terakhir
              </div>
              <div className="text-[15px] font-semibold leading-snug break-words line-clamp-2">
                {getScannerHeadline()}
              </div>
              <div
                className={`mt-1 text-[11px] ${scannerState === "error" ? "text-red-300" : scannerState.startsWith("success") ? "text-[#7a8a52]" : scannerState === "scanning" ? "text-amber-300" : "text-gray-300"}`}
              >
                {getScannerSubtext()}
              </div>
              {scannerResult?.ok && (
                <div className="mt-2 inline-flex w-max items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold border border-white/10 bg-white/10">
                  <CheckCircle2
                    size={11}
                    className={
                      scannerResult?.aksi === "keluar"
                        ? "text-indigo-300"
                        : "text-[#7a8a52]"
                    }
                  />
                  {scannerResult?.aksi === "keluar" ? "KELUAR" : "MASUK"}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#e4e7d4]">
            <h3 className="text-sm font-bold text-[#1e2010] mb-3">
              Input Manual
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => handleManualInput("masuk")}
                disabled={isManualButtonDisabled}
                title={!activeEventId ? "Menunggu data event aktif..." : ""}
                className="w-full bg-[#7a8a52] hover:bg-[#4f5c30] disabled:bg-[#a8b07a] disabled:cursor-not-allowed text-white rounded-2xl px-3.5 py-3.5 flex flex-col items-center justify-center transition-all shadow-lg shadow-[rgba(122,138,82,.2)] group"
              >
                <ArrowDownCircle
                  className={`mb-2 ${!isManualButtonDisabled ? "group-hover:scale-110" : ""} transition-transform`}
                  size={28}
                />
                <span className="text-base font-bold tracking-wide leading-none">
                  {submittingAction === "masuk" ? "PROSES…" : "+ MASUK"}
                </span>
                <span className="text-[#7a8a52] text-[11px] mt-1">
                  1 pengunjung
                </span>
              </button>

              <button
                onClick={() => handleManualInput("keluar")}
                disabled={isManualButtonDisabled}
                title={!activeEventId ? "Menunggu data event aktif..." : ""}
                className="w-full bg-[#B87272] hover:bg-[#a05f5f] disabled:bg-[#c89898] disabled:cursor-not-allowed text-white rounded-2xl px-3.5 py-3.5 flex flex-col items-center justify-center transition-all shadow-lg shadow-[rgba(184,114,114,.2)] group"
              >
                <ArrowUpCircle
                  className={`mb-2 ${!isManualButtonDisabled ? "group-hover:scale-110" : ""} transition-transform`}
                  size={28}
                />
                <span className="text-base font-bold tracking-wide leading-none">
                  {submittingAction === "keluar" ? "PROSES…" : "- KELUAR"}
                </span>
                <span className="text-red-100 text-[11px] mt-1">
                  1 pengunjung
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <div className="bg-white rounded-2xl border border-[#e4e7d4] overflow-hidden h-full flex flex-col lg:h-[calc(100vh-300px)] min-h-[420px]">
            <div className="px-5 py-4 border-b border-[#e4e7d4] flex items-center justify-between gap-3 bg-[#f7f8f2]">
              <div className="flex items-center gap-3 min-w-0">
                <h3 className="text-base font-bold text-[#1e2010] truncate">
                  Aktivitas Tap & Input Terbaru
                </h3>
                <RealtimeBadge />
              </div>
              <button
                onClick={() => {
                  fetchStats();
                  fetchActivities();
                }}
                className="text-sm text-[#7a8a52] font-medium hover:underline flex items-center gap-1 shrink-0"
              >
                Refresh{" "}
                <RefreshCw
                  size={14}
                  className={isLoadingActivities ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f7f8f2] text-[#8a9070] text-[11px] uppercase tracking-wider border-b border-[#e4e7d4]">
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">
                      Waktu
                    </th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">
                      Tipe
                    </th>
                    <th className="px-5 py-3 font-semibold">Identitas</th>
                    <th className="px-5 py-3 font-semibold whitespace-nowrap">
                      Aktivitas
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#f2f4e8]">
                  {isLoadingActivities ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-5 py-8 text-center text-[#8a9070]"
                      >
                        Memuat data aktivitas...
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-5 py-8 text-center text-[#8a9070]"
                      >
                        Belum ada aktivitas hari ini.
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity) => (
                      <tr
                        key={`${activity.id}-${flashKey}`}
                        className="hover:bg-[#f7f8f2] transition row-flash align-top"
                      >
                        <td className="px-5 py-3 text-[#8a9070] font-medium whitespace-nowrap">
                          {getActivityTime(activity).toLocaleTimeString(
                            "id-ID",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            },
                          )}{" "}
                          WIB
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {activity.tipe_pengunjung === "nfc" ? (
                            <span className="inline-flex items-center gap-1.5 bg-[#eef4eb] text-[#4f5c30] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#b8d4b0]">
                              <CreditCard size={12} /> NFC
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-[#eef0e0] text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold border border-[#e4e7d4]">
                              <User size={12} /> Manual
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 min-w-[220px]">
                          {activity.tipe_pengunjung === "nfc" ? (
                            <>
                              <div className="font-semibold text-[#1e2010] leading-snug">
                                {activity.nama_pengunjung || "Pengunjung"}
                              </div>
                              <div className="text-[11px] text-[#8a9070] font-mono mt-1">
                                UID: {activity.nfc_uid?.substring(0, 8)}...
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold text-[#1e2010]">
                                Pengunjung
                              </div>
                              <div className="text-[11px] text-[#8a9070] font-mono mt-1">
                                Input Manual
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {activity.status === "di_dalam" ? (
                            <span className="text-[#7A9B6A] font-bold flex items-center gap-2">
                              <LogIn size={14} /> Masuk
                            </span>
                          ) : (
                            <span className="text-[#B87272] font-bold flex items-center gap-2">
                              <LogOut size={14} /> Keluar
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-[#e4e7d4] bg-[#f7f8f2] text-center">
              <button
                onClick={() => navigate("/reports")}
                className="text-sm font-semibold text-[#7a8a52] hover:text-[#4f5c30] transition"
              >
                Lihat Semua Riwayat Kunjungan &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
