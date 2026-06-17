import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
                // Rewrite the cookie domain so the browser accepts it on localhost:5173
                cookieDomainRewrite: {
                    'localhost': 'localhost',
                    '*': 'localhost',
                },
                // CRITICAL: manually re-attach Set-Cookie headers that http-proxy drops
                configure: (proxy) => {
                    proxy.on('proxyRes', (proxyRes, req, res) => {
                        const setCookie = proxyRes.headers['set-cookie'];
                        if (setCookie) {
                            // Strip Secure flag so cookies work over plain http in dev
                            const cleaned = setCookie.map((c) =>
                                c.replace(/;\s*Secure/gi, '')
                                 .replace(/;\s*SameSite=None/gi, '; SameSite=Lax')
                            );
                            res.setHeader('Set-Cookie', cleaned);
                        }
                    });
                },
            },
            // Product images served by Spring Boot's static resource handler.
            // Without this, images fetch directly from localhost:8080 and bypass the proxy.
            '/uploads': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled', '@mui/x-data-grid'],
                    utils: ['axios', 'react-toastify', 'xlsx', '@tanstack/react-query']
                }
            }
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', '@mui/material', '@mui/icons-material']
    }
});

