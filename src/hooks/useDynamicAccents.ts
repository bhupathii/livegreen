import { useEffect, useCallback } from 'react';

export type HoneyTheme = {
    primary: string;
    light: string;
    glow: string;
    glowStrong: string;
};

const themes: Record<string, HoneyTheme> = {
    Default: {
        primary: '#2D5A27',
        light: '#E8F5E9',
        glow: 'rgba(45, 90, 39, 0.15)',
        glowStrong: 'rgba(45, 90, 39, 0.35)',
    },
    Jamun: {
        primary: '#4B0082',
        light: '#F3E5F5',
        glow: 'rgba(75, 0, 130, 0.15)',
        glowStrong: 'rgba(75, 0, 130, 0.35)',
    },
    Mustard: {
        primary: '#E1AD01',
        light: '#FFFDE7',
        glow: 'rgba(225, 173, 1, 0.15)',
        glowStrong: 'rgba(225, 173, 1, 0.35)',
    },
    Tulsi: {
        primary: '#2E7D32',
        light: '#E8F5E9',
        glow: 'rgba(46, 125, 50, 0.15)',
        glowStrong: 'rgba(46, 125, 50, 0.35)',
    },
    Multiflora: {
        primary: '#D4AF37',
        light: '#FCF9F1',
        glow: 'rgba(212, 175, 55, 0.15)',
        glowStrong: 'rgba(212, 175, 55, 0.35)',
    },
    Sesame: {
        primary: '#CD853F',
        light: '#FFF3E0',
        glow: 'rgba(205, 133, 63, 0.15)',
        glowStrong: 'rgba(205, 133, 63, 0.35)',
    },
};

export function useDynamicAccents() {
    const setHoneyTheme = useCallback((honeyType: string | null) => {
        const theme = themes[honeyType || 'Default'] || themes.Default;
        const root = document.documentElement;

        root.style.setProperty('--accent-dynamic', theme.primary);
        root.style.setProperty('--accent-dynamic-light', theme.light);
        root.style.setProperty('--accent-dynamic-glow', theme.glow);
        root.style.setProperty('--accent-dynamic-glow-strong', theme.glowStrong);
    }, []);

    const resetTheme = useCallback(() => {
        setHoneyTheme(null);
    }, [setHoneyTheme]);

    return { setHoneyTheme, resetTheme };
}
