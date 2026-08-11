import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons'; // <--- Importante para los iconos

import LoginScreen from '../screen/Login/LoginScreen';
import InicioScreen from '../screen/Inicio/InicioScreen';
import PerfilScreen from '../screen/Perfiles/PerfilScreen';
import RegistroScreen from '../screen/Registro/RegistroScreen';
import RegistroMovimientosScreen from '../screen/Registros/RegistroMovimientosScreen';
import RegistroIngresosScreen from '../screen/Registros/RegistroIngresosScreen';
import RegistroDeudasScreen from '../screen/Registros/RegistroDeudasScreen';
import RegistroGastosFijosScreen from '../screen/Registros/RegistroGastosFijosScreen';
import RegistroGastosScreen from '../screen/Registros/RegistroGastosScreen';
import ReporteDeudasRegistradas from '../screen/Reportes/ReporteDeudasRegistradas';
import ConfigurarParejaScreen from '../config/ConfigurarParejaScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MyTabs() {
    return (
        <Tab.Navigator 
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0F172A',
                    borderTopColor: '#1E293B',
                    elevation: 0,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: '#38BDF8',
                tabBarInactiveTintColor: '#f5f6f8',
                // Configuración de los iconos dinámicos para cada pestaña
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
        <Stack.Navigator initialRouteName="login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" component={LoginScreen} />
            <Stack.Screen name="registro" component={RegistroScreen} />
            
            {/* NUEVA PANTALLA DE CONFIGURACIÓN DE PAREJA */}
            <Stack.Screen name="configurarPareja" component={ConfigurarParejaScreen} />
            
            <Stack.Screen name="tabs" component={MyTabs} />

            <Stack.Screen name="ingresos" component={RegistroIngresosScreen} />
            <Stack.Screen name="deudas" component={RegistroDeudasScreen} />
            <Stack.Screen name="gastosfijos" component={RegistroGastosFijosScreen} />
            <Stack.Screen name="gastos" component={RegistroGastosScreen} />
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