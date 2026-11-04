import '@/lib/zod-jitless';
import { createRoot } from 'react-dom/client';
import { PreviewApp } from './App';
import { startRouter } from './router';

startRouter();
createRoot(document.getElementById('root')!).render(<PreviewApp />);
