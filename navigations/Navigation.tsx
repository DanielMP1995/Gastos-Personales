import React from 'react';

import {
    createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs';

import {
    NavigationContainer,
} from '@react-navigation/native';

import {
    createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
    Ionicons,
} from '@expo/vector-icons';

import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

// ============================================================
// PANTALLAS
// ============================================================

import LoginScreen
    from '../screen/Login/LoginScreen';

import InicioScreen
    from '../screen/Inicio/InicioScreen';

import PerfilScreen
    from '../screen/Perfiles/PerfilScreen';

import RegistroScreen
    from '../screen/Registro/RegistroScreen';

import RegistroMovimientosScreen
    from '../screen/Registros/RegistroMovimientosScreen';

import RegistroIngresosScreen
    from '../screen/Registros/RegistroIngresosScreen';

import RegistroDeudasScreen
    from '../screen/Registros/RegistroDeudasScreen';

import RegistroGastosFijosScreen
    from '../screen/Registros/RegistroGastosFijosScreen';

import RegistroGastosScreen
    from '../screen/Registros/RegistroGastosScreen';

import RegistroGastosRapidos
    from '../screen/Registros/RegistroGastosRapidos';

import ReporteDeudasRegistradas
    from '../screen/Reportes/ReporteDeudasRegistradas';

import ConfigurarParejaScreen
    from '../config/ConfigurarParejaScreen';

import RegistroGastosDetallados
    from '../screen/Registros/RegistroGastosDetallados';

import CuentasYEfectivoScreen
    from '../screen/Cuentas/CuentasYEfectivoScreen';

// ============================================================
// NAVIGATORS
// ============================================================

const Tab =
    createMaterialTopTabNavigator();

const Stack =
    createNativeStackNavigator();

// ============================================================
// TABS PRINCIPALES
// ============================================================

function MyTabs() {

    const insets =
        useSafeAreaInsets();

    const bottomSafeArea =
        insets.bottom > 0
            ? insets.bottom
            : 8;

    return (

        <Tab.Navigator

            initialRouteName="Inicio"

            // ====================================================
            // EL SWIPE FUNCIONA EN TODA LA PANTALLA
            // ====================================================

            tabBarPosition="bottom"

            screenOptions={({ route }) => ({

                headerShown: false,

                // =================================================
                // SWIPE
                // =================================================

                swipeEnabled: true,

                // Animación suave al cambiar de pantalla
                animationEnabled: true,

                // =================================================
                // BARRA INFERIOR
                // =================================================

                tabBarStyle: {

                    backgroundColor: '#FFFFFF',

                    borderTopColor: '#E2E8F0',

                    borderTopWidth: 1,

                    elevation: 0,

                    height:
                        65 +
                        bottomSafeArea,

                    paddingBottom:
                        bottomSafeArea,

                    paddingTop: 6,
                },

                // =================================================
                // LÍNEA VERDE
                // =================================================
                //
                // Esta es la parte importante:
                //
                // Al deslizar la pantalla, la línea verde
                // también se desplaza suavemente hacia el
                // siguiente tab.
                //
                // =================================================

                tabBarIndicatorStyle: {

                    backgroundColor: '#059669',

                    height: 3,

                    borderRadius: 3,
                },

                // =================================================
                // COLOR ACTIVO
                // =================================================

                tabBarActiveTintColor:
                    '#059669',

                // =================================================
                // COLOR INACTIVO
                // =================================================

                tabBarInactiveTintColor:
                    '#64748B',

                // =================================================
                // TEXTO
                // =================================================

                tabBarLabelStyle: {

                    fontSize: 11,

                    fontWeight: '600',

                    textTransform: 'none',

                    marginTop: 0,
                },

                // =================================================
                // ICONOS
                // =================================================

                tabBarIcon: ({
                    focused,
                    color,
                }) => {

                    let iconName:
                        keyof typeof Ionicons.glyphMap =
                        'home-outline';

                    // --------------------------------------------
                    // INICIO
                    // --------------------------------------------

                    if (
                        route.name ===
                        'Inicio'
                    ) {

                        iconName =
                            focused
                                ? 'home'
                                : 'home-outline';
                    }

                    // --------------------------------------------
                    // REGISTROS
                    // --------------------------------------------

                    else if (
                        route.name ===
                        'Registros'
                    ) {

                        iconName =
                            focused
                                ? 'add-circle'
                                : 'add-circle-outline';
                    }

                    // --------------------------------------------
                    // REPORTES
                    // --------------------------------------------

                    else if (
                        route.name ===
                        'Reportes'
                    ) {

                        iconName =
                            focused
                                ? 'bar-chart'
                                : 'bar-chart-outline';
                    }

                    // --------------------------------------------
                    // CUENTAS
                    // --------------------------------------------

                    else if (
                        route.name ===
                        'Cuentas'
                    ) {

                        iconName =
                            focused
                                ? 'wallet'
                                : 'wallet-outline';
                    }

                    // --------------------------------------------
                    // PERFIL
                    // --------------------------------------------

                    else if (
                        route.name ===
                        'Perfil'
                    ) {

                        iconName =
                            focused
                                ? 'person'
                                : 'person-outline';
                    }

                    return (

                        <Ionicons
                            name={iconName}
                            size={22}
                            color={color}
                        />

                    );
                },
            })}
        >

            {/* ================================================== */}
            {/* 1. INICIO */}
            {/* ================================================== */}

            <Tab.Screen
                name="Inicio"
                component={InicioScreen}
            />

            {/* ================================================== */}
            {/* 2. REGISTROS */}
            {/* ================================================== */}

            <Tab.Screen
                name="Registros"
                component={RegistroMovimientosScreen}
            />

            {/* ================================================== */}
            {/* 3. REPORTES */}
            {/* ================================================== */}

            <Tab.Screen
                name="Reportes"
                component={ReporteDeudasRegistradas}
            />

            {/* ================================================== */}
            {/* 4. CUENTAS */}
            {/* ================================================== */}

            <Tab.Screen
                name="Cuentas"
                component={CuentasYEfectivoScreen}
            />

            {/* ================================================== */}
            {/* 5. PERFIL */}
            {/* ================================================== */}

            <Tab.Screen
                name="Perfil"
                component={PerfilScreen}
            />

        </Tab.Navigator>
    );
}

// ============================================================
// STACK PRINCIPAL
// ============================================================

function MyStack() {

    return (

        <Stack.Navigator

            initialRouteName="login"

            screenOptions={{

                headerShown: false,

                gestureEnabled: true,

                animation:
                    'slide_from_right',
            }}
        >

            {/* ================================================= */}
            {/* LOGIN */}
            {/* ================================================= */}

            <Stack.Screen
                name="login"
                component={LoginScreen}
            />

            {/* ================================================= */}
            {/* REGISTRO */}
            {/* ================================================= */}

            <Stack.Screen
                name="registro"
                component={RegistroScreen}
            />

            {/* ================================================= */}
            {/* CONFIGURAR PAREJA */}
            {/* ================================================= */}

            <Stack.Screen
                name="configurarPareja"
                component={ConfigurarParejaScreen}
            />

            {/* ================================================= */}
            {/* TABS */}
            {/* ================================================= */}

            <Stack.Screen
                name="tabs"
                component={MyTabs}
                options={{
                    headerShown: false,
                }}
            />

            {/* ================================================= */}
            {/* INGRESOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="ingresos"
                component={RegistroIngresosScreen}
            />

            {/* ================================================= */}
            {/* DEUDAS */}
            {/* ================================================= */}

            <Stack.Screen
                name="deudas"
                component={RegistroDeudasScreen}
            />

            {/* ================================================= */}
            {/* GASTOS FIJOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastosfijos"
                component={RegistroGastosFijosScreen}
            />

            {/* ================================================= */}
            {/* GASTOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastos"
                component={RegistroGastosScreen}
            />

            {/* ================================================= */}
            {/* GASTOS RÁPIDOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastosRapidos"
                component={RegistroGastosRapidos}
            />

            {/* ================================================= */}
            {/* GASTOS DETALLADOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastosDetalle"
                component={RegistroGastosDetallados}
            />

        </Stack.Navigator>
    );
}

// ============================================================
// NAVEGADOR PRINCIPAL
// ============================================================

export const Navegador = () => {

    return (

        <SafeAreaProvider>

            <NavigationContainer>

                <MyStack />

            </NavigationContainer>

        </SafeAreaProvider>
    );
};