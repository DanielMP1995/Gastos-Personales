import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';


// ============================================================
// TIPO DE TEMA
// ============================================================

export interface Tema {
    id: string;
    name: string;
    primary: string;
    dark: string;
    light: string;
    veryLight: string;
}


// ============================================================
// TEMAS DISPONIBLES
// ============================================================

export const temas: Tema[] = [

    {
        id: 'azul',
        name: 'Azul',
        primary: '#1565C0',
        dark: '#0B3D91',
        light: '#BBDEFB',
        veryLight: '#EAF6FA',
    },

    {
        id: 'verde',
        name: 'Verde',
        primary: '#2E7D32',
        dark: '#1B5E20',
        light: '#C8E6C9',
        veryLight: '#F1F8F1',
    },

    {
        id: 'morado',
        name: 'Morado',
        primary: '#7B1FA2',
        dark: '#4A148C',
        light: '#E1BEE7',
        veryLight: '#FAF3FC',
    },

    {
        id: 'rojo',
        name: 'Rojo',
        primary: '#D32F2F',
        dark: '#B71C1C',
        light: '#FFCDD2',
        veryLight: '#FFF5F5',
    },

    {
        id: 'naranja',
        name: 'Naranja',
        primary: '#EF6C00',
        dark: '#E65100',
        light: '#FFE0B2',
        veryLight: '#FFF8F2',
    },

    {
        id: 'turquesa',
        name: 'Turquesa',
        primary: '#00838F',
        dark: '#006064',
        light: '#B2EBF2',
        veryLight: '#F0FBFC',
    },

    {
        id: 'rosa',
        name: 'Rosa',
        primary: '#C2185B',
        dark: '#880E4F',
        light: '#F8BBD0',
        veryLight: '#FFF4F8',
    },

    {
        id: 'negro',
        name: 'Oscuro',
        primary: '#37474F',
        dark: '#263238',
        light: '#CFD8DC',
        veryLight: '#F4F6F7',
    },

];


// ============================================================
// TIPO DEL CONTEXTO
// ============================================================

interface ThemeContextType {

    colors: Tema;

    temas: Tema[];

    cambiarTema: (
        tema: Tema
    ) => void;

}


// ============================================================
// CONTEXTO
// ============================================================

const ThemeContext =
    createContext<ThemeContextType | undefined>(
        undefined
    );


// ============================================================
// PROVIDER
// ============================================================

export function ThemeProvider({
    children,
}: {
    children: React.ReactNode;
}) {

    const [colors, setColors] =
        useState<Tema>(temas[0]);


    // ========================================================
    // CARGAR TEMA GUARDADO
    // ========================================================

    useEffect(() => {

        const cargarTema = async () => {

            try {

                const temaGuardado =
                    await AsyncStorage.getItem(
                        '@tema_app'
                    );

                if (temaGuardado) {

                    const temaEncontrado =
                        temas.find(
                            tema =>
                                tema.id ===
                                temaGuardado
                        );

                    if (temaEncontrado) {

                        setColors(
                            temaEncontrado
                        );

                    }

                }

            } catch (error) {

                console.log(
                    'Error cargando tema:',
                    error
                );

            }

        };

        cargarTema();

    }, []);


    // ========================================================
    // CAMBIAR TEMA
    // ========================================================

    const cambiarTema = async (
        tema: Tema
    ) => {

        setColors(tema);

        try {

            await AsyncStorage.setItem(
                '@tema_app',
                tema.id
            );

        } catch (error) {

            console.log(
                'Error guardando tema:',
                error
            );

        }

    };


    // ========================================================
    // PROVIDER
    // ========================================================

    return (

        <ThemeContext.Provider
            value={{
                colors,
                temas,
                cambiarTema,
            }}
        >

            {children}

        </ThemeContext.Provider>

    );

}


// ============================================================
// HOOK
// ============================================================

export function useTheme() {

    const context =
        useContext(ThemeContext);

    if (!context) {

        throw new Error(
            'useTheme debe utilizarse dentro de ThemeProvider'
        );

    }

    return context;

}