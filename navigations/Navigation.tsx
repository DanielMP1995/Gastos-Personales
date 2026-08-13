import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screen/Login/LoginScreen';
import InicioScreen from '../screen/Inicio/InicioScreen';
import PerfilScreen from '../screen/Perfiles/PerfilScreen';
import RegistroScreen from '../screen/Registro/RegistroScreen';
import RegistroMovimientosScreen from '../screen/Registros/RegistroMovimientosScreen';
import RegistroIngresosScreen from '../screen/Registros/RegistroIngresosScreen';
import RegistroDeudasScreen from '../screen/Registros/RegistroDeudasScreen';
import RegistroGastosFijosScreen from '../screen/Registros/RegistroGastosFijosScreen';
import RegistroGastosScreen from '../screen/Registros/RegistroGastosScreen';
import RegistroGastosRapidos from '../screen/Registros/RegistroGastosRapidos'; // <--- 1. IMPORTAMOS LA PANTALLA DE GASTOS RÁPIDOS
import ReporteDeudasRegistradas from '../screen/Reportes/ReporteDeudasRegistradas';
import ConfigurarParejaScreen from '../config/ConfigurarParejaScreen';
import RegistroGastosDetallados from '../screen/Registros/RegistroGastosDetallados';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MyTabs() {
    return (
<Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopColor: '#E2E8F0',
                    elevation: 0,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#059669',
                tabBarInactiveTintColor: '#64748B',
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

                    if (route.name === 'Inicio') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Registros') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Reportes') {
                        iconName = focused ? 'bar-chart' : 'bar-chart-outline';
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
            <Tab.Screen name="Perfil" component={PerfilScreen} />
        </Tab.Navigator>
    );
}

function MyStack() {
    return (
        <Stack.Navigator initialRouteName="tabs" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="registro" component={RegistroScreen} />

            <Stack.Screen name="configurarPareja" component={ConfigurarParejaScreen} />

            <Stack.Screen name="tabs" component={MyTabs} />

            <Stack.Screen name="ingresos" component={RegistroIngresosScreen} />
            <Stack.Screen name="deudas" component={RegistroDeudasScreen} />
            <Stack.Screen name="gastosfijos" component={RegistroGastosFijosScreen} />
            <Stack.Screen name="gastos" component={RegistroGastosScreen} />

            {/* 2. REGISTRAMOS LA RUTA AQUí */}
            <Stack.Screen name="gastosRapidos" component={RegistroGastosRapidos} />
            <Stack.Screen name="gastosDetalle" component={RegistroGastosDetallados} />
        </Stack.Navigator>
    );
}

export const Navegador = () => {
    return (
        <NavigationContainer>
            <MyStack />
        </NavigationContainer>
    );
}