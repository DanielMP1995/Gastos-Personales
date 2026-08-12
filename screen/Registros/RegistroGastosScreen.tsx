import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroGastosScreen({ navigation }: any) {

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    return (
        <View style={styles.container}>

            <StatusBar
                barStyle="light-content"
                backgroundColor="#08111F"
            />

            {/* DECORACIÓN SUPERIOR */}
            <View style={styles.decorCircleOne} />
            <View style={styles.decorCircleTwo} />

            {/* HEADER */}
            <View style={styles.header}>

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={22}
                        color="#E2E8F0"
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
                        color="#38BDF8"
                    />
                </View>

            </View>

            {/* INTRODUCCIÓN */}
            <View style={styles.introContainer}>

                <Text style={styles.subtitulo}>
                    Registra tus gastos de la manera que
                    mejor se adapte a ti.
                </Text>

                <View style={styles.line} />

            </View>

            {/* OPCIONES */}
            <View style={styles.optionsContainer}>

                {/* GASTOS RÁPIDOS */}
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
                            size={30}
                            color="#FFFFFF"
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
                                size={24}
                                color="#FFFFFF"
                            />

                        </View>

                    </View>

                </TouchableOpacity>


                {/* GASTO DETALLADO */}
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
                            size={30}
                            color="#38BDF8"
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
                                size={24}
                                color="#38BDF8"
                            />

                        </View>

                    </View>

                </TouchableOpacity>

            </View>


            {/* CONSEJO */}
            <View style={styles.tipContainer}>

                <View style={styles.tipIcon}>
                    <Ionicons
                        name="bulb-outline"
                        size={19}
                        color="#FBBF24"
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


            {/* BOTÓN REGRESAR */}
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.btnRegresar}
                onPress={() => navigation.goBack()}
            >

                <Ionicons
                    name="chevron-back"
                    size={19}
                    color="#94A3B8"
                />

                <Text style={styles.btnRegresarText}>
                    Regresar
                </Text>

            </TouchableOpacity>

        </View>
    );
}


const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#08111F',
        paddingHorizontal: 22,
        paddingTop: 45,
        paddingBottom: 25,
        overflow: 'hidden',
    },

    /* =========================================
       DECORACIÓN
    ========================================= */

    decorCircleOne: {
        position: 'absolute',
        width: 230,
        height: 230,
        borderRadius: 115,
        backgroundColor: '#0C2438',
        top: -120,
        right: -90,
        opacity: 0.7,
    },

    decorCircleTwo: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#172554',
        bottom: -90,
        left: -100,
        opacity: 0.45,
    },

    /* =========================================
       HEADER
    ========================================= */

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        zIndex: 2,
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#111D2E',
        borderWidth: 1,
        borderColor: '#24344A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    headerTextContainer: {
        flex: 1,
    },

    headerSmall: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 2,
        marginBottom: 2,
    },

    titulo: {
        color: '#F8FAFC',
        fontSize: 23,
        fontWeight: '800',
    },

    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#0E2A40',
        borderWidth: 1,
        borderColor: '#164E63',
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* =========================================
       INTRO
    ========================================= */

    introContainer: {
        marginBottom: 22,
    },

    subtitulo: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 21,
        maxWidth: 340,
    },

    line: {
        width: 45,
        height: 3,
        borderRadius: 10,
        backgroundColor: '#38BDF8',
        marginTop: 15,
    },

    /* =========================================
       OPCIONES
    ========================================= */

    optionsContainer: {
        gap: 15,
    },

    /* =========================================
       GASTOS RÁPIDOS
    ========================================= */

    cardRapido: {
        backgroundColor: '#EA580C',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',

        shadowColor: '#EA580C',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 7,
    },

    iconContainerRapido: {
        width: 58,
        height: 58,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },

    /* =========================================
       GASTO DETALLADO
    ========================================= */

    cardNormal: {
        backgroundColor: '#111D2E',
        borderRadius: 20,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',

        borderWidth: 1,
        borderColor: '#24344A',

        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },

    iconContainerNormal: {
        width: 58,
        height: 58,
        borderRadius: 17,
        backgroundColor: '#0E2A40',
        borderWidth: 1,
        borderColor: '#164E63',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },

    /* =========================================
       CONTENIDO CARDS
    ========================================= */

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
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },

    cardTitleNormal: {
        color: '#F8FAFC',
        fontSize: 17,
        fontWeight: '800',
    },

    recommendedBadge: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 6,
    },

    recommendedText: {
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 0.7,
    },

    cardSub: {
        color: '#FFEDD5',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 5,
    },

    cardSubNormal: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 18,
        marginTop: 5,
    },

    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },

    cardFooterText: {
        color: '#FED7AA',
        fontSize: 9,
        flex: 1,
    },

    cardFooterTextNormal: {
        color: '#64748B',
        fontSize: 9,
        flex: 1,
    },

    /* =========================================
       CONSEJO
    ========================================= */

    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#101C2D',
        borderRadius: 16,
        padding: 14,
        marginTop: 22,
        borderWidth: 1,
        borderColor: '#25364B',
    },

    tipIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#29200D',
        borderWidth: 1,
        borderColor: '#5A4210',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    tipTextContainer: {
        flex: 1,
    },

    tipTitle: {
        color: '#FBBF24',
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },

    tipText: {
        color: '#94A3B8',
        fontSize: 10,
        lineHeight: 15,
    },

    /* =========================================
       REGRESAR
    ========================================= */

    btnRegresar: {
        marginTop: 'auto',
        height: 50,
        backgroundColor: '#111D2E',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#24344A',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    btnRegresarText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
        marginLeft: 5,
    },

});