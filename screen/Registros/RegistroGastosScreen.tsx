import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroGastosScreen({ navigation }: any) {
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Gestión de Gastos</Text>
            <Text style={styles.subtitulo}>¿Cómo deseas registrar tu gasto hoy?</Text>

            {/* Opción 1: Gastos Rápidos */}
            <TouchableOpacity 
                style={styles.cardRapido} 
                onPress={() => navigation.navigate('gastosRapidos')}
            >
                <Ionicons name="flash-outline" size={32} color="#FFFFFF" style={{ marginRight: 15 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Gastos Rápidos</Text>
                    <Text style={styles.cardSub}>Ideal para tienda, farmacia o compras al paso.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Opción 2: Gasto Detallado Normal */}
            <TouchableOpacity 
                style={styles.cardNormal} 
                onPress={() => navigation.navigate('gastosDetalle')} 
            >
                <Ionicons name="create-outline" size={32} color="#38BDF8" style={{ marginRight: 15 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitleNormal}>Gasto Detallado</Text>
                    <Text style={styles.cardSubNormal}>Para compras grandes con descripción personalizada.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#38BDF8" />
            </TouchableOpacity>

            {/* BOTÓN PARA REGRESAR */}
            <TouchableOpacity 
                style={styles.btnRegresar} 
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <Text style={styles.btnRegresarText}>Regresar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#0F172A', 
        padding: 25, 
        justifyContent: 'center' 
    },
    titulo: { 
        textAlign: 'center', 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#EF4444', 
        marginBottom: 6 
    },
    subtitulo: { 
        textAlign: 'center', 
        fontSize: 13, 
        color: '#94A3B8', 
        marginBottom: 30 
    },
    cardRapido: { 
        backgroundColor: '#EA580C', 
        borderRadius: 14, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 15,
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    cardNormal: { 
        backgroundColor: '#1E293B', 
        borderRadius: 14, 
        padding: 20, 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#334155',
        marginBottom: 25
    },
    cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
    cardSub: { color: '#FFEDD5', fontSize: 12, marginTop: 2 },
    cardTitleNormal: { color: '#38BDF8', fontSize: 16, fontWeight: 'bold' },
    cardSubNormal: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
    btnRegresar: {
        backgroundColor: '#1E293B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155'
    },
    btnRegresarText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '600'
    }
});