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
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* HEADER MINIMALISTA MODERNO */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.backButtonTop}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.backButtonTopText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.topHeaderTitle}>Panel de Registros</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* HERO CARD */}
                <View style={styles.heroCard}>
                    <View style={styles.logoBackground}>
                        <Image
                            source={require('../../assets/img/logov2.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.smallTitle}>FINANZAS EN PAREJA</Text>
                        <Text style={styles.titulo}>¿Qué deseas registrar?</Text>
                        <Text style={styles.subtitulo}>
                            Selecciona una categoría para continuar con el control
                        </Text>
                    </View>
                </View>

                {/* SECCIÓN OPCIONES */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>01</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Opciones Principales</Text>
                </View>

                {/* INGRESOS */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ingresos')}
                >
                    <View style={styles.iconContainerIngresos}>
                        <Ionicons
                            name="trending-up-outline"
                            size={24}
                            color="#047857"
                        />
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Ingresos</Text>
                        <Text style={styles.cardDesc}>
                            Registra entradas de dinero, salarios y otros ingresos.
                        </Text>
                    </View>

                    <View style={styles.arrowContainer}>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#059669"
                        />
                    </View>
                </TouchableOpacity>

                {/* DEUDAS */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('deudas')}
                >
                    <View style={styles.iconContainerDeudas}>
                        <Ionicons
                            name="card-outline"
                            size={24}
                            color="#B91C1C"
                        />
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Deudas</Text>
                        <Text style={styles.cardDesc}>
                            Controla préstamos, cuotas, tarjetas y obligaciones pendientes.
                        </Text>
                    </View>

                    <View style={styles.arrowContainer}>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#DC2626"
                        />
                    </View>
                </TouchableOpacity>

                {/* GASTOS FIJOS */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('gastosfijos')}
                >
                    <View style={styles.iconContainerFijos}>
                        <Ionicons
                            name="repeat-outline"
                            size={24}
                            color="#B45309"
                        />
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Gastos Fijos</Text>
                        <Text style={styles.cardDesc}>
                            Gestiona servicios, arriendo, suscripciones y pagos recurrentes.
                        </Text>
                    </View>

                    <View style={styles.arrowContainer}>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#D97706"
                        />
                    </View>
                </TouchableOpacity>

                {/* GASTOS */}
                <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('gastos')}
                >
                    <View style={styles.iconContainerGastos}>
                        <Ionicons
                            name="cart-outline"
                            size={24}
                            color="#047857"
                        />
                    </View>

                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Gastos</Text>
                        <Text style={styles.cardDesc}>
                            Anota tus gastos diarios u ocasionales de forma rápida.
                        </Text>
                    </View>

                    <View style={styles.arrowContainer}>
                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#059669"
                        />
                    </View>
                </TouchableOpacity>

                {/* BOTÓN REGRESAR */}
                <TouchableOpacity
                    style={styles.backButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back-outline"
                        size={18}
                        color="#64748B"
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
        </View>
    );
}

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
        paddingTop: 45,
        paddingBottom: 40,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButtonTop: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    backButtonTopText: {
        color: '#1E293B',
        fontSize: 18,
        fontWeight: 'bold',
    },
    topHeaderTitle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: '600',
    },
    heroCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    logoBackground: {
        width: 70,
        height: 70,
        borderRadius: 18,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    logo: {
        width: 45,
        height: 45,
    },
    heroTextContainer: {
        alignItems: 'center',
    },
    smallTitle: {
        color: '#059669',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 4,
    },
    subtitulo: {
        textAlign: 'center',
        fontSize: 12,
        color: '#64748B',
        lineHeight: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    stepBadge: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    stepBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#1E293B',
        fontSize: 15,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    cardContent: {
        flex: 1,
        marginLeft: 14,
        paddingRight: 6,
    },
    cardTitle: {
        color: '#1E293B',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    cardDesc: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 16,
    },
    iconContainerIngresos: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerDeudas: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerFijos: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerGastos: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    backButton: {
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    backButtonText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    footer: {
        color: '#94A3B8',
        textAlign: 'center',
        fontSize: 11,
        marginTop: 20,
    },
});   //panel de registros, donde estan ingresos deudas gastos fijos gastos  