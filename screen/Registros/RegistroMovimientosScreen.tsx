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

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';


export default function RegistroMovimientosScreen({
    navigation,
}: any) {

    const insets = useSafeAreaInsets();

    const {
        colors,
    } = useTheme();


    useEffect(() => {

        navigation.setOptions({
            headerShown: false,
        });

    }, [navigation]);


    return (

        <View
            style={[
                styles.rootContainer,
                {
                    backgroundColor:
                        colors.veryLight,
                },
            ]}
        >

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.container,
                    {
                        paddingTop:
                            insets.top + 12,
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <View style={styles.topHeader}>

                    <TouchableOpacity
                        style={[
                            styles.backButtonTop,
                            {
                                backgroundColor:
                                    '#FFFFFF',

                                borderColor:
                                    colors.light,
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={colors.dark}
                        />

                    </TouchableOpacity>


                    <Text
                        style={[
                            styles.topHeaderTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Panel de Registros
                    </Text>


                    <View
                        style={{
                            width: 40,
                        }}
                    />

                </View>


                {/* ================================================= */}
                {/* HERO CARD */}
                {/* ================================================= */}

                <View
                    style={[
                        styles.heroCard,
                        {
                            backgroundColor:
                                '#FFFFFF',

                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.logoBackground,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Image
                            source={require('../../assets/img/logov3.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                    </View>


                    <View
                        style={styles.heroTextContainer}
                    >

                        <Text
                            style={[
                                styles.smallTitle,
                                {
                                    color:
                                        colors.primary,
                                },
                            ]}
                        >
                            FINANZAS EN PAREJA
                        </Text>


                        <Text
                            style={[
                                styles.titulo,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            ¿Qué deseas registrar?
                        </Text>


                        <Text
                            style={[
                                styles.subtitulo,
                                {
                                    color:
                                        colors.dark,
                                    opacity: 0.65,
                                },
                            ]}
                        >
                            Selecciona una categoría para continuar
                            con el control de tus finanzas.
                        </Text>

                    </View>

                </View>


                {/* ================================================= */}
                {/* SECCIÓN OPCIONES */}
                {/* ================================================= */}

                <View
                    style={styles.sectionHeader}
                >

                    <View
                        style={[
                            styles.stepBadge,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                    >

                        <Text
                            style={
                                styles.stepBadgeText
                            }
                        >
                            01
                        </Text>

                    </View>


                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Opciones Principales
                    </Text>

                </View>


                {/* ================================================= */}
                {/* INGRESOS */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.card,
                        {
                            backgroundColor:
                                '#FFFFFF',

                            borderColor:
                                colors.light,
                        },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                        navigation.navigate(
                            'ingresos'
                        )
                    }
                >

                    <View
                        style={[
                            styles.iconContainerIngresos,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="trending-up-outline"
                            size={24}
                            color={colors.primary}
                        />

                    </View>


                    <View
                        style={styles.cardContent}
                    >

                        <Text
                            style={[
                                styles.cardTitle,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Ingresos
                        </Text>


                        <Text
                            style={[
                                styles.cardDesc,
                                {
                                    color:
                                        colors.dark,
                                    opacity: 0.65,
                                },
                            ]}
                        >
                            Registra entradas de dinero, salarios
                            y otros ingresos.
                        </Text>

                    </View>


                    <View
                        style={[
                            styles.arrowContainer,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.primary}
                        />

                    </View>

                </TouchableOpacity>


                {/* ================================================= */}
                {/* DEUDAS */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.card,
                        {
                            backgroundColor:
                                '#FFFFFF',

                            borderColor:
                                colors.light,
                        },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                        navigation.navigate(
                            'deudas'
                        )
                    }
                >

                    <View
                        style={[
                            styles.iconContainerDeudas,
                            {
                                backgroundColor:
                                    '#FEF2F2',

                                borderColor:
                                    '#FECACA',
                            },
                        ]}
                    >

                        <Ionicons
                            name="card-outline"
                            size={24}
                            color="#B91C1C"
                        />

                    </View>


                    <View
                        style={styles.cardContent}
                    >

                        <Text
                            style={[
                                styles.cardTitle,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Deudas
                        </Text>


                        <Text
                            style={[
                                styles.cardDesc,
                                {
                                    color:
                                        colors.dark,
                                    opacity: 0.65,
                                },
                            ]}
                        >
                            Controla préstamos, cuotas, tarjetas
                            y obligaciones pendientes.
                        </Text>

                    </View>


                    <View
                        style={[
                            styles.arrowContainer,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#DC2626"
                        />

                    </View>

                </TouchableOpacity>


                {/* ================================================= */}
                {/* GASTOS FIJOS */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.card,
                        {
                            backgroundColor:
                                '#FFFFFF',

                            borderColor:
                                colors.light,
                        },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                        navigation.navigate(
                            'gastosfijos'
                        )
                    }
                >

                    <View
                        style={[
                            styles.iconContainerFijos,
                            {
                                backgroundColor:
                                    '#FFFBEB',

                                borderColor:
                                    '#FDE68A',
                            },
                        ]}
                    >

                        <Ionicons
                            name="repeat-outline"
                            size={24}
                            color="#B45309"
                        />

                    </View>


                    <View
                        style={styles.cardContent}
                    >

                        <Text
                            style={[
                                styles.cardTitle,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Gastos Fijos
                        </Text>


                        <Text
                            style={[
                                styles.cardDesc,
                                {
                                    color:
                                        colors.dark,
                                    opacity: 0.65,
                                },
                            ]}
                        >
                            Gestiona servicios, arriendo,
                            suscripciones y pagos recurrentes.
                        </Text>

                    </View>


                    <View
                        style={[
                            styles.arrowContainer,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#D97706"
                        />

                    </View>

                </TouchableOpacity>


                {/* ================================================= */}
                {/* GASTOS */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.card,
                        {
                            backgroundColor:
                                '#FFFFFF',

                            borderColor:
                                colors.light,
                        },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                        navigation.navigate(
                            'gastos'
                        )
                    }
                >

                    <View
                        style={[
                            styles.iconContainerGastos,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="cart-outline"
                            size={24}
                            color={colors.primary}
                        />

                    </View>


                    <View
                        style={styles.cardContent}
                    >

                        <Text
                            style={[
                                styles.cardTitle,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Gastos
                        </Text>


                        <Text
                            style={[
                                styles.cardDesc,
                                {
                                    color:
                                        colors.dark,
                                    opacity: 0.65,
                                },
                            ]}
                        >
                            Anota tus gastos diarios u ocasionales
                            de forma rápida.
                        </Text>

                    </View>


                    <View
                        style={[
                            styles.arrowContainer,
                            {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={colors.primary}
                        />

                    </View>

                </TouchableOpacity>


                {/* ================================================= */}
                {/* INFORMACIÓN */}
                {/* ================================================= */}

                <View
                    style={[
                        styles.infoBox,
                        {
                            backgroundColor:
                                colors.veryLight,

                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.infoIcon,
                            {
                                backgroundColor:
                                    '#FFFFFF',

                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color={colors.primary}
                        />

                    </View>


                    <View
                        style={styles.infoContent}
                    >

                        <Text
                            style={[
                                styles.infoTitle,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Registro organizado
                        </Text>


                        <Text
                            style={[
                                styles.infoText,
                                {
                                    color:
                                        colors.dark,
                                    opacity: 0.8,
                                },
                            ]}
                        >
                            Cada registro se guarda dentro de las
                            finanzas compartidas y se relaciona
                            con las cuentas correspondientes.
                        </Text>

                    </View>

                </View>


                {/* ================================================= */}
                {/* BOTÓN REGRESAR */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.backButton,
                        {
                            backgroundColor:
                                colors.veryLight,

                            borderColor:
                                colors.light,
                        },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                        navigation.goBack()
                    }
                >

                    <Ionicons
                        name="arrow-back-outline"
                        size={18}
                        color={colors.primary}
                    />


                    <Text
                        style={[
                            styles.backButtonText,
                            {
                                color:
                                    colors.primary,
                            },
                        ]}
                    >
                        Regresar
                    </Text>

                </TouchableOpacity>


                {/* ================================================= */}
                {/* FOOTER */}
                {/* ================================================= */}

                <Text
                    style={[
                        styles.footer,
                        {
                            color:
                                colors.dark,
                        },
                    ]}
                >
                    Mantén tus finanzas organizadas y bajo control.
                </Text>


            </ScrollView>

        </View>

    );

}


const styles = StyleSheet.create({

    // ============================================================
    // CONTENEDOR
    // ============================================================

    rootContainer: {
        flex: 1,
    },

    scrollView: {
        flex: 1,
    },

    container: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },


    // ============================================================
    // HEADER
    // ============================================================

    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },

    backButtonTop: {
        width: 40,
        height: 40,
        borderRadius: 12,

        justifyContent: 'center',
        alignItems: 'center',

        borderWidth: 1,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,

        elevation: 2,
    },

    topHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
    },


    // ============================================================
    // HERO
    // ============================================================

    heroCard: {
        borderRadius: 20,

        padding: 18,

        marginBottom: 20,

        alignItems: 'center',

        borderWidth: 1,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,

        elevation: 2,
    },

    logoBackground: {
        width: 120,
        height: 105,

        borderRadius: 22,

        justifyContent: 'center',
        alignItems: 'center',

        marginBottom: 12,

        borderWidth: 1,

        overflow: 'hidden',
    },

    logo: {
        width: 125,
        height: 145,

        resizeMode: 'contain',

        transform: [
            {
                translateY: 2,
            },
        ],
    },

    heroTextContainer: {
        alignItems: 'center',
    },

    smallTitle: {
        fontSize: 10,

        fontWeight: '800',

        letterSpacing: 1.5,

        marginBottom: 4,
    },

    titulo: {
        textAlign: 'center',

        fontSize: 20,

        fontWeight: 'bold',

        marginBottom: 4,
    },

    subtitulo: {
        textAlign: 'center',

        fontSize: 12,

        lineHeight: 17,

        maxWidth: 330,
    },


    // ============================================================
    // SECCIÓN
    // ============================================================

    sectionHeader: {
        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 12,
    },

    stepBadge: {
        width: 26,
        height: 26,

        borderRadius: 8,

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
        fontSize: 15,

        fontWeight: '600',
    },


    // ============================================================
    // CARDS
    // ============================================================

    card: {
        borderRadius: 16,

        padding: 16,

        marginBottom: 12,

        flexDirection: 'row',

        alignItems: 'center',

        borderWidth: 1,

        shadowColor: '#000',

        shadowOffset: {
            width: 0,
            height: 1,
        },

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
        fontSize: 15,

        fontWeight: 'bold',

        marginBottom: 3,
    },

    cardDesc: {
        fontSize: 12,

        lineHeight: 16,
    },


    // ============================================================
    // ICONO INGRESOS
    // ============================================================

    iconContainerIngresos: {
        width: 48,
        height: 48,

        borderRadius: 14,

        borderWidth: 1,

        alignItems: 'center',
        justifyContent: 'center',
    },


    // ============================================================
    // ICONO DEUDAS
    // ============================================================

    iconContainerDeudas: {
        width: 48,
        height: 48,

        borderRadius: 14,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
    },


    // ============================================================
    // ICONO GASTOS FIJOS
    // ============================================================

    iconContainerFijos: {
        width: 48,
        height: 48,

        borderRadius: 14,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
    },


    // ============================================================
    // ICONO GASTOS
    // ============================================================

    iconContainerGastos: {
        width: 48,
        height: 48,

        borderRadius: 14,

        borderWidth: 1,

        alignItems: 'center',
        justifyContent: 'center',
    },


    // ============================================================
    // FLECHA
    // ============================================================

    arrowContainer: {
        width: 32,
        height: 32,

        borderRadius: 10,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
    },


    // ============================================================
    // INFORMACIÓN
    // ============================================================

    infoBox: {
        flexDirection: 'row',

        alignItems: 'center',

        borderRadius: 14,

        padding: 13,

        marginTop: 4,
        marginBottom: 8,

        borderWidth: 1,
    },

    infoIcon: {
        width: 36,
        height: 36,

        borderRadius: 10,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,

        marginRight: 10,
    },

    infoContent: {
        flex: 1,
    },

    infoTitle: {
        fontSize: 12,

        fontWeight: 'bold',

        marginBottom: 2,
    },

    infoText: {
        fontSize: 11,

        lineHeight: 15,
    },


    // ============================================================
    // REGRESAR
    // ============================================================

    backButton: {
        height: 48,

        borderRadius: 14,

        borderWidth: 1,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        marginTop: 8,
    },

    backButtonText: {
        fontSize: 13,

        fontWeight: '600',

        marginLeft: 6,
    },


    // ============================================================
    // FOOTER
    // ============================================================

    footer: {
        textAlign: 'center',

        fontSize: 11,

        marginTop: 18,

        opacity: 0.55,
    },

});