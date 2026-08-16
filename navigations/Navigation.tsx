import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'; // <-- Cambiado para soportar swipe en tabs
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

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

const Tab = createMaterialTopTabNavigator(); // <-- Usamos Top Tabs para permitir el gesto de swipe horizontal
const Stack = createNativeStackNavigator();

function MyTabs() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            tabBarPosition="bottom" // <-- Mantiene la barra de navegación en la parte inferior de la pantalla
            screenOptions={({ route }) => ({
                swipeEnabled: true, // <-- Permite deslizar de lado a lado para cambiar de pestaña
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E2E8F0',
                    elevation: 0,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 8,
                },
                tabBarIndicatorStyle: {
                    backgroundColor: '#059669', // Línea o indicador activo arriba de los iconos
                    height: 3,
                },
                tabBarActiveTintColor: '#059669',
                tabBarInactiveTintColor: '#64748B',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'none',
                },
                tabBarIcon: ({ focused, color }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Registros') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Reportes') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
                    } else if (route.name === 'Cuentas') {
                        iconName = focused ? 'wallet' : 'wallet-outline';
                    } else if (route.name === 'Perfil') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Inicio" component={InicioScreen} />
            <Tab.Screen name="Registros" component={RegistroMovimientosScreen} />
            <Tab.Screen name="Reportes" component={ReporteDeudasRegistradas} />   
            <Tab.Screen name="Cuentas" component={CuentasYEfectivoScreen} />
            <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
    );
}

function MyStack() {
    return (
        <Stack.Navigator 
            initialRouteName="login" 
            screenOptions={{ 
                headerShown: false,
                gestureEnabled: true,          // Habilita el gesto de deslizar para volver atrás
                fullScreenGestureEnabled: true, // Permite el gesto en toda la pantalla (muy útil en iOS/Android)
                animation: 'slide_from_right',  // Transición fluida al cambiar de pantalla
            }}
        >
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="registro" component={RegistroScreen} />
            <Stack.Screen name="configurarPareja" component={ConfigurarParejaScreen} />
            <Stack.Screen name="tabs" component={MyTabs} />
            <Stack.Screen name="ingresos" component={RegistroIngresosScreen} />
            <Stack.Screen name="deudas" component={RegistroDeudasScreen} />
            <Stack.Screen name="gastosfijos" component={RegistroGastosFijosScreen} />
            <Stack.Screen name="gastos" component={RegistroGastosScreen} />
            <Stack.Screen name="gastosRapidos" component={RegistroGastosRapidos} />
            <Stack.Screen name="gastosDetalle" component={RegistroGastosDetallados} />
        </Stack.Navigator>
    );
}

export const Navegador = () => {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <MyStack />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};