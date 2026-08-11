import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Image } from 'react-native'
import React, { useEffect } from 'react'

export default function RegistroMovimientosScreen({ navigation }: any) {

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            {/* Logotipo corporativo */}
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../../assets/img/logov2.png')} 
                    style={styles.logo} 
                    resizeMode="contain" 
                />
            </View>

            <Text style={styles.titulo}>Panel de Registros</Text>
            <Text style={styles.subtitulo}>Selecciona la categoría a gestionar</Text>

            <TouchableOpacity 
                style={[styles.card, styles.cardIngresos]} 
                onPress={() => navigation.navigate('ingresos')}
            >
                <Text style={styles.cardText}>Ingresos</Text>
                <Text style={styles.cardDesc}>Registra entradas de dinero</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.card, styles.cardDeudas]} 
                onPress={() => navigation.navigate('deudas')}
            >
                <Text style={styles.cardText}>Deudas</Text>
                <Text style={styles.cardDesc}>Controla tus obligaciones pendientes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.card, styles.cardGastosFijos]} 
                onPress={() => navigation.navigate('gastosfijos')}
            >
                <Text style={styles.cardText}>Gastos Fijos</Text>
                <Text style={styles.cardDesc}>Gestiona servicios y pagos recurrentes</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.card, styles.cardGastos]} 
                onPress={() => navigation.navigate('gastos')}
            >
                <Text style={styles.cardText}>Gastos</Text>
                <Text style={styles.cardDesc}>Anota tus gastos diarios u ocasionales</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    container: {
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 10,
    },
    logo: {
        width: 200,
        height: 200,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
    },
    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 25,
    },
    card: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 14,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    cardIngresos: {
        borderLeftWidth: 5,
        borderLeftColor: '#10B981', // Verde corporativo para ingresos
    },
    cardDeudas: {
        borderLeftWidth: 5,
        borderLeftColor: '#EF4444', // Rojo sutil para deudas
    },
    cardGastosFijos: {
        borderLeftWidth: 5,
        borderLeftColor: '#EA580C', // Naranja corporativo del logo
    },
    cardGastos: {
        borderLeftWidth: 5,
        borderLeftColor: '#1D4ED8', // Azul elegante del logo
    },
    cardText: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDesc: {
        color: '#94A3B8',
        fontSize: 13,
    }
})