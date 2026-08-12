import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Image,
} from 'react-native';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroMovimientosScreen({ navigation }: any) {

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >

            {/* DECORACIÓN */}

            <View style={styles.glowTop} />

            {/* HEADER */}

            <View style={styles.header}>

                <View style={styles.logoBackground}>
                    <Image
                        source={require('../../assets/img/logov2.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>

                <View style={styles.headerText}>
                    <Text style={styles.smallTitle}>
                        FINANZAS EN PAREJA
                    </Text>

                    <Text style={styles.titulo}>
                        Panel de Registros
                    </Text>

                    <Text style={styles.subtitulo}>
                        Gestiona y organiza tus movimientos
                    </Text>
                </View>

            </View>

            {/* SECCIÓN */}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    ¿Qué deseas registrar?
                </Text>

                <Text style={styles.sectionSubtitle}>
                    Selecciona una categoría para continuar
                </Text>
            </View>

            {/* INGRESOS */}

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ingresos')}
            >

                <View style={styles.iconContainerIngresos}>
                    <Ionicons
                        name="trending-up-outline"
                        size={27}
                        color="#10B981"
                    />
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>
                        Ingresos
                    </Text>

                    <Text style={styles.cardDesc}>
                        Registra entradas de dinero,
                        salarios y otros ingresos.
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#10B981"
                    />
                </View>

            </TouchableOpacity>

            {/* DEUDAS */}

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('deudas')}
            >

                <View style={styles.iconContainerDeudas}>
                    <Ionicons
                        name="card-outline"
                        size={27}
                        color="#EF4444"
                    />
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>
                        Deudas
                    </Text>

                    <Text style={styles.cardDesc}>
                        Controla préstamos, cuotas,
                        tarjetas y obligaciones pendientes.
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#EF4444"
                    />
                </View>

            </TouchableOpacity>

            {/* GASTOS FIJOS */}

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('gastosfijos')}
            >

                <View style={styles.iconContainerFijos}>
                    <Ionicons
                        name="repeat-outline"
                        size={27}
                        color="#F97316"
                    />
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>
                        Gastos Fijos
                    </Text>

                    <Text style={styles.cardDesc}>
                        Gestiona servicios, arriendo,
                        suscripciones y pagos recurrentes.
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#F97316"
                    />
                </View>

            </TouchableOpacity>

            {/* GASTOS */}

            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('gastos')}
            >

                <View style={styles.iconContainerGastos}>
                    <Ionicons
                        name="cart-outline"
                        size={27}
                        color="#38BDF8"
                    />
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>
                        Gastos
                    </Text>

                    <Text style={styles.cardDesc}>
                        Anota tus gastos diarios
                        u ocasionales.
                    </Text>
                </View>

                <View style={styles.arrowContainer}>
                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#38BDF8"
                    />
                </View>

            </TouchableOpacity>

            {/* REGRESAR */}

            <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
            >

                <Ionicons
                    name="arrow-back-outline"
                    size={19}
                    color="#94A3B8"
                />

                <Text style={styles.backButtonText}>
                    Regresar
                </Text>

            </TouchableOpacity>

            {/* FOOTER */}

            <Text style={styles.footer}>
                Mantén tus finanzas organizadas y bajo control.
            </Text>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    // ============================================================
    // CONTENEDOR
    // ============================================================

    scrollView: {
        flex: 1,
        backgroundColor: '#0B1120',
    },

    container: {
        paddingHorizontal: 22,
        paddingTop: 35,
        paddingBottom: 40,
        position: 'relative',
    },

    // ============================================================
    // DECORACIÓN
    // ============================================================

    glowTop: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#075985',
        opacity: 0.12,
        top: -130,
        right: -100,
    },

    // ============================================================
    // HEADER
    // ============================================================

    header: {
        alignItems: 'center',
        marginBottom: 25,
    },

    logoBackground: {
        width: 115,
        height: 115,
        borderRadius: 30,
        backgroundColor: '#111C31',
        borderWidth: 1,
        borderColor: '#1E3A5F',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,

        shadowColor: '#38BDF8',
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.16,
        shadowRadius: 12,
        elevation: 7,
    },

    logo: {
        width: 100,
        height: 100,
    },

    headerText: {
        alignItems: 'center',
    },

    smallTitle: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 5,
    },

    titulo: {
        textAlign: 'center',
        fontSize: 27,
        fontWeight: '800',
        color: '#F8FAFC',
    },

    subtitulo: {
        textAlign: 'center',
        fontSize: 13,
        color: '#64748B',
        marginTop: 5,
    },

    // ============================================================
    // SECCIÓN
    // ============================================================

    sectionHeader: {
        marginBottom: 15,
        marginLeft: 3,
    },

    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 17,
        fontWeight: '700',
    },

    sectionSubtitle: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 3,
    },

    // ============================================================
    // CARDS
    // ============================================================

    card: {
        backgroundColor: '#111C31',
        borderRadius: 17,
        padding: 16,
        marginBottom: 13,

        flexDirection: 'row',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#1E293B',

        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    cardContent: {
        flex: 1,
        marginLeft: 14,
        paddingRight: 5,
    },

    cardTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },

    cardDesc: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 18,
    },

    // ============================================================
    // ICONOS
    // ============================================================

    iconContainerIngresos: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#052E24',
        borderWidth: 1,
        borderColor: '#065F46',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconContainerDeudas: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#3F1016',
        borderWidth: 1,
        borderColor: '#7F1D1D',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconContainerFijos: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#431407',
        borderWidth: 1,
        borderColor: '#9A3412',
        alignItems: 'center',
        justifyContent: 'center',
    },

    iconContainerGastos: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#082F49',
        borderWidth: 1,
        borderColor: '#075985',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ============================================================
    // FLECHA
    // ============================================================

    arrowContainer: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: '#0F172A',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ============================================================
    // BOTÓN REGRESAR
    // ============================================================

    backButton: {
        height: 50,
        borderRadius: 14,
        backgroundColor: '#111C31',
        borderWidth: 1,
        borderColor: '#1E293B',

        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',

        marginTop: 8,
    },

    backButtonText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },

    // ============================================================
    // FOOTER
    // ============================================================

    footer: {
        color: '#334155',
        textAlign: 'center',
        fontSize: 10,
        marginTop: 20,
    },
});