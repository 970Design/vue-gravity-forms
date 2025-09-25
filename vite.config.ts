import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: './components/VueGravityForms.vue',
            name: 'VueGravityForms',
            fileName: (format) => `vue-gravity-forms.${format}.js`,
        },
        rollupOptions: {
            external: ['vue'], // Exclude Vue from the bundle
            output: {
                globals: {
                    vue: 'Vue',
                },
            },
        },
    },
});