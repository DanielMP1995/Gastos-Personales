import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    TextInput,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    push,
    set,
    get,
} from 'firebase/database';

export default function RegistroGastosRapidos({
    navigation,
}: any) {

    // ============================================================
    // ESTADOS
    // ============================================================

    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [categoria, setCategoria] = useState('Tienda');

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // ============================================================
    // CATEGORÍAS CON ICONOS
    // ============================================================

    const categorias = [
        { id: 'Tienda', label: 'Tienda', icon: 'storefront-outline' },
        { id: 'Farmacia', label: 'Farmacia', icon: 'medical-outline' },
        { id: 'Comida', label: 'Comida', icon: 'fast-food-outline' },
        { id: 'Transporte', label: 'Transporte', icon: 'car-outline' },
    ];

    // ============================================================
    // GUARDAR GASTO
    // ============================================================

    function guardarGasto() {

        const montoNum = parseFloat(monto);

        if (
            !monto ||
            isNaN(montoNum) ||
            montoNum <= 0
        ) {
            Alert.alert(
                'Error',
                'Por favor ingresa o selecciona un monto válido.'
            );
            return;
        }

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );
            return;
        }

        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        get(usuarioRef)
            .then((snapshot) => {

                if (!snapshot.exists()) {
                    Alert.alert(
                        'Error',
                        'No se encontró la información del usuario.'
                    );
                    return;
                }

                const userData = snapshot.val();
                const idPareja = userData.idPareja;

                if (!idPareja) {
                    Alert.alert(
                        'Error',
                        'No tienes una pareja vinculada.'
                    );
                    return;
                }

                const gastosRef = ref(
                    db,
                    `parejas/${idPareja}/movimientos`
                );

                const nuevoGastoRef = push(gastosRef);

                const motivoLimpio = motivo.trim();
                const descripcionFinal = motivoLimpio
                    ? `${categoria} - ${motivoLimpio}`
                    : `Gasto rápido: ${categoria}`;

                const datosGasto = {
                    tipo: 'gasto',
                    categoria: categoria,
                    monto: Number(montoNum.toFixed(2)),
                    descripcion: descripcionFinal,
                    fecha: new Date().toISOString(),
                    usuarioEmail: usuarioActual.email,
                    autor: userData.nombre || usuarioActual.email || 'Usuario',
                    origen: 'gastoRapido',
                };

                set(nuevoGastoRef, datosGasto)
                    .then(() => {
                        Alert.alert(
                            '¡Éxito!',
                            `Gasto de $${montoNum.toFixed(2)} registrado correctamente.`
                        );

                        setMonto('');
                        setMotivo('');
                        navigation.goBack();
                    })
                    .catch((error) => {
                        Alert.alert(
                            'Error',
                            error?.message || 'No se pudo registrar el gasto.'
                        );
                    });

            })
            .catch((error) => {
                Alert.alert(
                    'Error',
                    error?.message || 'No se pudo obtener la información del usuario.'
                );
            });
    }

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* HEADER */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.backButtonTop}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={20} color="#059669" />
                    </TouchableOpacity>
                    <Text style={styles.topHeaderTitle}>Gasto Rápido</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* HERO CARD */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIconContainer}>
                        <Ionicons name="flash" size={22} color="#059669" />
                    </View>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.smallTitle}>REGISTRO VELOZ</Text>
                        <Text style={styles.titulo}>Gastos al Instante</Text>
                        <Text style={styles.subtitulo}>
                            Anota compras menores en pocos segundos
                        </Text>
                    </View>
                </View>

                {/* PASO 1: CATEGORÍA */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>01</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Selecciona la Categoría</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                >
                    {categorias.map((cat) => {
                        const isSelected = categoria === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.catBtn,
                                    isSelected && styles.catActive,
                                ]}
                                onPress={() => setCategoria(cat.id)}
                                activeOpacity={0.8}
                            >
                                <Ionicons
                                    name={cat.icon as any}
                                    size={16}
                                    color={isSelected ? '#FFFFFF' : '#059669'}
                                    style={{ marginRight: 6 }}
                                />
                                <Text
                                    style={[
                                        styles.catText,
                                        isSelected && styles.catTextActive,
                                    ]}
                                >
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* PASO 2: MONTO (1 al 10) */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>02</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Selecciona o Escribe el Monto</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.row}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                        const isSelected = monto === val.toString();
                        return (
                            <TouchableOpacity
                                key={val}
                                style={[
                                    styles.montoBtn,
                                    isSelected && styles.montoActive,
                                ]}
                                onPress={() => setMonto(val.toString())}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.montoText,
                                        isSelected && styles.montoTextActive,
                                    ]}
                                >
                                    ${val}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.inputWrapper}>
                    <Text style={styles.currency}>$</Text>
                    <TextInput
                        style={styles.inputMontoCustom}
                        placeholder="Otro monto..."
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={monto}
                        onChangeText={setMonto}
                    />
                </View>

                {/* PASO 3: MOTIVO */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>03</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Detalle Opcional</Text>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Ej. Pan, pasaje, café..."
                    placeholderTextColor="#94A3B8"
                    value={motivo}
                    onChangeText={setMotivo}
                />

                {/* RESUMEN DINÁMICO */}
                {parseFloat(monto) > 0 && (
                    <View style={styles.resumenCard}>
                        <Text style={styles.resumenTitulo}>Resumen del Gasto</Text>
                        <View style={styles.resumenFila}>
                            <Text style={styles.resumenLabel}>Categoría</Text>
                            <Text style={styles.resumenValor}>{categoria}</Text>
                        </View>
                        <View style={styles.resumenFila}>
                            <Text style={styles.resumenLabel}>Monto</Text>
                            <Text style={styles.resumenMonto}>
                                ${parseFloat(monto).toFixed(2)}
                            </Text>
                        </View>
                        {motivo.trim() !== '' && (
                            <View style={styles.resumenFila}>
                                <Text style={styles.resumenLabel}>Motivo</Text>
                                <Text style={styles.resumenValor}>{motivo.trim()}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ACCIONES */}
                <TouchableOpacity
                    style={styles.btnGuardar}
                    onPress={guardarGasto}
                    activeOpacity={0.85}
                >
                    <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                    />
                    <Text style={styles.btnGuardarText}>
                        Registrar Gasto Rápido
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.btnVolver}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnVolverText}>
                        Cancelar / Volver
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    );
}

// ============================================================
// ESTILOS (Gama Verde Sobria, Limpia y Profesional)
// ============================================================

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backButtonTop: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
    },
    topHeaderTitle: {
        color: '#1E293B',
        fontSize: 15,
        fontWeight: '600',
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    heroIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    heroTextContainer: {
        flex: 1,
    },
    smallTitle: {
        color: '#059669',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    titulo: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    subtitulo: {
        color: '#64748B',
        fontSize: 11,
        lineHeight: 15,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 4,
    },
    stepBadge: {
        width: 22,
        height: 22,
        borderRadius: 6,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    stepBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#1E293B',
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        paddingVertical: 2,
        paddingRight: 10,
        marginBottom: 8,
    },
    catBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    catText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '500',
    },
    catTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
    },
    montoBtn: {
        paddingVertical: 10,
        paddingHorizontal: 13,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    montoActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    montoText: {
        color: '#059669',
        fontWeight: 'bold',
        fontSize: 13,
    },
    montoTextActive: {
        color: '#FFFFFF',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    currency: {
        color: '#059669',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 6,
    },
    inputMontoCustom: {
        flex: 1,
        color: '#1E293B',
        fontSize: 14,
        fontWeight: '600',
        paddingVertical: 10,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: '#1E293B',
        fontSize: 13,
        marginBottom: 8,
    },
    resumenCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginTop: 6,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    resumenTitulo: {
        color: '#1E293B',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    resumenLabel: {
        color: '#64748B',
        fontSize: 12,
    },
    resumenValor: {
        color: '#1E293B',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },
    resumenMonto: {
        color: '#059669',
        fontSize: 15,
        fontWeight: 'bold',
    },
    btnGuardar: {
        backgroundColor: '#059669',
        marginTop: 12,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    btnGuardarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnVolver: {
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginTop: 8,
        marginBottom: 20,
    },
    btnVolverText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13,
    },
});