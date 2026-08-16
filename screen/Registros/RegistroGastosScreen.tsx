import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
} from 'react-native';

import React, { useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegistroGastosScreen({ navigation }: any) {

    const insets = useSafeAreaInsets();

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    return (
        <View style={styles.container}>

            <StatusBar
                barStyle="dark-content"
                backgroundColor="#F8FAFC"
                translucent={false}
            />

            {/* DECORACIÓN SUPERIOR CLARA */}

            <View style={styles.decorCircleOne} />

            <View style={styles.decorCircleTwo} />

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(insets.top, 12),
                    },
                ]}
            >

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >

                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color="#1E293B"
                    />

                </TouchableOpacity>

                <View style={styles.headerTextContainer}>

                    <Text style={styles.headerSmall}>
                        REGISTROS
                    </Text>

                    <Text style={styles.titulo}>
                        Gestión de Gastos
                    </Text>

                </View>

                <View style={styles.headerIcon}>

                    <Ionicons
                        name="wallet-outline"
                        size={24}
                        color="#059669"
                    />

                </View>

            </View>

            {/* ================================================= */}
            {/* INTRODUCCIÓN */}
            {/* ================================================= */}

            <View style={styles.introContainer}>

                <Text style={styles.subtitulo}>
                    Registra tus gastos de la manera que
                    mejor se adapte a ti.
                </Text>

                <View style={styles.line} />

            </View>

            {/* ================================================= */}
            {/* OPCIONES */}
            {/* ================================================= */}

            <View style={styles.optionsContainer}>

                {/* ================================================= */}
                {/* GASTOS RÁPIDOS */}
                {/* ================================================= */}

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.cardRapido}
                    onPress={() =>
                        navigation.navigate('gastosRapidos')
                    }
                >

                    <View style={styles.iconContainerRapido}>

                        <Ionicons
                            name="flash"
                            size={26}
                            color="#059669"
                        />

                    </View>

                    <View style={styles.cardContent}>

                        <View style={styles.cardTitleRow}>

                            <Text style={styles.cardTitle}>
                                Gastos Rápidos
                            </Text>

                            <View style={styles.recommendedBadge}>

                                <Text style={styles.recommendedText}>
                                    RÁPIDO
                                </Text>

                            </View>

                        </View>

                        <Text style={styles.cardSub}>
                            Registra compras pequeñas en
                            pocos segundos.
                        </Text>

                        <View style={styles.cardFooter}>

                            <Text style={styles.cardFooterText}>
                                Tienda · Farmacia · Comida
                            </Text>

                            <Ionicons
                                name="arrow-forward-circle"
                                size={22}
                                color="#059669"
                            />

                        </View>

                    </View>

                </TouchableOpacity>

                {/* ================================================= */}
                {/* GASTO DETALLADO */}
                {/* ================================================= */}

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.cardNormal}
                    onPress={() =>
                        navigation.navigate('gastosDetalle')
                    }
                >

                    <View style={styles.iconContainerNormal}>

                        <Ionicons
                            name="create-outline"
                            size={26}
                            color="#0284C7"
                        />

                    </View>

                    <View style={styles.cardContent}>

                        <Text style={styles.cardTitleNormal}>
                            Gasto Detallado
                        </Text>

                        <Text style={styles.cardSubNormal}>
                            Registra compras grandes con
                            información personalizada.
                        </Text>

                        <View style={styles.cardFooter}>

                            <Text style={styles.cardFooterTextNormal}>
                                Descripción · Categoría · Detalles
                            </Text>

                            <Ionicons
                                name="arrow-forward-circle"
                                size={22}
                                color="#0284C7"
                            />

                        </View>

                    </View>

                </TouchableOpacity>

            </View>

            {/* ================================================= */}
            {/* CONSEJO */}
            {/* ================================================= */}

            <View style={styles.tipContainer}>

                <View style={styles.tipIcon}>

                    <Ionicons
                        name="bulb-outline"
                        size={19}
                        color="#D97706"
                    />

                </View>

                <View style={styles.tipTextContainer}>

                    <Text style={styles.tipTitle}>
                        Consejo
                    </Text>

                    <Text style={styles.tipText}>
                        Registra tus gastos diariamente para
                        mantener tus finanzas en orden.
                    </Text>

                </View>

            </View>

            {/* ================================================= */}
            {/* BOTÓN REGRESAR */}
            {/* ================================================= */}

            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.btnRegresar}
                onPress={() => navigation.goBack()}
            >

                <Ionicons
                    name="chevron-back"
                    size={19}
                    color="#64748B"
                />

                <Text style={styles.btnRegresarText}>
                    Regresar
                </Text>

            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({

    // ============================================================
    // CONTENEDOR
    // ============================================================

    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 20,
        paddingBottom: 25,
        overflow: 'hidden',
    },

    // ============================================================
    // DECORACIÓN
    // ============================================================

    decorCircleOne: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#ECFDF5',
        top: -100,
        right: -80,
        opacity: 0.8,
    },

    decorCircleTwo: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#F1F5F9',
        bottom: -70,
        left: -90,
        opacity: 0.6,
    },

    // ============================================================
    // HEADER
    // ============================================================

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 2,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    headerTextContainer: {
        flex: 1,
    },

    headerSmall: {
        color: '#059669',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 2,
    },

    titulo: {
        color: '#1E293B',
        fontSize: 20,
        fontWeight: 'bold',
    },

    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ============================================================
    // INTRO
    // ============================================================

    introContainer: {
        marginBottom: 20,
    },

    subtitulo: {
        color: '#64748B',
        fontSize: 13,
        lineHeight: 18,
        maxWidth: 340,
    },

    line: {
        width: 40,
        height: 3,
        borderRadius: 10,
        backgroundColor: '#059669',
        marginTop: 12,
    },

    // ============================================================
    // OPCIONES
    // ============================================================

    optionsContainer: {
        gap: 14,
    },

    // ============================================================
    // GASTOS RÁPIDOS
    // ============================================================

    cardRapido: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A7F3D0',

        shadowColor: '#059669',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    iconContainerRapido: {
        width: 52,
        height: 52,
        borderRadius: 15,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    // ============================================================
    // GASTO DETALLADO
    // ============================================================

    cardNormal: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },

    iconContainerNormal: {
        width: 52,
        height: 52,
        borderRadius: 15,
        backgroundColor: '#F0F9FF',
        borderWidth: 1,
        borderColor: '#BAE6FD',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },

    // ============================================================
    // CONTENIDO CARDS
    // ============================================================

    cardContent: {
        flex: 1,
    },

    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },

    cardTitle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold',
    },

    cardTitleNormal: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold',
    },

    recommendedBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },

    recommendedText: {
        color: '#059669',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },

    cardSub: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 16,
        marginTop: 4,
    },

    cardSubNormal: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 16,
        marginTop: 4,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },

    cardFooterText: {
        color: '#059669',
        fontSize: 10,
        fontWeight: '500',
        flex: 1,
    },

    cardFooterTextNormal: {
        color: '#0284C7',
        fontSize: 10,
        fontWeight: '500',
        flex: 1,
    },

    // ============================================================
    // CONSEJO
    // ============================================================

    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 14,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },

    tipIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FEF9C3',
        borderWidth: 1,
        borderColor: '#FDE68A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    tipTextContainer: {
        flex: 1,
    },

    tipTitle: {
        color: '#B45309',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },

    tipText: {
        color: '#78350F',
        fontSize: 11,
        lineHeight: 15,
    },

    // ============================================================
    // REGRESAR
    // ============================================================

    btnRegresar: {
        marginTop: 'auto',
        height: 48,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    btnRegresarText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },

});    // aqui gastos rapiudo y detallados estan