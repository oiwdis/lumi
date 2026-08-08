import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import type { CourseId } from './types';
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import LanguageSelect from './components/LanguageSelect';
import LessonPath from './components/LessonPath';
import ConversationScreen from './components/ConversationScreen';
import ProfileScreen from './components/ProfileScreen';
import OnboardingChat from './components/OnboardingChat';
import { LANDING_LANGS, langBySlug } from './data/landingLangs';
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
  // Per-language landing pages are the home screen with a language-specific hero
  ...Object.fromEntries(LANDING_LANGS.map(l => [`/${l.slug}`, 'home' as Screen])),
};

// Screens nobody should land on without an account. Reaching one of these from
// the URL (a deep link, or Back after logging out) falls back to the landing page.
const PROTECTED: Screen[] = ['select', 'onboarding', 'path', 'chat', 'profile'];

export default function App() {
  const screen = useAppStore(s => s.screen);
  const login  = useAppStore(s => s.login);
  const setScreen = useAppStore(s => s.setScreen);
  const theme  = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const syncFromServer = useAppStore(s => s.syncFromServer);
  const user = useAppStore(s => s.user);
  const currentLessonId = useAppStore(s => s.currentLessonId);
  const openOnboarding = useAppStore(s => s.openOnboarding);
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

  // What the effect below saw last time it ran, so it can tell which side moved.
  // These are values it *observed*, not ones it intended — recording intent would
  // misread StrictMode's double-invoke (same render, same state) as a real change.
  const seen = useRef<{ path: string; screen: Screen } | null>(null);

  // URL and store screen, kept in step. This was two effects — one each way —
  // and because each was missing the other's value from its dependency array,
  // they could disagree and then correct each other forever: opening /login or
  // /signup while already signed in put the app in an infinite navigate loop
  // and dropped it on the error screen. One effect that owns both directions
  // can't race itself.
  useEffect(() => {
    const path = location.pathname;
    const mapped = PATH_TO_SCREEN[path];
    const prev = seen.current;
    seen.current = { path, screen };
    if (prev && prev.path === path && prev.screen === screen) return;

    // On the first run both sides are "new", and the URL is the one the user
    // actually asked for — so a deep link wins over the store's default screen.
    const urlMoved = !prev || prev.path !== path;

    if (urlMoved && mapped) {
      // These rewrite the URL themselves: if the screen is already what we're
      // falling back to, setScreen is a no-op and the address bar would keep
      // showing the rejected path.
      if (PROTECTED.includes(mapped) && !user) {
        setScreen('home');
        navigate('/', { replace: true });
        return;
      }
      // /lesson is meaningless without a chosen lesson — back to the path
      if (mapped === 'chat' && !currentLessonId) {
        setScreen('path');
        navigate('/path', { replace: true });
        return;
      }
      if (mapped !== screen) setScreen(mapped);
      return;
    }

    // The store moved, so bring the URL along. A path that already maps to the
    // current screen is left alone, so deep links like /learn-japanese survive
    // instead of being rewritten to '/'.
    //
    // This pushes rather than replaces: with replace, the whole app occupied a
    // single history entry, so pressing Back from any screen left the site
    // entirely instead of going to the previous screen.
    const targetPath = SCREEN_TO_PATH[screen];
    if (targetPath && mapped !== screen) navigate(targetPath);
  }, [location.pathname, screen, user, currentLessonId, setScreen, navigate]);

  // Someone who generated a plan on the landing page shouldn't retype their goal
  useEffect(() => {
    if (!user || screen !== 'select') return;
    let pending: { courseId?: CourseId } | null = null;
    try { pending = JSON.parse(sessionStorage.getItem('lumi-pending-goal') ?? 'null'); } catch { /* ignore */ }
    if (pending?.courseId) openOnboarding(pending.courseId);
  }, [user, screen, openOnboarding]);

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
      {screen === 'home'       && (
        <HomeScreen
          onGetStarted={() => setScreen('login')}
          lang={langBySlug(location.pathname.replace(/^\//, ''))}
          onPickLang={slug => navigate(slug ? `/${slug}` : '/')}
        />
      )}
      {screen === 'login'      && <LoginScreen onAuth={(user, token) => login(user, token)} initialTab={initialTab as 'login' | 'signup'} onBack={() => setScreen('home')} />}
      {screen === 'select'     && <LanguageSelect />}
      {screen === 'onboarding' && <OnboardingChat />}
      {screen === 'path'       && <LessonPath />}
      {screen === 'chat'       && <ConversationScreen />}
      {screen === 'profile'    && <ProfileScreen />}
    </div>
  );
}
