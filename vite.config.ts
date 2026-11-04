import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `npm run dev` has no worker behind it, so /api/reviews would return index.html. Serve sample reviews from
// dev/mock-reviews.json instead (dev server only; builds and `wrangler dev` use the real worker).
// MOCK_REVIEWS=0 shows the empty state; MOCK_REVIEWS=120 repeats the samples up to 120 reviews to try the pages.
function mockReviews(): Plugin {
  return {
    name: 'mock-reviews',
    apply: 'serve',
    configureServer(server) {
      if (process.env.MOCK_REVIEWS === '0') return;
      server.middlewares.use('/api/reviews', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method === 'POST') {
          res.end(JSON.stringify({ ok: true }));
          return;
        }
        const samples: { id: string; createdAt: string }[] = JSON.parse(
          readFileSync(new URL('./dev/mock-reviews.json', import.meta.url), 'utf8'),
        );
        const count = Number(process.env.MOCK_REVIEWS) || samples.length;
        const reviews = Array.from({ length: count }, (_, i) => ({
          ...samples[i % samples.length],
          id: `mock-${i + 1}`,
          createdAt: new Date(
            Date.parse(samples[i % samples.length].createdAt) - Math.floor(i / samples.length) * 30 * 864e5,
          ).toISOString(),
        }));
        res.end(JSON.stringify({ reviews }));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mockReviews()],
});
