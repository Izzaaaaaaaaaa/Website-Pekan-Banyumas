import { useState, useEffect } from 'react';
import PekenNav from './components/layout/PekenNav.jsx';
import PekenFooter from './components/layout/PekenFooter.jsx';
import LoginModal from './components/modals/LoginModal.jsx';
import HomeScreen from './components/screens/HomeScreen.jsx';
import AboutScreen from './components/screens/AboutScreen.jsx';
import ProgramScreen from './components/screens/ProgramScreen.jsx';
import GalleryScreen from './components/screens/GalleryScreen.jsx';
import WorksScreen from './components/screens/WorksScreen.jsx';

// Page → screen routing map.
// PUBLICATION currently re-uses GalleryScreen (placeholder until a
// dedicated publication CMS lands — flagged in HANDOFF §6).
const SCREENS = {
  HOME: HomeScreen,
  ABOUT: AboutScreen,
  PROGRAM: ProgramScreen,
  KARYA: WorksScreen,
  GALLERY: GalleryScreen,
  PUBLICATION: GalleryScreen,
};

export default function App() {
  const [page, setPage] = useState(
    () => localStorage.getItem('peken_page') || 'HOME'
  );
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('peken_page', page);
    window.scrollTo(0, 0);
  }, [page]);

  const Screen = SCREENS[page] || HomeScreen;

  return (
    <div data-screen-label={page}>
      <PekenNav
        current={page}
        onNavigate={setPage}
        onLogin={() => setLoginOpen(true)}
      />
      <Screen onNavigate={setPage} />
      <PekenFooter onNavigate={setPage} />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
