import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.tsx';

/**
 * Build-time render of the page (scripts/prerender.mjs). The HTML it returns
 * is written into dist/index.html so the content exists before any script
 * runs — for crawlers, link previews and visitors without JavaScript — and
 * main.tsx hydrates it instead of rendering from scratch.
 */
export function render() {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
