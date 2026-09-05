import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import Exercises from '../src/components/Exercises.jsx';
import ExerciseEditor from '../src/components/ExerciseEditor.jsx';
import Login from '../src/components/Login.jsx';
import Users from '../src/components/Users.jsx';
import '../src/index.css';

// Registro de telas disponíveis pro harness -- adicione uma entrada aqui pra
// cada componente que precisar de preview visual sem login (ver README:
// "npm run preview -- --config vite.preview.config.js"). Cada entrada nova
// pode precisar de um alias de service com dado de fixture em
// vite.preview.config.js, do jeito que exerciseService.js já tem.
const SCREENS = {
  exercises: Exercises,
  'exercise-editor': ExerciseEditor,
  login: Login,
  users: Users,
};

const screenName = new URLSearchParams(window.location.search).get('screen') || 'exercises';
const Screen = SCREENS[screenName] ?? Exercises;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Screen />
      </div>
    </MemoryRouter>
  </StrictMode>
);

// Exercises abre na aba "Tabela" por padrão; ?grid=1 clica em "Grade" assim
// que o botão existir (o componente controla o próprio estado interno, não
// dá pra passar a view inicial por prop de fora).
if (new URLSearchParams(window.location.search).get('grid') === '1') {
  const clickGrid = () => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Grade');
    if (btn) btn.click();
    else setTimeout(clickGrid, 100);
  };
  setTimeout(clickGrid, 300);
}
