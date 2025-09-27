import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true); // Dark mode por padrão

    // Carregar tema do localStorage na inicialização
    useEffect(() => {
        const savedTheme = localStorage.getItem('app_theme');
        if (savedTheme) {
            setIsDarkMode(savedTheme === 'dark');
        }
    }, []);

    // Aplicar tema ao body e salvar no localStorage
    useEffect(() => {
        const body = document.body;
        const html = document.documentElement;
        
        if (isDarkMode) {
            body.classList.add('dark');
            body.classList.remove('light');
            html.classList.add('dark');
            html.classList.remove('light');
            // Aplicar classes do Tailwind para dark mode
            body.style.backgroundColor = '#111827'; // bg-gray-900
            body.style.color = '#f9fafb'; // text-gray-50
        } else {
            body.classList.add('light');
            body.classList.remove('dark');
            html.classList.add('light');
            html.classList.remove('dark');
            // Aplicar classes do Tailwind para light mode
            body.style.backgroundColor = '#ffffff'; // bg-white
            body.style.color = '#111827'; // text-gray-900
        }
        
        localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(prev => !prev);
    };

    const value = {
        isDarkMode,
        toggleTheme,
        setIsDarkMode
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};