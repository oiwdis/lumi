import { useAppStore } from './store/useAppStore';
import HomeScreen from './components/HomeScreen';
import LoginScreen from './components/LoginScreen';
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
