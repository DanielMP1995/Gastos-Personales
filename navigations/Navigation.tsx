import React, {
    ComponentType,
    useRef,
} from 'react';

import {
    Animated,
    PanResponder,
    View,
} from 'react-native';

import {
    createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
    NavigationContainer,
} from '@react-navigation/native';

import {
    createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { Ionicons } from '@expo/vector-icons';

import {
    SafeAreaProvider,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

// ============================================================
// PANTALLAS
// ============================================================

import LoginScreen from '../screen/Login/LoginScreen';

import InicioScreen from '../screen/Inicio/InicioScreen';

import PerfilScreen from '../screen/Perfiles/PerfilScreen';

import RegistroScreen from '../screen/Registro/RegistroScreen';

import RegistroMovimientosScreen from '../screen/Registros/RegistroMovimientosScreen';

import RegistroIngresosScreen from '../screen/Registros/RegistroIngresosScreen';

import RegistroDeudasScreen from '../screen/Registros/RegistroDeudasScreen';

import RegistroGastosFijosScreen from '../screen/Registros/RegistroGastosFijosScreen';

import RegistroGastosScreen from '../screen/Registros/RegistroGastosScreen';

import RegistroGastosRapidos from '../screen/Registros/RegistroGastosRapidos';

import ReporteDeudasRegistradas from '../screen/Reportes/ReporteDeudasRegistradas';

import ConfigurarParejaScreen from '../config/ConfigurarParejaScreen';

import RegistroGastosDetallados from '../screen/Registros/RegistroGastosDetallados';

import CuentasYEfectivoScreen from '../screen/Cuentas/CuentasYEfectivoScreen';

// ============================================================
// NAVIGATORS
// ============================================================

const Tab = createBottomTabNavigator();

const Stack = createNativeStackNavigator();

// ============================================================
// ORDEN DE LAS PESTAÑAS
// ============================================================

const TAB_NAMES = [
    'Inicio',
    'Registros',
    'Reportes',
    'Cuentas',
    'Perfil',
];

// ============================================================
// WRAPPER PARA PERMITIR DESLIZAR DE LADO A LADO
// ============================================================

function SwipeScreen({
    component: ScreenComponent,
    navigation,
    route,
}: {
    component: ComponentType<any>;
    navigation: any;
    route: any;
}) {

    const navegando = useRef(false);

    const panResponder = useRef(

        PanResponder.create({

            // ====================================================
            // SOLO TOMAMOS EL GESTO SI ES HORIZONTAL
            // ====================================================

            onMoveShouldSetPanResponder: (
                _event,
                gestureState
            ) => {

                const movimientoHorizontal =
                    Math.abs(gestureState.dx) >
                    Math.abs(gestureState.dy);

                const movimientoSuficiente =
                    Math.abs(gestureState.dx) > 20;

                return (
                    movimientoHorizontal &&
                    movimientoSuficiente
                );
            },

            // ====================================================
            // CUANDO TERMINA EL GESTO
            // ====================================================

            onPanResponderRelease: (
                _event,
                gestureState
            ) => {

                if (navegando.current) {
                    return;
                }

                const desplazamiento =
                    gestureState.dx;

                const velocidad =
                    gestureState.vx;

                // ------------------------------------------------
                // SI NO SE MOVIÓ SUFICIENTE, NO HACEMOS NADA
                // ------------------------------------------------

                if (
                    Math.abs(desplazamiento) < 60 &&
                    Math.abs(velocidad) < 0.5
                ) {
                    return;
                }

                const indiceActual =
                    TAB_NAMES.indexOf(route.name);

                if (indiceActual === -1) {
                    return;
                }

                let nuevoIndice =
                    indiceActual;

                // ------------------------------------------------
                // DESLIZAR HACIA LA IZQUIERDA
                // VA A LA SIGUIENTE PANTALLA
                // ------------------------------------------------

                if (
                    desplazamiento < -60 ||
                    velocidad < -0.5
                ) {

                    nuevoIndice =
                        Math.min(
                            indiceActual + 1,
                            TAB_NAMES.length - 1
                        );

                }

                // ------------------------------------------------
                // DESLIZAR HACIA LA DERECHA
                // VA A LA PANTALLA ANTERIOR
                // ------------------------------------------------

                else if (
                    desplazamiento > 60 ||
                    velocidad > 0.5
                ) {

                    nuevoIndice =
                        Math.max(
                            indiceActual - 1,
                            0
                        );
                }

                // ------------------------------------------------
                // SI NO CAMBIÓ, TERMINAMOS
                // ------------------------------------------------

                if (
                    nuevoIndice === indiceActual
                ) {
                    return;
                }

                const nuevaPantalla =
                    TAB_NAMES[nuevoIndice];

                navegando.current = true;

                navigation.navigate(
                    nuevaPantalla
                );

                // Evita múltiples cambios seguidos
                setTimeout(() => {
                    navegando.current = false;
                }, 350);
            },

        })

    ).current;

    return (

        <View
            style={{
                flex: 1,
            }}
            {...panResponder.panHandlers}
        >

            <ScreenComponent
                navigation={navigation}
                route={route}
            />

        </View>
    );
}

// ============================================================
// COMPONENTES DE LAS PANTALLAS CON SWIPE
// ============================================================

function InicioSwipe(props: any) {

    return (
        <SwipeScreen
            {...props}
            component={InicioScreen}
        />
    );
}

function RegistrosSwipe(props: any) {

    return (
        <SwipeScreen
            {...props}
            component={RegistroMovimientosScreen}
        />
    );
}

function ReportesSwipe(props: any) {

    return (
        <SwipeScreen
            {...props}
            component={ReporteDeudasRegistradas}
        />
    );
}

function CuentasSwipe(props: any) {

    return (
        <SwipeScreen
            {...props}
            component={CuentasYEfectivoScreen}
        />
    );
}

function PerfilSwipe(props: any) {

    return (
        <SwipeScreen
            {...props}
            component={PerfilScreen}
        />
    );
}

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

            screenOptions={({
                route,
            }) => ({

                headerShown: false,

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
                // COLORES
                // =================================================

                tabBarActiveTintColor:
                    '#059669',

                tabBarInactiveTintColor:
                    '#64748B',

                // =================================================
                // TEXTO
                // =================================================

                tabBarLabelStyle: {

                    fontSize: 11,

                    fontWeight: '600',

                    textTransform: 'none',

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

                    // ------------------------------------------------
                    // INICIO
                    // ------------------------------------------------

                    if (
                        route.name ===
                        'Inicio'
                    ) {

                        iconName =
                            focused
                                ? 'home'
                                : 'home-outline';

                    }

                    // ------------------------------------------------
                    // REGISTROS
                    // ------------------------------------------------

                    else if (
                        route.name ===
                        'Registros'
                    ) {

                        iconName =
                            focused
                                ? 'add-circle'
                                : 'add-circle-outline';

                    }

                    // ------------------------------------------------
                    // REPORTES
                    // ------------------------------------------------

                    else if (
                        route.name ===
                        'Reportes'
                    ) {

                        iconName =
                            focused
                                ? 'bar-chart'
                                : 'bar-chart-outline';

                    }

                    // ------------------------------------------------
                    // CUENTAS
                    // ------------------------------------------------

                    else if (
                        route.name ===
                        'Cuentas'
                    ) {

                        iconName =
                            focused
                                ? 'wallet'
                                : 'wallet-outline';

                    }

                    // ------------------------------------------------
                    // PERFIL
                    // ------------------------------------------------

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

            {/* ================================================= */}
            {/* INICIO */}
            {/* ================================================= */}

            <Tab.Screen
                name="Inicio"
                component={InicioSwipe}
            />

            {/* ================================================= */}
            {/* REGISTROS */}
            {/* ================================================= */}

            <Tab.Screen
                name="Registros"
                component={RegistrosSwipe}
            />

            {/* ================================================= */}
            {/* REPORTES */}
            {/* ================================================= */}

            <Tab.Screen
                name="Reportes"
                component={ReportesSwipe}
            />

            {/* ================================================= */}
            {/* CUENTAS */}
            {/* ================================================= */}

            <Tab.Screen
                name="Cuentas"
                component={CuentasSwipe}
            />

            {/* ================================================= */}
            {/* PERFIL */}
            {/* ================================================= */}

            <Tab.Screen
                name="Perfil"
                component={PerfilSwipe}
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

                // =================================================
                // IMPORTANTE:
                // NO usamos detachPreviousScreen
                // =================================================

                animation: 'slide_from_right',

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