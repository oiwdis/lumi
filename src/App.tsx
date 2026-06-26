import { useAppStore } from './store/useAppStore';
import LoginScreen from './components/LoginScreen';
import LanguageSelect from './components/LanguageSelect';
import LessonPath from './components/LessonPath';
import ConversationScreen from './components/ConversationScreen';
import './App.css';

export default function App() {
  const screen = useAppStore(s => s.screen);
  const login = useAppStore(s => s.login);

  return (
    <div className="app">
      {screen === 'login' && <LoginScreen onAuth={login} />}
      {screen === 'select' && <LanguageSelect />}
      {screen === 'path' && <LessonPath />}
      {screen === 'chat' && <ConversationScreen />}
    </div>
  );
}
