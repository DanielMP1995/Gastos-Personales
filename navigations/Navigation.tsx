import React from 'react';

import {
    NavigationContainer,
} from '@react-navigation/native';

import {
    createMaterialTopTabNavigator,
} from '@react-navigation/material-top-tabs';

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
// TEMA
// ============================================================

import {
    ThemeProvider,
    useTheme,
} from '../context/ThemeContext';


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
// SELECCIONAR TEMA
// ============================================================

import SeleccionarTemaScreen
    from '../screen/Configuracion/SeleccionarTemaScreen';


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

    const {
        colors,
    } = useTheme();

    const bottomSafeArea =
        insets.bottom > 0
            ? insets.bottom
            : 8;


    return (

        <Tab.Navigator

            initialRouteName="Inicio"

            tabBarPosition="bottom"

            screenOptions={({ route }) => ({

                headerShown: false,

                // =================================================
                // SWIPE
                // =================================================

                swipeEnabled: true,

                animationEnabled: true,


                // =================================================
                // BARRA INFERIOR
                // =================================================

                tabBarStyle: {

                    backgroundColor:
                        '#FFFFFF',

                    borderTopColor:
                        '#E2E8F0',

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
                // INDICADOR
                // =================================================

                tabBarIndicatorStyle: {

                    backgroundColor:
                        colors.primary,

                    height: 3,

                    borderRadius: 3,
                },


                // =================================================
                // COLOR ACTIVO
                // =================================================

                tabBarActiveTintColor:
                    colors.primary,


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
            {/* INICIO */}
            {/* ================================================== */}

            <Tab.Screen
                name="Inicio"
                component={InicioScreen}
            />


            {/* ================================================== */}
            {/* REGISTROS */}
            {/* ================================================== */}

            <Tab.Screen
                name="Registros"
                component={
                    RegistroMovimientosScreen
                }
            />


            {/* ================================================== */}
            {/* REPORTES */}
            {/* ================================================== */}

            <Tab.Screen
                name="Reportes"
                component={
                    ReporteDeudasRegistradas
                }
            />


            {/* ================================================== */}
            {/* CUENTAS */}
            {/* ================================================== */}

            <Tab.Screen
                name="Cuentas"
                component={
                    CuentasYEfectivoScreen
                }
            />


            {/* ================================================== */}
            {/* PERFIL */}
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
                component={
                    ConfigurarParejaScreen
                }
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
                component={
                    RegistroIngresosScreen
                }
            />


            {/* ================================================= */}
            {/* DEUDAS */}
            {/* ================================================= */}

            <Stack.Screen
                name="deudas"
                component={
                    RegistroDeudasScreen
                }
            />


            {/* ================================================= */}
            {/* GASTOS FIJOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastosfijos"
                component={
                    RegistroGastosFijosScreen
                }
            />


            {/* ================================================= */}
            {/* GASTOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastos"
                component={
                    RegistroGastosScreen
                }
            />


            {/* ================================================= */}
            {/* GASTOS RÁPIDOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastosRapidos"
                component={
                    RegistroGastosRapidos
                }
            />


            {/* ================================================= */}
            {/* GASTOS DETALLADOS */}
            {/* ================================================= */}

            <Stack.Screen
                name="gastosDetalle"
                component={
                    RegistroGastosDetallados
                }
            />


            {/* ================================================= */}
            {/* SELECCIONAR TEMA */}
            {/* ================================================= */}

            <Stack.Screen
                name="seleccionarTema"
                component={
                    SeleccionarTemaScreen
                }
            />

        </Stack.Navigator>

    );

}


// ============================================================
// NAVEGADOR PRINCIPAL
// ============================================================

function AppNavigation() {

    return (

        <NavigationContainer>

            <MyStack />

        </NavigationContainer>

    );

}


// ============================================================
// APP
// ============================================================

export default function App() {

    return (

        <SafeAreaProvider>

            <ThemeProvider>

                <AppNavigation />

            </ThemeProvider>

        </SafeAreaProvider>

    );

}