import { useState } from 'react';
import "../assets/styles/event.css";
import {
  Store,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  X,
  RefreshCcw,
  Lock
} from "lucide-react";

const DUMMY_EVENTS = [
  { id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00', jam_mulai:'08:00', jam_selesai:'22:00', tanggal_selesai:'2025-05-19',
    lokasi:'Alun-Alun Purwokerto', deskripsi:'Festival tahunan seni, kuliner, dan kerajinan khas Banyumas.', status:'published', kapasitas:200, peserta_count:34 },
  { id:'e2', nama:'Workshop Batik & Tenun Nusantara', tanggal:'2025-04-26', jam_mulai:'09:00', jam_selesai:'17:00', tanggal_selesai:'2025-04-27',
    lokasi:'Gedung Kebudayaan Cilacap', deskripsi:'Pelatihan intensif 2 hari teknik batik tulis dan tenun lurik.', status:'published', kapasitas:30, peserta_count:18 },
  { id:'e3', nama:'Pameran Kriya Ekraf Regional', tanggal:'2025-06-10', jam_mulai:'10:00', jam_selesai:'21:00', tanggal_selesai:'2025-06-12',
    lokasi:'Mall Cilacap Raya', deskripsi:'Pameran dan bazaar produk ekonomi kreatif.', status:'published', kapasitas:500, peserta_count:12 },
];

const DUMMY_USAHA_EVENTS = [
  { id:'et1', event_id:'e1', nama:'Festival Budaya Banyumasan 2025', tanggal:'2025-05-17', jam_mulai:'08:00', jam_selesai:'22:00',
    posisi_event:'Zona A – Stand 3', status_request:'approved', assigned_by:'admin' },
];

// Zone/Stand map — bisa di-fetch dari API saat backend siap
const ZONES = [
  { zona:'A', label:'Zona A – Kriya & Fashion', stands:[
    {id:'A-1',occupied:false},{id:'A-2',occupied:true},{id:'A-3',occupied:true},
    {id:'A-4',occupied:false},{id:'A-5',occupied:false},{id:'A-6',occupied:true},
  ]},
  { zona:'B', label:'Zona B – Kuliner', stands:[
    {id:'B-1',occupied:false},{id:'B-2',occupied:false},{id:'B-3',occupied:true},
    {id:'B-4',occupied:false},{id:'B-5',occupied:true},
  ]},
  { zona:'C', label:'Zona C – Seni & Pertunjukan', stands:[
    {id:'C-1',occupied:false},{id:'C-2',occupied:false},{id:'C-3',occupied:false},{id:'C-4',occupied:true},
  ]},
];

const fmtTgl = d => d ? new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '';

function ZoneSelector({ value, onChange }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {ZONES.map(z => (
        <div key={z.zona}>
          <p style={{fontSize:11,fontWeight:700,color:'#6b7280',marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>{z.label}</p>
          <div className="zone-grid">
            {z.stands.map(s => (
              <div key={s.id}
                className={`zone-slot${s.occupied?' occupied':''}${value===s.id?' selected':''}`}
                onClick={() => !s.occupied && onChange(s.id)}
                title={s.occupied?'Sudah terisi':'Tersedia'}
              >
                <div className="zone-slot-name">{s.id}</div>
                <div className="zone-slot-status">{s.occupied?'✕ Terisi':'✓ Bebas'}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DaftarModal({ event, onClose, onSubmit }) {
  const [slot, setSlot] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!slot) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    onSubmit(event, slot);
    setLoading(false);
    onClose();
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
            <span>{fmtTgl(event.tanggal)}{event.jam_mulai ? ` · ${event.jam_mulai.replace(':','.')}${event.jam_selesai?`–${event.jam_selesai.replace(':','.') }`:''} WIB` : ''} · {event.lokasi}</span>
          </div>
          <div>
            <p className="ev-modal-label">Pilih Stand yang Tersedia</p>
            <ZoneSelector value={slot} onChange={setSlot}/>
            {slot && <p style={{fontSize:12,color:'#2f6f4e',marginTop:8,fontWeight:600}}>✓ Dipilih: {slot}</p>}
          </div>
          <div className="ev-modal-note">
            Permintaan dikirim ke admin untuk disetujui. Stand baru dikonfirmasi setelah admin menyetujui.
          </div>
          <div className="ev-modal-footer">
            <button className="ev-btn-cancel" onClick={onClose}>Batal</button>
            <button className="ev-btn-submit" onClick={submit} disabled={!slot||loading}>
              {loading ? <span className="ev-spin"/> : null}{loading ? ' Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function useSimpleToast() {
  const [msg, setMsg] = useState(null);
  const show = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3500); };
  const Toast = msg ? (
    <div style={{position:'fixed',top:20,right:20,zIndex:200,padding:'12px 20px',borderRadius:12,
      fontSize:13,fontWeight:600,color:'#fff',boxShadow:'0 4px 20px rgba(0,0,0,.15)',maxWidth:320,
      background:msg.type==='success'?'#2f6f4e':'#dc2626'}}>{msg.text}</div>
  ) : null;
  return { show, Toast };
}

// ── ChangeStandModal ─────────────────────────────────────────────────────────
function ChangeStandModal({ ev, onClose, onSubmit }) {
  const [slot, setSlot] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!slot) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    onSubmit(ev, slot);
    setLoading(false);
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
            <span>Stand saat ini: {ev.posisi_event}</span>
          </div>
          <div>
            <p className="ev-modal-label">Pilih Stand Baru</p>
            <ZoneSelector value={slot} onChange={setSlot}/>
            {slot && <p style={{fontSize:12,color:'#2f6f4e',marginTop:8,fontWeight:600}}>✓ Dipilih: {slot}</p>}
          </div>
          <div className="ev-modal-note">
            Perubahan posisi memerlukan persetujuan admin. Stand lama tetap aktif sampai disetujui.
          </div>
          <div className="ev-modal-footer">
            <button className="ev-btn-cancel" onClick={onClose}>Batal</button>
            <button className="ev-btn-submit" onClick={submit} disabled={!slot||loading}>
              {loading ? <span className="ev-spin"/> : null}
              {loading ? ' Mengirim...' : 'Kirim Permintaan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Event() {
  const [tab, setTab] = useState('jelajahi');
  const [pendingIds, setPendingIds] = useState([]);
  const [usahaEvents, setUsahaEvents] = useState(DUMMY_USAHA_EVENTS);
  const [daftarModal, setDaftarModal] = useState(null);
  const [changeModal, setChangeModal] = useState(null);
  const { show: toast, Toast } = useSimpleToast();

  const registeredIds = usahaEvents.map(e => e.event_id);

  const handleDaftar = (event, posisi) => {
    setPendingIds(l => [...l, event.id]);
    toast(`Permintaan "${event.nama}" (${posisi}) berhasil dikirim ke admin`);
    // Notify admin
  };

  const handleChangeRequest = (ev, newPosisi) => {
    if (!newPosisi.trim()) return;
    setUsahaEvents(l => l.map(e => e.event_id === ev.event_id
      ? { ...e, change_request: newPosisi, status_request: 'pending_change' }
      : e));
    setChangeModal(null);
    toast(`Permintaan ubah stand ke "${newPosisi}" dikirim ke admin`);
  };

  return (
    <div className="ev-page">
      {Toast}

      <div className="ev-header">
        <div className="ev-eyebrow">
          <Store size={14} /> Kios Saya
        </div>
        <div className="ev-title">Kelola <em>Event</em></div>
        <div className="ev-subtitle">Daftarkan usahamu ke event budaya Banyumasan</div>
      </div>

      <div className="ev-stats">
        <div className="ev-stat"><div className="ev-stat-val">{DUMMY_EVENTS.length}</div><div className="ev-stat-lbl">Event Tersedia</div></div>
        <div className="ev-stat green"><div className="ev-stat-val">{usahaEvents.length}</div><div className="ev-stat-lbl">Usaha Terdaftar</div></div>
        <div className="ev-stat amber"><div className="ev-stat-val">{pendingIds.length}</div><div className="ev-stat-lbl">Menunggu Acc</div></div>
      </div>

      <div className="ev-tabs">
        <button className={`ev-tab${tab==='jelajahi'?' active':''}`} onClick={()=>setTab('jelajahi')}>Jelajahi Event</button>
        <button className={`ev-tab${tab==='usaha_saya'?' active':''}`} onClick={()=>setTab('usaha_saya')}>
          Usaha Saya{usahaEvents.length>0?` (${usahaEvents.length})`:''}
        </button>
      </div>

      {tab==='jelajahi' && (
        <div className="ev-grid">
          {DUMMY_EVENTS.map(ev => {
            const isReg = registeredIds.includes(ev.id)||pendingIds.includes(ev.id);
            const isPending = pendingIds.includes(ev.id);
            const pct = Math.min(100,Math.round(ev.peserta_count/ev.kapasitas*100));
            return (
              <div key={ev.id} className={`ev-card${isReg?' registered':''}`}>
                <div className="ev-card-accent"/>
                <div className="ev-card-body">
                  <div className="ev-card-top">
                    <div>
                      <div className="ev-card-name">{ev.nama}</div>
                      <div className="ev-card-meta"><Calendar size={14} />{fmtTgl(ev.tanggal)}{ev.tanggal_selesai&&ev.tanggal_selesai!==ev.tanggal?` – ${fmtTgl(ev.tanggal_selesai)}`:''}{ev.jam_mulai?` · ${ev.jam_mulai.replace(':','.')}${ev.jam_selesai?` – ${ev.jam_selesai.replace(':','.')}`:''} WIB`:''}</div>
                      <div className="ev-card-meta"><MapPin size={14} />{ev.lokasi}</div>
                    </div>
                    <span className={`ev-badge ${ev.status}`}>{ev.status}</span>
                  </div>
                  <div className="ev-card-desc">{ev.deskripsi}</div>
                  <div className="ev-cap-row"><span><Users size={14} />{ev.peserta_count} / {ev.kapasitas}</span><span>{pct}%</span></div>
                  <div className="ev-cap-track"><div className="ev-cap-fill" style={{width:`${pct}%`}}/></div>
                </div>
                <div className="ev-card-footer">
                  {isPending
                    ? <div className="ev-btn-terdaftar"><Clock size={14} />Menunggu Persetujuan</div>
                    : isReg
                    ? <div className="ev-btn-terdaftar">✓ Sudah Terdaftar</div>
                    : <button className="ev-btn-daftar" onClick={()=>setDaftarModal(ev)}><Store size={14} />Daftarkan Usaha</button>
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab==='usaha_saya' && (
        <div>
          {pendingIds.length > 0 && (
            <div className="ev-pending-banner">
              <div className="ev-pending-title">⏳ Menunggu Persetujuan Admin</div>
              {pendingIds.map(eid => {
                const ev = DUMMY_EVENTS.find(e=>e.id===eid);
                return ev ? <div key={eid} className="ev-pending-item">• {ev.nama}</div> : null;
              })}
            </div>
          )}
          {usahaEvents.length===0&&pendingIds.length===0 ? (
            <div className="ev-empty">
              <div className="ev-empty-icon"><Store size={14} /></div>
              <div className="ev-empty-text">Usahamu belum terdaftar di event manapun.</div>
              <span className="ev-empty-link" onClick={()=>setTab('jelajahi')}>Jelajahi Event →</span>
            </div>
          ) : (
            <div className="ev-usaha-list">
              {usahaEvents.map(e => (
                <div key={e.id} className={`ev-usaha-item${e.status_request==='approved'?' approved':''}`}>
                  <div className="ev-usaha-top">
                    <div>
                      <div className="ev-usaha-name">{e.nama}</div>
                      <div className="ev-usaha-sub"><Calendar size={14} /> {fmtTgl(e.tanggal)}{e.jam_mulai ? ` · ${e.jam_mulai.replace(':','.')}${e.jam_selesai?` – ${e.jam_selesai.replace(':','.')}`:''} WIB` : ''}</div>
                      <div className="ev-usaha-pos">
                        <MapPin size={14} />{e.posisi_event||'—'}
                        {/* Stand is locked once approved */}
                        {e.status_request === 'approved' && (
                          <span style={{marginLeft:6,fontSize:9,background:'#dcfce7',color:'#15803d',padding:'1px 6px',borderRadius:20,fontWeight:700}}><Lock size={12} />Terkunci</span>
                        )}
                      </div>
                      {/* Pending change request */}
                      {e.change_request && e.status_request === 'pending_change' && (
                        <div style={{fontSize:10,color:'#d97706',marginTop:4}}>
                          <Clock size={14} />Permintaan ubah ke: <b>{e.change_request}</b> (menunggu admin)
                        </div>
                      )}
                    </div>
                    <div className="ev-usaha-right">
                      <span className={`ev-badge ${e.status_request==='approved'?'approved':e.status_request==='pending_change'?'pending':'pending'}`}>
                        {e.status_request==='approved' ? '✓ Disetujui' : e.status_request==='pending_change' ? '⏳ Ubah Stand' : '⏳ Menunggu'}
                      </span>
                      <div style={{marginTop:4}}>
                        <span className={`ev-badge ${e.assigned_by==='admin'?'published':'self'}`} style={{fontSize:9}}>
                          {e.assigned_by==='admin'?'Oleh Admin':'Mandiri'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Stand change request — only allowed if approved and no pending change */}
                  {e.status_request === 'approved' && !e.change_request && (
                    <div style={{marginTop:10,paddingTop:10,borderTop:'1px solid #e5e7eb'}}>
                      <button
                        onClick={() => setChangeModal(e)}
                        style={{fontSize:11,color:'#2f6f4e',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'4px 12px',cursor:'pointer',fontWeight:600}}
                      >
                        <RefreshCcw size={14} />Minta Ubah Posisi Stand
                      </button>
                      <p style={{fontSize:10,color:'#9ca3af',marginTop:4}}>Perubahan posisi perlu persetujuan admin</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {daftarModal && <DaftarModal event={daftarModal} onClose={()=>setDaftarModal(null)} onSubmit={handleDaftar}/>}

      {/* Change stand modal */}
      {changeModal && (
        <ChangeStandModal ev={changeModal} onClose={() => setChangeModal(null)} onSubmit={handleChangeRequest}/>
      )}
    </div>
  );
}
