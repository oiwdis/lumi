import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import LanguageSelect from './components/LanguageSelect';
import LessonPath from './components/LessonPath';
import ConversationScreen from './components/ConversationScreen';
import ProfileScreen from './components/ProfileScreen';
import OnboardingChat from './components/OnboardingChat';
import './App.css';

type Screen = 'home' | 'login' | 'select' | 'onboarding' | 'path' | 'chat' | 'profile';

const SCREEN_TO_PATH: Record<Screen, string> = {
  home:       '/',
  login:      '/login',
  select:     '/learn',
  onboarding: '/onboarding',
  path:       '/path',
  chat:       '/lesson',
  profile:    '/profile',
};

const PATH_TO_SCREEN: Record<string, Screen> = {
  '/':           'home',
  '/login':      'login',
  '/signup':     'login',
  '/learn':      'select',
  '/onboarding': 'onboarding',
  '/path':       'path',
  '/lesson':     'chat',
  '/profile':    'profile',
};

export default function App() {
  const screen = useAppStore(s => s.screen);
  const login  = useAppStore(s => s.login);
  const setScreen = useAppStore(s => s.setScreen);
  const theme  = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const syncFromServer = useAppStore(s => s.syncFromServer);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [offlineBannerDismissed, setOfflineBannerDismissed] = useState(false);
  // Screens that have their own theme toggle built into their UI
  const screensWithOwnToggle: typeof screen[] = ['home', 'path', 'select', 'chat'];
  const navigate = useNavigate();
  const location = useLocation();

  // Check for ?reset=TOKEN
  const [resetToken, setResetToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reset');
  });

  // Apply theme
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Re-sync from server when tab becomes visible (handles multi-device use)
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') syncFromServer(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncFromServer]);

  // Track online/offline status
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true); setOfflineBannerDismissed(false); };
    const onOffline = () => { setIsOnline(false); setOfflineBannerDismissed(false); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // On mount: if URL has a known path, set the store screen to match
  useEffect(() => {
    const mapped = PATH_TO_SCREEN[location.pathname];
    if (mapped && mapped !== screen) {
      // Only navigate to public screens from URL directly — protected ones need auth
      if (mapped === 'home' || mapped === 'login') setScreen(mapped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever screen changes in store, update the URL
  useEffect(() => {
    const targetPath = SCREEN_TO_PATH[screen];
    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (resetToken) {
    return (
      <div className="app">
        <ResetPasswordScreen token={resetToken} onDone={() => {
          setResetToken(null);
          window.history.replaceState({}, '', '/login');
          setScreen('login');
        }} />
      </div>
    );
  }

  // /signup goes to login screen with signup tab
  const initialTab = location.pathname === '/signup' ? 'signup' : 'login';

  return (
    <div className="app">
      {!isOnline && !offlineBannerDismissed && (
        <div className="offline-banner">
          <div className="offline-banner-body">
            <span className="offline-banner-icon">📶</span>
            <div className="offline-banner-text">
              <strong>You're offline</strong>
              <span className="offline-banner-rows">
                <span className="offline-row offline-row--ok">✓ Lessons &amp; exercises</span>
                <span className="offline-row offline-row--ok">✓ Your progress &amp; stats</span>
                <span className="offline-row offline-row--no">✗ AI chat tutor</span>
                <span className="offline-row offline-row--no">✗ Sign in / sign up</span>
              </span>
            </div>
          </div>
          <button className="offline-banner-close" onClick={() => setOfflineBannerDismissed(true)}>✕</button>
        </div>
      )}
      {!screensWithOwnToggle.includes(screen) && (
        <button className="global-theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      )}
      {screen === 'home'       && <HomeScreen onGetStarted={() => setScreen('login')} />}
      {screen === 'login'      && <LoginScreen onAuth={(user, token) => login(user, token)} initialTab={initialTab as 'login' | 'signup'} onBack={() => setScreen('home')} />}
      {screen === 'select'     && <LanguageSelect />}
      {screen === 'onboarding' && <OnboardingChat />}
      {screen === 'path'       && <LessonPath />}
      {screen === 'chat'       && <ConversationScreen />}
      {screen === 'profile'    && <ProfileScreen />}
    </div>
  );
}
