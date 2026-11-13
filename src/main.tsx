import { createRoot } from 'react-dom/client';
import './index.css';
import './portfolio/portfolio.css';
import App from './App.tsx';

// 3D 场景在开发模式下会被 StrictMode 双次初始化，这里不启用 StrictMode。
createRoot(document.getElementById('root')!).render(<App />);
