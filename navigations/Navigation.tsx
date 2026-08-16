import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
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

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

function MyTabs() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            tabBarPosition="bottom"
            screenOptions={({ route }) => ({
                swipeEnabled: true,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E2E8F0',
                    elevation: 0,
                    // Aumentamos ligeramente la altura y el espacio superior para separar las letras de la línea
                    height: 65 + (insets.bottom > 0 ? insets.bottom : 10),
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 12, // <-- Mayor separación para que la línea no tape el texto
                },
                tabBarIndicatorStyle: {
                    backgroundColor: '#059669',
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
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animation: 'slide_from_right',
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