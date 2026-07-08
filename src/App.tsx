import { useEffect, useState } from 'react';
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

export default function App() {
  const screen = useAppStore(s => s.screen);
  const login = useAppStore(s => s.login);
  const setScreen = useAppStore(s => s.setScreen);
  const theme = useAppStore(s => s.theme);

  // Check for ?reset=TOKEN in URL on load
  const [resetToken, setResetToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reset');
  });

  // Apply theme class on mount and whenever theme changes
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  if (resetToken) {
    return (
      <div className="app">
        <ResetPasswordScreen token={resetToken} onDone={() => {
          setResetToken(null);
          window.history.replaceState({}, '', '/');
          setScreen('login');
        }} />
      </div>
    );
  }

  return (
    <div className="app">
      {screen === 'home' && <HomeScreen onGetStarted={() => setScreen('login')} />}
      {screen === 'login' && <LoginScreen onAuth={(user, token) => login(user, token)} />}
      {screen === 'select' && <LanguageSelect />}
      {screen === 'onboarding' && <OnboardingChat />}
      {screen === 'path' && <LessonPath />}
      {screen === 'chat' && <ConversationScreen />}
      {screen === 'profile' && <ProfileScreen />}
    </div>
  );
}
