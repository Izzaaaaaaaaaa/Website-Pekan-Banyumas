import { useState, useEffect, useCallback } from 'react';
import "../assets/styles/event.css";
import { Store, Calendar, MapPin, Users, Clock, RefreshCcw, Lock, Inbox } from "lucide-react";

const BASE        = import.meta.env.VITE_API_URL || "http://127.0.0.1:8004";
const API_EVENTS  = `${BASE}/api/event`;
const API_DAFTAR  = `${BASE}/api/event/daftar`;
const API_SAYA    = `${BASE}/api/event/saya`;
const API_UBAH    = `${BASE}/api/event/ubah-stand`;

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

const fmtTgl = d => d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function useToast() {
  const [msg, setMsg] = useState(null);
  const show = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3500); };
  const Toast = msg ? <div className={`bk-toast ${msg.type}`}>{msg.text}</div> : null;
  return { show, Toast };
}

// ── Zone Selector — fetch dari API ──────────────────────────
function ZoneSelector({ eventId, value, onChange }) {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    if (!eventId) return;
    fetch(`${API_EVENTS}/${eventId}/stands`)
      .then(r => r.json())
      .then(d => setZones(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [eventId]);

  if (zones.length === 0) return <p style={{ fontSize: 13, color: '#9ca3af' }}>Memuat data stand...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {zones.map(z => (
        <div key={z.zona || z.id}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {z.label}
          </p>
          <div className="zone-grid">
            {(z.stands || []).map(s => (
              <div key={s.id}
                className={`zone-slot${s.occupied ? ' occupied' : ''}${value === s.id ? ' selected' : ''}`}
                onClick={() => !s.occupied && onChange(s.id)}
                title={s.occupied ? 'Sudah terisi' : 'Tersedia'}
              >
                <div className="zone-slot-name">{s.id}</div>
                <div className="zone-slot-status">{s.occupied ? '✕ Terisi' : '✓ Bebas'}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal Daftar ─────────────────────────────────────────────
function DaftarModal({ event, onClose, onSubmit }) {
  const [slot, setSlot]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!slot) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(API_DAFTAR, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ event_id: event.id, posisi_event: slot }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Gagal mendaftar'); setLoading(false); return; }
      onSubmit(event, slot);
      onClose();
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <div className="ev-modal" onClick={e => e.stopPropagation()}>
        <div className="ev-modal-head">
          <h3>Daftar ke Event</h3>
          <button className="ev-btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="ev-modal-body">
          <div className="ev-modal-info">
            <strong>{event.nama}</strong>
            <span>{fmtTgl(event.tanggal)} · {event.lokasi}</span>
          </div>
          <div>
            <p className="ev-modal-label">Pilih Stand yang Tersedia</p>
            <ZoneSelector eventId={event.id} value={slot} onChange={setSlot} />
            {slot && <p style={{ fontSize: 12, color: '#2f6f4e', marginTop: 8, fontWeight: 600 }}>✓ Dipilih: {slot}</p>}
          </div>
          {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{error}</p>}
          <div className="ev-modal-note">Permintaan dikirim ke admin untuk disetujui.</div>
          <div className="ev-modal-footer">
            <button className="ev-btn-cancel" onClick={onClose}>Batal</button>
            <button className="ev-btn-submit" onClick={submit} disabled={!slot || loading}>
              {loading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Modal Ubah Stand ─────────────────────────────────────────
function ChangeStandModal({ ev, onClose, onSubmit }) {
  const [slot, setSlot]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!slot) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(API_UBAH, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ artisan_request_id: ev.id, posisi_baru: slot }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Gagal mengubah stand'); setLoading(false); return; }
      onSubmit(ev, slot);
      onClose();
    } catch {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ev-modal-overlay" onClick={onClose}>
      <div className="ev-modal" onClick={e => e.stopPropagation()}>
        <div className="ev-modal-head">
          <h3>Minta Ubah Posisi Stand</h3>
          <button className="ev-btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="ev-modal-body">
          <div className="ev-modal-info">
            <strong>{ev.nama}</strong>
            <span>Stand saat ini: {ev.posisi_event || ev.stand_id || '—'}</span>
          </div>
          <div>
            <p className="ev-modal-label">Pilih Stand Baru</p>
            <ZoneSelector eventId={ev.event_id} value={slot} onChange={setSlot} />
            {slot && <p style={{ fontSize: 12, color: '#2f6f4e', marginTop: 8, fontWeight: 600 }}>✓ Dipilih: {slot}</p>}
          </div>
          {error && <p style={{ fontSize: 13, color: '#ef4444', marginTop: 8 }}>{error}</p>}
          <div className="ev-modal-note">Perubahan posisi memerlukan persetujuan admin.</div>
          <div className="ev-modal-footer">
            <button className="ev-btn-cancel" onClick={onClose}>Batal</button>
            <button className="ev-btn-submit" onClick={submit} disabled={!slot || loading}>
              {loading ? 'Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function Event() {
  const [tab,          setTab]          = useState('jelajahi');
  const [events,       setEvents]       = useState([]);
  const [myEvents,     setMyEvents]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [daftarModal,  setDaftarModal]  = useState(null);
  const [changeModal,  setChangeModal]  = useState(null);
  const { show: toast, Toast }          = useToast();

  // ── Fetch events publik ──
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(API_EVENTS);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // ── Fetch event saya ──
  const fetchMyEvents = useCallback(async () => {
    try {
      const res  = await fetch(API_SAYA, { headers: authHeaders() });
      const data = await res.json();
      setMyEvents(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchEvents(); fetchMyEvents(); }, [fetchEvents, fetchMyEvents]);

  const registeredEventIds = myEvents.map(e => e.event_id);
  const pendingCount       = myEvents.filter(e => e.status_request === 'pending').length;
  const approvedCount      = myEvents.filter(e => e.status_request === 'approved').length;

  const handleDaftar = (event, posisi) => {
    toast(`Permintaan "${event.nama}" (${posisi}) berhasil dikirim ke admin`);
    fetchMyEvents();
  };

  const handleChangeRequest = (ev, newPosisi) => {
    toast(`Permintaan ubah stand ke "${newPosisi}" dikirim ke admin`);
    fetchMyEvents();
  };

  return (
    <div className="ev-page">
      {Toast}

      <div className="ev-header">
        <div className="pg-eye"><Store size={14} /> Kios Saya</div>
        <div className="pg-title">Kelola <em>Event</em></div>
        <div className="pg-sub">Daftarkan usahamu ke event budaya Banyumasan</div>
      </div>

      <div className="ev-stats">
        <div className="ev-stat"><div className="ev-stat-val">{events.length}</div><div className="ev-stat-lbl">Event Tersedia</div></div>
        <div className="ev-stat green"><div className="ev-stat-val">{approvedCount}</div><div className="ev-stat-lbl">Disetujui</div></div>
        <div className="ev-stat amber"><div className="ev-stat-val">{pendingCount}</div><div className="ev-stat-lbl">Menunggu Acc</div></div>
      </div>

      <div className="ev-tabs">
        <button className={`ev-tab${tab === 'jelajahi' ? ' active' : ''}`} onClick={() => setTab('jelajahi')}>Jelajahi Event</button>
        <button className={`ev-tab${tab === 'usaha_saya' ? ' active' : ''}`} onClick={() => setTab('usaha_saya')}>
          Usaha Saya{myEvents.length > 0 ? ` (${myEvents.length})` : ''}
        </button>
      </div>

      {/* ── TAB JELAJAHI ── */}
      {tab === 'jelajahi' && (
        loading ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Memuat event...</div>
        ) : events.length === 0 ? (
          <div className="ev-empty">
            <Inbox size={32} />
            <div className="ev-empty-text">Belum ada event yang tersedia.</div>
          </div>
        ) : (
          <div className="ev-grid">
            {events.map(ev => {
              const isReg     = registeredEventIds.includes(ev.id);
              const myReq     = myEvents.find(e => e.event_id === ev.id);
              const isPending = myReq?.status_request === 'pending';
              const pct       = ev.kapasitas ? Math.min(100, Math.round((ev.peserta_count / ev.kapasitas) * 100)) : 0;
              return (
                <div key={ev.id} className={`ev-card${isReg ? ' registered' : ''}`}>
                  <div className="ev-card-accent" />
                  <div className="ev-card-body">
                    <div className="ev-card-top">
                      <div>
                        <div className="ev-card-name">{ev.nama}</div>
                        <div className="ev-card-meta"><Calendar size={14} />{fmtTgl(ev.tanggal)}{ev.tanggal_selesai && ev.tanggal_selesai !== ev.tanggal ? ` – ${fmtTgl(ev.tanggal_selesai)}` : ''}</div>
                        <div className="ev-card-meta"><MapPin size={14} />{ev.lokasi}</div>
                      </div>
                      <span className={`ev-badge ${ev.status}`}>{ev.status}</span>
                    </div>
                    <div className="ev-card-desc">{ev.deskripsi}</div>
                    {ev.kapasitas && (
                      <>
                        <div className="ev-cap-row"><span><Users size={14} />{ev.peserta_count} / {ev.kapasitas}</span><span>{pct}%</span></div>
                        <div className="ev-cap-track"><div className="ev-cap-fill" style={{ width: `${pct}%` }} /></div>
                      </>
                    )}
                  </div>
                  <div className="ev-card-footer">
                    {isPending
                      ? <div className="ev-btn-terdaftar"><Clock size={14} />Menunggu Persetujuan</div>
                      : isReg
                      ? <div className="ev-btn-terdaftar">✓ Sudah Terdaftar</div>
                      : <button className="ev-btn-daftar" onClick={() => setDaftarModal(ev)}><Store size={14} />Daftarkan Usaha</button>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TAB USAHA SAYA ── */}
      {tab === 'usaha_saya' && (
        myEvents.length === 0 ? (
          <div className="ev-empty">
            <div className="ev-empty-icon"><Store size={14} /></div>
            <div className="ev-empty-text">Usahamu belum terdaftar di event manapun.</div>
            <span className="ev-empty-link" onClick={() => setTab('jelajahi')}>Jelajahi Event →</span>
          </div>
        ) : (
          <div className="ev-usaha-list">
            {myEvents.map(e => {
              const eventData = events.find(ev => ev.id === e.event_id) || {};
              return (
                <div key={e.id} className={`ev-usaha-item${e.status_request === 'approved' ? ' approved' : ''}`}>
                  <div className="ev-usaha-top">
                    <div>
                      <div className="ev-usaha-name">{eventData.nama || `Event #${e.event_id?.slice(0, 8)}`}</div>
                      <div className="ev-usaha-sub"><Calendar size={12} /> {fmtTgl(eventData.tanggal)}</div>
                      <div className="ev-usaha-pos">
                        <MapPin size={12} />{e.posisi_event || e.stand_id || '—'}
                        {e.status_request === 'approved' && (
                          <span className="ev-stand-locked"><Lock size={10} />Terkunci</span>
                        )}
                      </div>
                      {e.change_request && e.status_request === 'pending_change' && (
                        <div className="ev-stand-change-notice">
                          <Clock size={11} />Permintaan ubah ke: <b>{e.change_request}</b> (menunggu admin)
                        </div>
                      )}
                    </div>
                    <div className="ev-usaha-right">
                      <span className={`ev-badge ${e.status_request === 'approved' ? 'approved' : 'pending'}`}>
                        {e.status_request === 'approved' ? '✓ Disetujui' :
                         e.status_request === 'pending_change' ? '⏳ Ubah Stand' : '⏳ Menunggu'}
                      </span>
                    </div>
                  </div>
                  {e.status_request === 'approved' && !e.change_request && (
                    <div className="ev-stand-actions">
                      <button className="ev-btn-ubah-stand" onClick={() => setChangeModal({ ...e, nama: eventData.nama })}>
                        <RefreshCcw size={12} />Minta Ubah Posisi Stand
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {daftarModal && <DaftarModal event={daftarModal} onClose={() => setDaftarModal(null)} onSubmit={handleDaftar} />}
      {changeModal && <ChangeStandModal ev={changeModal} onClose={() => setChangeModal(null)} onSubmit={handleChangeRequest} />}
    </div>
  );
}
