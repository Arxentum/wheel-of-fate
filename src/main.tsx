import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/anton/400.css';
import '@fontsource/archivo-narrow/400.css';
import '@fontsource/archivo-narrow/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
// One variable font for every weight, split by unicode-range: the browser only downloads the slices a page uses (D-50).
import '@fontsource-variable/noto-sans-tc/wght.css';
import './ui/styles/global.css';
import { LangProvider } from './ui/hooks/useLang';
import { AssetPreview } from './ui/screens/AssetPreview';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
  <StrictMode>
    <LangProvider>
      <AssetPreview />
    </LangProvider>
  </StrictMode>,
);
