import { useState, useEffect } from 'react';
import PekenNav from './components/layout/PekenNav.jsx';
import PekenFooter from './components/layout/PekenFooter.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import HomeScreen from './components/screens/HomeScreen.jsx';
import AboutScreen from './components/screens/AboutScreen.jsx';
import ProgramScreen from './components/screens/ProgramScreen.jsx';
import GalleryScreen from './components/screens/GalleryScreen.jsx';
import WorksScreen from './components/screens/WorksScreen.jsx';
import PublicProfileScreen from './components/screens/PublicProfileScreen.jsx';
import { toSlug } from './lib/slug.js';

const SCREENS = {
  HOME:        HomeScreen,
  ABOUT:       AboutScreen,
  PROGRAM:     ProgramScreen,
  KARYA:       WorksScreen,
  GALLERY:     GalleryScreen,
  PUBLICATION: GalleryScreen,
};


/** Baca slug dari hash URL: #/@aji-pradana → "aji-pradana" */
const slugFromHash = () => {
  const m = window.location.hash.match(/^#\/@(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function App() {
  const initSlug = slugFromHash();

  const [page, setPage] = useState(initSlug ? 'PUBLIC_PROFILE' : (localStorage.getItem('peken_page') || 'HOME'));
  const [profileOwner, setProfileOwner] = useState(initSlug);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (page === 'PUBLIC_PROFILE' && profileOwner) {
      // Pasang hash URL — peken.com/#/@aji-pradana — bisa di-share
      history.replaceState(null, '', `${window.location.pathname}#/@${profileOwner}`);
    } else {
      // Bersihkan hash saat keluar dari halaman profil
      if (window.location.hash.startsWith('#/@')) {
        history.replaceState(null, '', window.location.pathname);
      }
      localStorage.setItem('peken_page', page);
    }
    window.scrollTo(0, 0);
  }, [page, profileOwner]);

  const handleNavigate = (target, payload) => {
    if (target === 'PUBLIC_PROFILE') {
      setProfileOwner(toSlug(payload));
      setPage('PUBLIC_PROFILE');
    } else {
      setProfileOwner(null);
      setPage(target);
    }
  };

  if (page === 'PUBLIC_PROFILE' && profileOwner) {
    return (
      <div>
        <PekenNav current="KARYA" onNavigate={handleNavigate} onLogin={() => setLoginOpen(true)} />
        <PublicProfileScreen ownerName={profileOwner} onBack={() => handleNavigate('KARYA')} />
        <PekenFooter onNavigate={handleNavigate} />
        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      </div>
    );
  }

  const Screen = SCREENS[page] || HomeScreen;

  return (
    <div>
      <PekenNav current={page} onNavigate={handleNavigate} onLogin={() => setLoginOpen(true)} />
      <Screen onNavigate={handleNavigate} />
      <PekenFooter onNavigate={handleNavigate} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
