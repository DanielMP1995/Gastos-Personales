import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    push,
    set,
    get,
    onValue,
    update,
} from 'firebase/database';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================================
// TEMA
// ============================================================

import { useTheme } from '../../context/ThemeContext';

// ============================================================
// PANTALLA
// ============================================================

export default function RegistroIngresosScreen({
    navigation,
}: any) {

    // ============================================================
    // TEMA
    // ============================================================

    const { colors } = useTheme();

    // ============================================================
    // SAFE AREA
    // ============================================================

    const insets = useSafeAreaInsets();

    // ============================================================
    // ESTADOS
    // ============================================================

    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [categoriaIngreso, setCategoriaIngreso] =
        useState('Salario');

    // ============================================================
    // CUENTAS
    // ============================================================

    const [cuentasFirebase, setCuentasFirebase] =
        useState<any[]>([]);

    const [cuentaDestinoId, setCuentaDestinoId] =
        useState<string | null>(null);

    // ============================================================
    // CATEGORÍAS
    // ============================================================

    const categoriasIngresos = [
        'Salario',
        'Venta',
        'Inversión',
        'Regalo',
        'Extra',
    ];

    // ============================================================
    // HEADER
    // ============================================================

    useEffect(() => {

        navigation.setOptions({
            headerShown: false,
        });

    }, [navigation]);

    // ============================================================
    // CARGAR CUENTAS
    // ============================================================

    useEffect(() => {

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            return;
        }

        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        get(usuarioRef)
            .then((snapshot) => {

                if (!snapshot.exists()) {
                    return;
                }

                const idPareja =
                    snapshot.val().idPareja;

                if (!idPareja) {
                    return;
                }

                const cuentasRef = ref(
                    db,
                    `parejas/${idPareja}/cuentas`
                );

                onValue(cuentasRef, (snap) => {

                    const data = snap.val();

                    const lista = data
                        ? Object.keys(data).map((key) => ({
                            id: key,
                            ...data[key],
                        }))
                        : [];

                    setCuentasFirebase(lista);

                    setCuentaDestinoId((actual) => {

                        if (
                            actual &&
                            lista.some(
                                (c) => c.id === actual
                            )
                        ) {
                            return actual;
                        }

                        return lista.length > 0
                            ? lista[0].id
                            : null;
                    });

                });

            });

    }, []);

    // ============================================================
    // GUARDAR INGRESO
    // ============================================================

    function guardarIngreso() {

        if (!monto || !descripcion) {

            Alert.alert(
                'Error',
                'Por favor ingresa un monto y una descripción.'
            );

            return;
        }

        const montoNum = parseFloat(monto);

        if (
            isNaN(montoNum) ||
            montoNum <= 0
        ) {

            Alert.alert(
                'Error',
                'Ingresa un monto válido.'
            );

            return;
        }

        if (!cuentaDestinoId) {

            Alert.alert(
                'Selecciona una cuenta',
                'Elige a qué cuenta (banco o efectivo) entra este ingreso. Si no tienes ninguna, créala primero en la pestaña Cuentas.'
            );

            return;
        }

        const cuentaDestino =
            cuentasFirebase.find(
                (c) => c.id === cuentaDestinoId
            );

        if (!cuentaDestino) {

            Alert.alert(
                'Error',
                'La cuenta seleccionada ya no existe.'
            );

            return;
        }

        const usuarioActual =
            auth.currentUser;

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
                        'No se encontraron los datos de tu perfil.'
                    );

                    return;
                }

                const userData =
                    snapshot.val();

                const idPareja =
                    userData.idPareja;

                const nombreUsuario =
                    userData.nombre;

                if (!idPareja) {

                    Alert.alert(
                        'Error',
                        'No tienes un código de pareja asignado.'
                    );

                    return;
                }

                // ====================================================
                // INGRESO
                // ====================================================

                const ingresosRef = ref(
                    db,
                    `parejas/${idPareja}/ingresos`
                );

                const nuevoIngresoRef =
                    push(ingresosRef);

                const datosIngreso = {

                    tipo: 'ingreso',

                    monto: montoNum,

                    descripcion: descripcion,

                    categoria: categoriaIngreso,

                    fecha:
                        new Date().toISOString(),

                    usuarioEmail:
                        usuarioActual.email,

                    usuarioId:
                        usuarioActual.uid,

                    autor:
                        nombreUsuario,

                    cuentaDestinoId:
                        cuentaDestino.id,

                    cuentaDestinoNombre:
                        cuentaDestino.nombre,
                };

                // ====================================================
                // ACTUALIZAR SALDO
                // ====================================================

                const nuevoSaldoCuenta =
                    Number(
                        cuentaDestino.saldo || 0
                    ) + montoNum;

                // ====================================================
                // MOVIMIENTO DE CUENTA
                // ====================================================

                const movimientoCuentaRef =
                    push(
                        ref(
                            db,
                            `parejas/${idPareja}/movimientosCuentas`
                        )
                    );

                // ====================================================
                // GUARDAR TODO
                // ====================================================

                Promise.all([

                    set(
                        nuevoIngresoRef,
                        datosIngreso
                    ),

                    update(
                        ref(
                            db,
                            `parejas/${idPareja}/cuentas/${cuentaDestino.id}`
                        ),
                        {
                            saldo:
                                nuevoSaldoCuenta,
                        }
                    ),

                    set(
                        movimientoCuentaRef,
                        {

                            tipo: 'ingreso',

                            cuentaDestinoId:
                                cuentaDestino.id,

                            cuentaDestinoNombre:
                                cuentaDestino.nombre,

                            monto:
                                montoNum,

                            descripcion:
                                descripcion,

                            fecha:
                                datosIngreso.fecha,

                            autor:
                                nombreUsuario,
                        }
                    ),

                ])
                    .then(() => {

                        Alert.alert(
                            '¡Éxito!',
                            `Ingreso registrado y agregado a ${cuentaDestino.nombre}.`
                        );

                        setMonto('');
                        setDescripcion('');
                        setCategoriaIngreso('Salario');

                        navigation.goBack();

                    })
                    .catch((error) => {

                        Alert.alert(
                            'Error al guardar',
                            error.message
                        );

                    });

            })
            .catch((error) => {

                Alert.alert(
                    'Error de conexión',
                    'Hubo un problema al obtener tu información: ' +
                    error.message
                );

            });
    }

    // ============================================================
    // INTERFAZ
    // ============================================================

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
                            insets.top + 20,
                    },
                ]}

                showsVerticalScrollIndicator={false}

                keyboardShouldPersistTaps="handled"
            >

                {/* ================================================= */}
                {/* CABECERA */}
                {/* ================================================= */}

                <View style={styles.topHeader}>

                    <TouchableOpacity
                        style={[
                            styles.backButtonTop,
                            {
                                borderColor:
                                    colors.light,
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={0.8}
                    >

                        <Text
                            style={[
                                styles.backButtonTopText,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            ←
                        </Text>

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
                        Registro de Ingresos
                    </Text>

                    <View
                        style={{ width: 40 }}
                    />

                </View>

                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <View
                    style={[
                        styles.heroCard,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.heroIconContainer,
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
                        style={
                            styles.heroTextContainer
                        }
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
                            MOVIMIENTO FINANCIERO
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
                            Nuevo Ingreso
                        </Text>

                        <Text
                            style={[
                                styles.subtitulo,
                                {
                                    color:
                                        '#64748B',
                                },
                            ]}
                        >
                            Añade fondos al balance
                            compartido con tu pareja
                        </Text>

                    </View>

                </View>

                {/* ================================================= */}
                {/* SECCIÓN 01 */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

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
                        Categoría de Ingreso
                    </Text>

                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={
                        styles.rowCat
                    }
                >

                    {categoriasIngresos.map(
                        (cat) => {

                            const isSelected =
                                categoriaIngreso ===
                                cat;

                            return (

                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.catBtn,
                                        {
                                            borderColor:
                                                isSelected
                                                    ? colors.primary
                                                    : colors.light,

                                            backgroundColor:
                                                isSelected
                                                    ? colors.veryLight
                                                    : '#FFFFFF',
                                        },
                                    ]}
                                    onPress={() =>
                                        setCategoriaIngreso(
                                            cat
                                        )
                                    }
                                    activeOpacity={0.8}
                                >

                                    <Text
                                        style={[
                                            styles.catText,
                                            {
                                                color:
                                                    isSelected
                                                        ? colors.dark
                                                        : '#64748B',
                                            },
                                            isSelected &&
                                            styles.catTextActive,
                                        ]}
                                    >
                                        {cat}
                                    </Text>

                                </TouchableOpacity>

                            );
                        }
                    )}

                </ScrollView>

                {/* ================================================= */}
                {/* SECCIÓN 02 */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

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
                            02
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
                        Detalles del Monto
                    </Text>

                </View>

                {/* ================================================= */}
                {/* FORMULARIO */}
                {/* ================================================= */}

                <View
                    style={[
                        styles.formCard,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <Text style={styles.label}>
                        Monto del Ingreso ($)
                    </Text>

                    <View
                        style={[
                            styles.inputWrapper,
                            {
                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Text
                            style={[
                                styles.currency,
                                {
                                    color:
                                        colors.primary,
                                },
                            ]}
                        >
                            $
                        </Text>

                        <TextInput
                            style={[
                                styles.inputMonto,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                            placeholder="0.00"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={monto}
                            onChangeText={setMonto}
                        />

                    </View>

                    <Text style={styles.label}>
                        Descripción o Motivo
                    </Text>

                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderColor:
                                    colors.light,
                                color:
                                    colors.dark,
                            },
                        ]}
                        placeholder="Ej. Pago de quincena, Venta, etc."
                        placeholderTextColor="#94A3B8"
                        value={descripcion}
                        onChangeText={setDescripcion}
                        multiline
                    />

                    <Text style={styles.label}>
                        ¿A qué cuenta entra?
                    </Text>

                    {/* ================================================= */}
                    {/* SIN CUENTAS */}
                    {/* ================================================= */}

                    {cuentasFirebase.length === 0 ? (

                        <TouchableOpacity
                            style={
                                styles.avisoSinCuentas
                            }
                            onPress={() =>
                                navigation.navigate(
                                    'tabs',
                                    {
                                        screen:
                                            'Cuentas',
                                    }
                                )
                            }
                        >

                            <Ionicons
                                name="alert-circle-outline"
                                size={16}
                                color="#B85C5C"
                            />

                            <Text
                                style={
                                    styles.avisoSinCuentasText
                                }
                            >
                                No tienes cuentas creadas.
                                Toca aquí para crear una
                                (banco o efectivo).
                            </Text>

                        </TouchableOpacity>

                    ) : (

                        <View
                            style={
                                styles.cuentasChipRow
                            }
                        >

                            {cuentasFirebase.map(
                                (cuenta) => {

                                    const isSelected =
                                        cuentaDestinoId ===
                                        cuenta.id;

                                    return (

                                        <TouchableOpacity
                                            key={
                                                cuenta.id
                                            }
                                            style={[
                                                styles.catBtn,
                                                {
                                                    borderColor:
                                                        isSelected
                                                            ? colors.primary
                                                            : colors.light,

                                                    backgroundColor:
                                                        isSelected
                                                            ? colors.veryLight
                                                            : '#FFFFFF',
                                                },
                                            ]}
                                            onPress={() =>
                                                setCuentaDestinoId(
                                                    cuenta.id
                                                )
                                            }
                                            activeOpacity={
                                                0.8
                                            }
                                        >

                                            <Ionicons
                                                name={
                                                    cuenta.tipo ===
                                                    'efectivo'
                                                        ? 'cash-outline'
                                                        : 'card-outline'
                                                }
                                                size={13}
                                                color={
                                                    isSelected
                                                        ? colors.dark
                                                        : '#64748B'
                                                }
                                                style={{
                                                    marginRight: 6,
                                                }}
                                            />

                                            <Text
                                                style={[
                                                    styles.catText,
                                                    {
                                                        color:
                                                            isSelected
                                                                ? colors.dark
                                                                : '#64748B',
                                                    },
                                                    isSelected &&
                                                    styles.catTextActive,
                                                ]}
                                            >
                                                {
                                                    cuenta.nombre
                                                }
                                                {' · $'}
                                                {Number(
                                                    cuenta.saldo ||
                                                    0
                                                ).toFixed(2)}
                                            </Text>

                                        </TouchableOpacity>

                                    );

                                }
                            )}

                        </View>

                    )}

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

                        <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color={colors.primary}
                            style={{
                                marginRight: 8,
                            }}
                        />

                        <Text
                            style={[
                                styles.infoText,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Este ingreso será compartido
                            automáticamente con tu pareja.
                        </Text>

                    </View>

                    {/* ================================================= */}
                    {/* GUARDAR */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            {
                                backgroundColor:
                                    colors.primary,

                                shadowColor:
                                    colors.primary,
                            },
                        ]}
                        onPress={guardarIngreso}
                        activeOpacity={0.85}
                    >

                        <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#FFFFFF"
                            style={{
                                marginRight: 6,
                            }}
                        />

                        <Text
                            style={
                                styles.primaryButtonText
                            }
                        >
                            Guardar Ingreso
                        </Text>

                    </TouchableOpacity>

                </View>

                {/* ================================================= */}
                {/* CANCELAR */}
                {/* ================================================= */}

                <TouchableOpacity
                    style={[
                        styles.secondaryButton,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                    onPress={() =>
                        navigation.goBack()
                    }
                    activeOpacity={0.85}
                >

                    <Text
                        style={
                            styles.secondaryButtonText
                        }
                    >
                        Cancelar / Volver
                    </Text>

                </TouchableOpacity>

                {/* ================================================= */}
                {/* FOOTER */}
                {/* ================================================= */}

                <Text style={styles.footerText}>
                    Finanzas en Pareja
                </Text>

            </ScrollView>

        </View>
    );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

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

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,

        elevation: 2,
    },

    backButtonTopText: {
        fontSize: 18,
        fontWeight: 'bold',
    },

    topHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
    },

    // ============================================================
    // HERO
    // ============================================================

    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#FFFFFF',

        borderRadius: 20,

        padding: 18,

        marginBottom: 20,

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

    heroIconContainer: {
        width: 50,
        height: 50,

        borderRadius: 15,

        justifyContent: 'center',
        alignItems: 'center',

        marginRight: 15,

        borderWidth: 1,
    },

    heroTextContainer: {
        flex: 1,
    },

    smallTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 3,
    },

    titulo: {
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 3,
    },

    subtitulo: {
        fontSize: 12,
        lineHeight: 16,
    },

    // ============================================================
    // SECCIONES
    // ============================================================

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 6,
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
    // CATEGORÍAS
    // ============================================================

    rowCat: {
        paddingVertical: 4,
        paddingRight: 10,
        marginBottom: 16,
    },

    catBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,

        borderRadius: 12,

        marginRight: 8,

        borderWidth: 1,

        flexDirection: 'row',
        alignItems: 'center',
    },

    catText: {
        fontSize: 12,
        fontWeight: '500',
    },

    catTextActive: {
        fontWeight: 'bold',
        fontSize: 12,
    },

    // ============================================================
    // FORMULARIO
    // ============================================================

    formCard: {
        backgroundColor: '#FFFFFF',

        borderRadius: 20,

        padding: 20,

        borderWidth: 1,

        marginBottom: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,

        elevation: 2,
    },

    label: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',

        marginBottom: 6,
        marginTop: 10,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#F8FAFC',

        borderWidth: 1,

        borderRadius: 12,

        paddingHorizontal: 14,
    },

    currency: {
        fontSize: 20,
        fontWeight: 'bold',
        marginRight: 8,
    },

    inputMonto: {
        flex: 1,

        fontSize: 18,
        fontWeight: 'bold',

        paddingVertical: 12,
    },

    input: {
        backgroundColor: '#F8FAFC',

        borderWidth: 1,

        borderRadius: 12,

        paddingHorizontal: 14,
        paddingVertical: 12,

        fontSize: 13,

        minHeight: 50,
    },

    // ============================================================
    // CUENTAS
    // ============================================================

    cuentasChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',

        gap: 8,

        marginBottom: 4,
    },

    avisoSinCuentas: {
        flexDirection: 'row',
        alignItems: 'center',

        backgroundColor: '#FDF2F2',

        borderRadius: 12,

        padding: 12,

        borderWidth: 1,
        borderColor: '#F3D6D6',

        marginBottom: 4,
    },

    avisoSinCuentasText: {
        color: '#B85C5C',

        fontSize: 12,

        marginLeft: 8,

        flex: 1,
    },

    // ============================================================
    // INFO
    // ============================================================

    infoBox: {
        borderRadius: 12,

        borderWidth: 1,

        padding: 12,

        flexDirection: 'row',
        alignItems: 'center',

        marginTop: 14,
        marginBottom: 4,
    },

    infoText: {
        fontSize: 11,
        lineHeight: 16,

        flex: 1,

        fontWeight: '500',
    },

    // ============================================================
    // BOTÓN PRINCIPAL
    // ============================================================

    primaryButton: {
        marginTop: 16,

        borderRadius: 14,

        paddingVertical: 15,

        alignItems: 'center',
        justifyContent: 'center',

        flexDirection: 'row',

        shadowOffset: {
            width: 0,
            height: 4,
        },

        shadowOpacity: 0.25,
        shadowRadius: 6,

        elevation: 3,
    },

    primaryButtonText: {
        color: '#FFFFFF',

        fontSize: 14,

        fontWeight: 'bold',
    },

    // ============================================================
    // BOTÓN SECUNDARIO
    // ============================================================

    secondaryButton: {
        backgroundColor: '#F1F5F9',

        borderRadius: 14,

        paddingVertical: 14,

        alignItems: 'center',

        borderWidth: 1,

        marginBottom: 20,
    },

    secondaryButtonText: {
        color: '#64748B',

        fontSize: 13,

        fontWeight: '600',
    },

    // ============================================================
    // FOOTER
    // ============================================================

    footerText: {
        color: '#94A3B8',

        fontSize: 11,

        textAlign: 'center',

        marginTop: 10,
    },

});