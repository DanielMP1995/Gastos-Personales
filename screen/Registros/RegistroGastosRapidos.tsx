import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    TextInput,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

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

// ============================================================
// TEMA
// ============================================================

import { useTheme } from '../../context/ThemeContext';

// ============================================================
// COMPONENTE
// ============================================================

export default function RegistroGastosRapidos({
    navigation,
}: any) {

    // ============================================================
    // TEMA ACTUAL
    // ============================================================

    const { colors } = useTheme();

    // ============================================================
    // ESTADOS
    // ============================================================

    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [categoria, setCategoria] = useState('Tienda');

    // ============================================================
    // CUENTAS
    // ============================================================

    const [cuentasFirebase, setCuentasFirebase] =
        useState<any[]>([]);

    const [cuentaOrigenId, setCuentaOrigenId] =
        useState<string | null>(null);

    const [idParejaActual, setIdParejaActual] =
        useState<string | null>(null);

    // ============================================================
    // OCULTAR HEADER
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

        get(usuarioRef).then((snapshot) => {

            if (!snapshot.exists()) {
                return;
            }

            const idPareja =
                snapshot.val().idPareja;

            if (!idPareja) {
                return;
            }

            setIdParejaActual(idPareja);

            const cuentasRef =
                ref(
                    db,
                    `parejas/${idPareja}/cuentas`
                );

            onValue(cuentasRef, (snap) => {

                const data = snap.val();

                const lista = data
                    ? Object.keys(data).map(
                        (key) => ({
                            id: key,
                            ...data[key],
                        })
                    )
                    : [];

                setCuentasFirebase(lista);

                setCuentaOrigenId((actual) => {

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
    // CATEGORÍAS
    // ============================================================

    const categorias = [

        {
            id: 'Tienda',
            label: 'Tienda',
            icon: 'storefront-outline',
        },

        {
            id: 'Farmacia',
            label: 'Farmacia',
            icon: 'medical-outline',
        },

        {
            id: 'Comida',
            label: 'Comida',
            icon: 'fast-food-outline',
        },

        {
            id: 'Transporte',
            label: 'Transporte',
            icon: 'car-outline',
        },

        {
            id: 'Compras',
            label: 'Compras',
            icon: 'cart-outline',
        },

        {
            id: 'Antojo',
            label: 'Antojo',
            icon: 'cafe-outline',
        },

        {
            id: 'Otros',
            label: 'Otros',
            icon: 'ellipsis-horizontal-circle-outline',
        },

    ];

    // ============================================================
    // GUARDAR GASTO
    // ============================================================

    function guardarGasto() {

        const montoNum =
            parseFloat(monto);

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

        if (!cuentaOrigenId) {

            Alert.alert(
                'Selecciona una cuenta',
                'Elige desde qué cuenta (banco o efectivo) sale este gasto. Si no tienes ninguna, créala primero en la pestaña Cuentas.'
            );

            return;
        }

        const cuentaOrigen =
            cuentasFirebase.find(
                (c) =>
                    c.id === cuentaOrigenId
            );

        if (!cuentaOrigen) {

            Alert.alert(
                'Error',
                'La cuenta seleccionada ya no existe.'
            );

            return;
        }

        if (
            Number(cuentaOrigen.saldo || 0) <
            montoNum
        ) {

            Alert.alert(
                'Saldo insuficiente',
                `${cuentaOrigen.nombre} solo tiene $${Number(
                    cuentaOrigen.saldo || 0
                ).toFixed(2)} disponible.`
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

        const usuarioRef =
            ref(
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

                const userData =
                    snapshot.val();

                const idPareja =
                    userData.idPareja;

                if (!idPareja) {

                    Alert.alert(
                        'Error',
                        'No tienes una pareja vinculada.'
                    );

                    return;
                }

                const gastosRef =
                    ref(
                        db,
                        `parejas/${idPareja}/movimientos`
                    );

                const nuevoGastoRef =
                    push(gastosRef);

                const motivoLimpio =
                    motivo.trim();

                const descripcionFinal =
                    motivoLimpio
                        ? `${categoria} - ${motivoLimpio}`
                        : `Gasto rápido: ${categoria}`;

                const datosGasto = {

                    tipo: 'gasto',

                    categoria: categoria,

                    monto:
                        Number(
                            montoNum.toFixed(2)
                        ),

                    descripcion:
                        descripcionFinal,

                    fecha:
                        new Date().toISOString(),

                    usuarioEmail:
                        usuarioActual.email,

                    autor:
                        userData.nombre ||
                        usuarioActual.email ||
                        'Usuario',

                    origen:
                        'gastoRapido',

                    cuentaOrigenId:
                        cuentaOrigen.id,

                    cuentaOrigenNombre:
                        cuentaOrigen.nombre,

                };

                const nuevoSaldoCuenta =
                    Number(
                        cuentaOrigen.saldo || 0
                    ) - montoNum;

                const movimientoCuentaRef =
                    push(
                        ref(
                            db,
                            `parejas/${idPareja}/movimientosCuentas`
                        )
                    );

                Promise.all([

                    set(
                        nuevoGastoRef,
                        datosGasto
                    ),

                    update(
                        ref(
                            db,
                            `parejas/${idPareja}/cuentas/${cuentaOrigen.id}`
                        ),
                        {
                            saldo:
                                nuevoSaldoCuenta,
                        }
                    ),

                    set(
                        movimientoCuentaRef,
                        {

                            tipo: 'gasto',

                            cuentaOrigenId:
                                cuentaOrigen.id,

                            cuentaOrigenNombre:
                                cuentaOrigen.nombre,

                            monto:
                                Number(
                                    montoNum.toFixed(2)
                                ),

                            descripcion:
                                descripcionFinal,

                            fecha:
                                datosGasto.fecha,

                            autor:
                                datosGasto.autor,

                        }
                    ),

                ])
                    .then(() => {

                        Alert.alert(
                            '¡Éxito!',
                            `Gasto de $${montoNum.toFixed(
                                2
                            )} registrado y descontado de ${cuentaOrigen.nombre}.`
                        );

                        setMonto('');
                        setMotivo('');

                        navigation.goBack();

                    })
                    .catch((error) => {

                        Alert.alert(
                            'Error',
                            error?.message ||
                            'No se pudo registrar el gasto.'
                        );

                    });

            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    error?.message ||
                    'No se pudo obtener la información del usuario.'
                );

            });

    }

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (

        <SafeAreaView
            style={[
                styles.safeArea,
                {
                    backgroundColor:
                        colors.veryLight,
                },
            ]}
            edges={['top']}
        >

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
                    contentContainerStyle={
                        styles.container
                    }
                    showsVerticalScrollIndicator={
                        false
                    }
                    keyboardShouldPersistTaps="handled"
                >

                    {/* HEADER */}

                    <View
                        style={styles.topHeader}
                    >

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

                            <Ionicons
                                name="arrow-back"
                                size={20}
                                color={
                                    colors.primary
                                }
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
                            Gasto Rápido
                        </Text>

                        <View
                            style={{
                                width: 40,
                            }}
                        />

                    </View>

                    {/* HERO */}

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
                                name="flash"
                                size={22}
                                color={
                                    colors.primary
                                }
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
                                REGISTRO VELOZ
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
                                Gastos al Instante
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
                                Anota compras menores en pocos segundos
                            </Text>

                        </View>

                    </View>

                    {/* PASO 1 */}

                    <View
                        style={
                            styles.sectionHeader
                        }
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
                            Selecciona la Categoría
                        </Text>

                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={
                            false
                        }
                        contentContainerStyle={
                            styles.row
                        }
                    >

                        {categorias.map(
                            (cat) => {

                                const isSelected =
                                    categoria ===
                                    cat.id;

                                return (

                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.catBtn,

                                            {
                                                borderColor:
                                                    colors.light,
                                            },

                                            isSelected &&
                                            {
                                                backgroundColor:
                                                    colors.primary,

                                                borderColor:
                                                    colors.primary,
                                            },
                                        ]}
                                        onPress={() =>
                                            setCategoria(
                                                cat.id
                                            )
                                        }
                                        activeOpacity={
                                            0.8
                                        }
                                    >

                                        <Ionicons
                                            name={
                                                cat.icon as any
                                            }
                                            size={16}
                                            color={
                                                isSelected
                                                    ? '#FFFFFF'
                                                    : colors.primary
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
                                                            ? '#FFFFFF'
                                                            : '#64748B',
                                                },
                                                isSelected &&
                                                styles.catTextActive,
                                            ]}
                                        >
                                            {
                                                cat.label
                                            }
                                        </Text>

                                    </TouchableOpacity>

                                );

                            }
                        )}

                    </ScrollView>

                    {/* PASO 2 */}

                    <View
                        style={
                            styles.sectionHeader
                        }
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
                            Selecciona o Escribe el Monto
                        </Text>

                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={
                            false
                        }
                        contentContainerStyle={
                            styles.row
                        }
                    >

                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                            .map(
                                (val) => {

                                    const isSelected =
                                        monto ===
                                        val.toString();

                                    return (

                                        <TouchableOpacity
                                            key={val}
                                            style={[
                                                styles.montoBtn,
                                                {
                                                    borderColor:
                                                        colors.light,
                                                },
                                                isSelected &&
                                                {
                                                    backgroundColor:
                                                        colors.primary,
                                                    borderColor:
                                                        colors.primary,
                                                },
                                            ]}
                                            onPress={() =>
                                                setMonto(
                                                    val.toString()
                                                )
                                            }
                                            activeOpacity={
                                                0.8
                                            }
                                        >

                                            <Text
                                                style={[
                                                    styles.montoText,
                                                    {
                                                        color:
                                                            isSelected
                                                                ? '#FFFFFF'
                                                                : colors.primary,
                                                    },
                                                ]}
                                            >
                                                ${val}
                                            </Text>

                                        </TouchableOpacity>

                                    );

                                }
                            )}

                    </ScrollView>

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
                                styles.inputMontoCustom,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                            placeholder="Otro monto..."
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            value={monto}
                            onChangeText={
                                setMonto
                            }
                        />

                    </View>

                    {/* PASO 3 */}

                    <View
                        style={
                            styles.sectionHeader
                        }
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
                                03
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
                            Detalle Opcional
                        </Text>

                    </View>

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
                        placeholder="Ej. Pan, pasaje, café..."
                        placeholderTextColor="#94A3B8"
                        value={motivo}
                        onChangeText={
                            setMotivo
                        }
                    />

                    {/* PASO 4 */}

                    <View
                        style={
                            styles.sectionHeader
                        }
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
                                04
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
                            ¿De qué cuenta sale?
                        </Text>

                    </View>

                    {cuentasFirebase.length === 0 ? (

                        <TouchableOpacity
                            style={[
                                styles.avisoSinCuentas,
                                {
                                    borderColor:
                                        colors.light,
                                    backgroundColor:
                                        colors.veryLight,
                                },
                            ]}
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
                                No tienes cuentas creadas. Toca aquí para crear una (banco o efectivo).
                            </Text>

                        </TouchableOpacity>

                    ) : (

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={
                                false
                            }
                            contentContainerStyle={
                                styles.row
                            }
                        >

                            {cuentasFirebase.map(
                                (cuenta) => {

                                    const isSelected =
                                        cuentaOrigenId ===
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
                                                        colors.light,
                                                },
                                                isSelected &&
                                                {
                                                    backgroundColor:
                                                        colors.primary,
                                                    borderColor:
                                                        colors.primary,
                                                },
                                            ]}
                                            onPress={() =>
                                                setCuentaOrigenId(
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
                                                size={16}
                                                color={
                                                    isSelected
                                                        ? '#FFFFFF'
                                                        : colors.primary
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
                                                                ? '#FFFFFF'
                                                                : '#64748B',
                                                    },
                                                    isSelected &&
                                                    styles.catTextActive,
                                                ]}
                                            >
                                                {
                                                    cuenta.nombre
                                                }{' '}
                                                · $
                                                {Number(
                                                    cuenta.saldo ||
                                                    0
                                                ).toFixed(
                                                    2
                                                )}
                                            </Text>

                                        </TouchableOpacity>

                                    );

                                }
                            )}

                        </ScrollView>

                    )}

                    {/* RESUMEN */}

                    {parseFloat(monto) > 0 && (

                        <View
                            style={[
                                styles.resumenCard,
                                {
                                    borderColor:
                                        colors.light,
                                },
                            ]}
                        >

                            <Text
                                style={[
                                    styles.resumenTitulo,
                                    {
                                        color:
                                            colors.dark,
                                    },
                                ]}
                            >
                                Resumen del Gasto
                            </Text>

                            <View
                                style={
                                    styles.resumenFila
                                }
                            >

                                <Text
                                    style={
                                        styles.resumenLabel
                                    }
                                >
                                    Categoría
                                </Text>

                                <Text
                                    style={[
                                        styles.resumenValor,
                                        {
                                            color:
                                                colors.dark,
                                        },
                                    ]}
                                >
                                    {categoria}
                                </Text>

                            </View>

                            <View
                                style={
                                    styles.resumenFila
                                }
                            >

                                <Text
                                    style={
                                        styles.resumenLabel
                                    }
                                >
                                    Monto
                                </Text>

                                <Text
                                    style={[
                                        styles.resumenMonto,
                                        {
                                            color:
                                                colors.primary,
                                        },
                                    ]}
                                >
                                    $
                                    {parseFloat(
                                        monto
                                    ).toFixed(2)}
                                </Text>

                            </View>

                            {motivo.trim() !== '' && (

                                <View
                                    style={
                                        styles.resumenFila
                                    }
                                >

                                    <Text
                                        style={
                                            styles.resumenLabel
                                        }
                                    >
                                        Motivo
                                    </Text>

                                    <Text
                                        style={[
                                            styles.resumenValor,
                                            {
                                                color:
                                                    colors.dark,
                                            },
                                        ]}
                                    >
                                        {
                                            motivo.trim()
                                        }
                                    </Text>

                                </View>

                            )}

                        </View>

                    )}

                    {/* GUARDAR */}

                    <TouchableOpacity
                        style={[
                            styles.btnGuardar,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                        onPress={
                            guardarGasto
                        }
                        activeOpacity={
                            0.85
                        }
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
                                styles.btnGuardarText
                            }
                        >
                            Registrar Gasto Rápido
                        </Text>

                    </TouchableOpacity>

                    {/* VOLVER */}

                    <TouchableOpacity
                        style={[
                            styles.btnVolver,
                            {
                                backgroundColor:
                                    colors.veryLight,
                                borderColor:
                                    colors.light,
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={
                            0.85
                        }
                    >

                        <Text
                            style={[
                                styles.btnVolverText,
                                {
                                    color:
                                        colors.primary,
                                },
                            ]}
                        >
                            Cancelar / Volver
                        </Text>

                    </TouchableOpacity>

                </ScrollView>

            </View>

        </SafeAreaView>
    );
}

// ============================================================
// ESTILOS BASE
// Los colores dinámicos se aplican desde useTheme()
// ============================================================

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
    },

    rootContainer: {
        flex: 1,
    },

    scrollView: {
        flex: 1,
    },

    container: {
        paddingHorizontal: 20,
        paddingTop: 12,
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
    },

    topHeaderTitle: {
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
    },

    heroIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
    },

    heroTextContainer: {
        flex: 1,
    },

    smallTitle: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 2,
    },

    titulo: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },

    subtitulo: {
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
    },

    catText: {
        fontSize: 12,
        fontWeight: '500',
    },

    catTextActive: {
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
        alignItems: 'center',
        justifyContent: 'center',
    },

    montoText: {
        fontWeight: 'bold',
        fontSize: 13,
    },

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
    },

    currency: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 6,
    },

    inputMontoCustom: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        paddingVertical: 10,
    },

    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 13,
        marginBottom: 8,
    },

    resumenCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginTop: 6,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },

    resumenTitulo: {
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
        fontSize: 12,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },

    resumenMonto: {
        fontSize: 15,
        fontWeight: 'bold',
    },

    btnGuardar: {
        marginTop: 12,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
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
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        marginTop: 8,
        marginBottom: 20,
    },

    btnVolverText: {
        fontWeight: '600',
        fontSize: 13,
    },

    avisoSinCuentas: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        marginBottom: 8,
    },

    avisoSinCuentasText: {
        color: '#B85C5C',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },

});