import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    onValue,
    push,
    set,
    get,
    update,
} from 'firebase/database';

// ============================================================
// IMPORTAR TEMA
// ============================================================

import { useTheme } from '../../context/ThemeContext';


// ============================================================
// COMPONENTE
// ============================================================

export default function RegistroGastosDetallados({
    navigation,
}: any) {

    const insets = useSafeAreaInsets();

    // ========================================================
    // TEMA DINÁMICO
    // ========================================================

    const { colors } = useTheme();

    const COLOR_PRINCIPAL = colors.primary;
    const COLOR_OSCURO = colors.dark;
    const COLOR_SUAVE = colors.light;
    const COLOR_MUY_SUAVE = colors.veryLight;


    // ========================================================
    // ESTADOS
    // ========================================================

    const [tipoGasto, setTipoGasto] =
        useState<'deuda' | 'fijo'>('deuda');

    const [subCategoria, setSubCategoria] =
        useState('Tarjeta de Crédito');

    const subCategoriasDeuda = [
        'Tarjeta de Crédito',
        'Préstamo Bancario',
        'Casa Comercial',
        'Deuda Familiar',
    ];

    const subCategoriasFijo = [
        'Luz',
        'Agua',
        'Internet / Teléfono',
        'Alquiler',
        'Otro',
    ];

    const [deudasFirebase, setDeudasFirebase] =
        useState<any[]>([]);

    const [movimientosFirebase, setMovimientosFirebase] =
        useState<any[]>([]);

    const [gastosFijosFirebase, setGastosFijosFirebase] =
        useState<any[]>([]);

    const [deudaSeleccionada, setDeudaSeleccionada] =
        useState<any>(null);

    const [
        gastoFijoSeleccionado,
        setGastoFijoSeleccionado,
    ] = useState<any>(null);

    const [montoPagar, setMontoPagar] =
        useState('');

    const [descripcionDetalle, setDescripcionDetalle] =
        useState('');

    const [cuentasFirebase, setCuentasFirebase] =
        useState<any[]>([]);

    const [cuentaOrigenId, setCuentaOrigenId] =
        useState<string | null>(null);

    const usuarioActual = auth.currentUser;


    // ========================================================
    // CARGAR DATOS FIREBASE
    // ========================================================

    useEffect(() => {

        if (usuarioActual) {

            const usuarioRef = ref(
                db,
                `usuarios/${usuarioActual.uid}`
            );

            get(usuarioRef).then((snapshot) => {

                if (snapshot.exists()) {

                    const userData = snapshot.val();

                    const idPareja =
                        userData.idPareja;

                    if (idPareja) {

                        // ------------------------------------
                        // DEUDAS
                        // ------------------------------------

                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/deudas`
                            ),
                            (snap) => {

                                const data = snap.val();

                                setDeudasFirebase(
                                    data
                                        ? Object.keys(data).map(
                                            (key) => ({
                                                id: key,
                                                ...data[key],
                                            })
                                        )
                                        : []
                                );

                            }
                        );


                        // ------------------------------------
                        // MOVIMIENTOS
                        // ------------------------------------

                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/movimientos`
                            ),
                            (snap) => {

                                const data = snap.val();

                                setMovimientosFirebase(
                                    data
                                        ? Object.keys(data).map(
                                            (key) => ({
                                                id: key,
                                                ...data[key],
                                            })
                                        )
                                        : []
                                );

                            }
                        );


                        // ------------------------------------
                        // GASTOS FIJOS
                        // ------------------------------------

                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/gastosFijos`
                            ),
                            (snap) => {

                                const data = snap.val();

                                setGastosFijosFirebase(
                                    data
                                        ? Object.keys(data).map(
                                            (key) => ({
                                                id: key,
                                                ...data[key],
                                            })
                                        )
                                        : []
                                );

                            }
                        );


                        // ------------------------------------
                        // CUENTAS
                        // ------------------------------------

                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/cuentas`
                            ),
                            (snap) => {

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
                                            (c) =>
                                                c.id === actual
                                        )
                                    ) {
                                        return actual;
                                    }

                                    return lista.length > 0
                                        ? lista[0].id
                                        : null;

                                });

                            }
                        );

                    }

                }

            });

        }

    }, [usuarioActual]);


    // ========================================================
    // DEUDAS CON SALDO
    // ========================================================

    const deudasConSaldo = deudasFirebase
        .filter(
            (deuda) =>
                deuda.tipo !== 'tarjeta'
        )
        .map((deuda) => {

            const esConsumoTarjeta =
                deuda.tipo === 'consumoTarjeta';

            const pagosAsociados =
                movimientosFirebase.filter(
                    (mov) =>
                        mov.deudaId === deuda.id
                );

            const totalPagado =
                pagosAsociados.reduce(
                    (sum, mov) =>
                        sum +
                        (Number(mov.monto) || 0),
                    0
                );

            const montoOriginal =
                Number(deuda.monto) || 0;

            const saldoRestante =
                Math.max(
                    0,
                    montoOriginal -
                    totalPagado
                );

            let nombreEntidad =
                deuda.entidad ||
                deuda.nombre ||
                '';

            if (esConsumoTarjeta) {

                const tarjeta =
                    deudasFirebase.find(
                        (t) =>
                            t.tipo === 'tarjeta' &&
                            t.id === deuda.tarjetaId
                    );

                const banco =
                    deuda.tarjetaBanco ||
                    tarjeta?.entidad ||
                    'Banco';

                const marca =
                    deuda.tarjetaMarca ||
                    tarjeta?.marcaTarjeta ||
                    'Tarjeta';

                nombreEntidad =
                    `${banco} - ${marca}`;

            }

            return {
                ...deuda,
                nombreEntidad,
                saldoRestante,
                totalPagado,
                esConsumoTarjeta,
            };

        });


    // ========================================================
    // FILTRAR DEUDAS
    // ========================================================

    const deudasFiltradas =
        deudasConSaldo.filter(
            (deuda) => {

                const catBD =
                    (
                        deuda.categoria || ''
                    )
                        .trim()
                        .toLowerCase();

                const catActual =
                    subCategoria
                        .trim()
                        .toLowerCase();

                return (
                    deuda.saldoRestante > 0 &&
                    catBD === catActual
                );

            }
        );


    // ========================================================
    // FILTRAR GASTOS FIJOS
    // ========================================================

    const fijosFiltrados =
        gastosFijosFirebase.filter(
            (gasto) => {

                const catBD =
                    String(
                        gasto.categoria || ''
                    )
                        .trim()
                        .toLowerCase();

                const catActual =
                    String(
                        subCategoria || ''
                    )
                        .trim()
                        .toLowerCase();

                if (
                    catActual.includes(
                        'internet'
                    )
                ) {

                    return (
                        catBD.includes(
                            'internet'
                        ) ||
                        catBD.includes(
                            'teléfono'
                        ) ||
                        catBD.includes(
                            'telefono'
                        )
                    );

                }

                return catBD === catActual;

            }
        );


    // ========================================================
    // GUARDAR PAGO
    // ========================================================

    function guardarPagoDetallado() {

        const montoNum =
            parseFloat(montoPagar);

        if (
            isNaN(montoNum) ||
            montoNum <= 0
        ) {

            Alert.alert(
                'Error',
                'Ingresa un monto válido a pagar.'
            );

            return;
        }


        if (
            tipoGasto === 'deuda' &&
            !deudaSeleccionada
        ) {

            Alert.alert(
                'Atención',
                'Por favor selecciona una deuda de la lista.'
            );

            return;
        }


        if (!cuentaOrigenId) {

            Alert.alert(
                'Selecciona una cuenta',
                'Elige desde qué cuenta saldrá este pago.'
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
            Number(
                cuentaOrigen.saldo || 0
            ) < montoNum
        ) {

            Alert.alert(
                'Saldo insuficiente',
                `${cuentaOrigen.nombre} solo tiene $${Number(
                    cuentaOrigen.saldo || 0
                ).toFixed(2)} disponible.`
            );

            return;
        }


        if (!usuarioActual) return;


        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );


        get(usuarioRef).then(
            (snapshot) => {

                if (snapshot.exists()) {

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


                    const movimientosRef =
                        ref(
                            db,
                            `parejas/${idPareja}/movimientos`
                        );


                    const nuevoMovimientoRef =
                        push(
                            movimientosRef
                        );


                    let nombreConcepto = '';


                    let datosMovimiento: any = {

                        tipo: 'gasto',

                        monto: montoNum,

                        fecha:
                            new Date().toISOString(),

                        autor:
                            userData.nombre ||
                            'Usuario',

                        categoria:
                            subCategoria,

                    };


                    // ------------------------------------
                    // PAGO DE DEUDA
                    // ------------------------------------

                    if (
                        tipoGasto === 'deuda'
                    ) {

                        const nombreEntidad =
                            deudaSeleccionada
                                ? deudaSeleccionada.entidad ||
                                deudaSeleccionada.nombre ||
                                'Deuda'
                                : '';

                        nombreConcepto =
                            `Pago Deuda (${subCategoria})${nombreEntidad
                                ? ' - ' +
                                nombreEntidad
                                : ''
                            }`;


                        datosMovimiento.deudaId =
                            deudaSeleccionada.id;


                        datosMovimiento.entidadDeuda =
                            nombreEntidad;

                    }


                    // ------------------------------------
                    // GASTO FIJO
                    // ------------------------------------

                    else {

                        const nombreFijo =
                            gastoFijoSeleccionado
                                ? gastoFijoSeleccionado.nombre ||
                                'Servicio'
                                : subCategoria;

                        nombreConcepto =
                            `Gasto Fijo (${subCategoria}) - ${nombreFijo}`;

                    }


                    datosMovimiento.descripcion =
                        descripcionDetalle.trim()
                            ? `${nombreConcepto}: ${descripcionDetalle.trim()}`
                            : nombreConcepto;


                    // ------------------------------------
                    // CUENTA ORIGEN
                    // ------------------------------------

                    datosMovimiento.cuentaOrigenId =
                        cuentaOrigen.id;

                    datosMovimiento.cuentaOrigenNombre =
                        cuentaOrigen.nombre;


                    const nuevoSaldoCuenta =
                        Number(
                            cuentaOrigen.saldo || 0
                        ) - montoNum;


                    // ------------------------------------
                    // MOVIMIENTO DE CUENTA
                    // ------------------------------------

                    const movimientoCuentaRef =
                        push(
                            ref(
                                db,
                                `parejas/${idPareja}/movimientosCuentas`
                            )
                        );


                    Promise.all([

                        set(
                            nuevoMovimientoRef,
                            datosMovimiento
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
                                tipo: 'pago_deuda',

                                cuentaOrigenId:
                                    cuentaOrigen.id,

                                cuentaOrigenNombre:
                                    cuentaOrigen.nombre,

                                monto: montoNum,

                                descripcion:
                                    datosMovimiento.descripcion,

                                fecha:
                                    datosMovimiento.fecha,

                                autor:
                                    datosMovimiento.autor,

                                deudaId:
                                    datosMovimiento.deudaId ||
                                    null,
                            }
                        ),

                    ])
                        .then(() => {

                            Alert.alert(
                                '¡Éxito!',
                                `Se registró el pago de $${montoNum.toFixed(
                                    2
                                )} y se descontó de ${cuentaOrigen.nombre}.`
                            );

                            navigation.goBack();

                        })
                        .catch(
                            (error) =>
                                Alert.alert(
                                    'Error',
                                    error.message
                                )
                        );

                }

            }
        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <View
            style={[
                styles.rootContainer,
                {
                    backgroundColor:
                        COLOR_MUY_SUAVE,
                },
            ]}
        >

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.container,
                    {
                        paddingTop:
                            insets.top + 10,
                    },
                ]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >


                {/* ==========================================
                    HEADER
                ========================================== */}

                <View style={styles.topHeader}>

                    <TouchableOpacity
                        style={[
                            styles.backButton,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                                borderColor:
                                    COLOR_SUAVE,
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                    >

                        <Ionicons
                            name="arrow-back"
                            size={20}
                            color={COLOR_PRINCIPAL}
                        />

                    </TouchableOpacity>


                    <Text
                        style={[
                            styles.topHeaderTitle,
                            {
                                color:
                                    COLOR_OSCURO,
                            },
                        ]}
                    >
                        Pago Detallado
                    </Text>


                    <View
                        style={{
                            width: 40,
                        }}
                    />

                </View>


                {/* ==========================================
                    HERO
                ========================================== */}

                <View
                    style={[
                        styles.heroCard,
                        {
                            backgroundColor:
                                '#FFFFFF',
                            borderColor:
                                COLOR_SUAVE,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.heroIconContainer,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                            },
                        ]}
                    >

                        <Ionicons
                            name="receipt-outline"
                            size={25}
                            color={COLOR_PRINCIPAL}
                        />

                    </View>


                    <View
                        style={
                            styles.heroTextContainer
                        }
                    >

                        <Text
                            style={[
                                styles.heroTitle,
                                {
                                    color:
                                        COLOR_OSCURO,
                                },
                            ]}
                        >
                            Control de Obligaciones
                        </Text>


                        <Text
                            style={
                                styles.heroSubtitle
                            }
                        >
                            Abona a tus deudas o servicios fijos de forma rápida
                        </Text>

                    </View>

                </View>


                {/* ==========================================
                    PASO 01
                ========================================== */}

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
                                    COLOR_PRINCIPAL,
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
                                    COLOR_OSCURO,
                            },
                        ]}
                    >
                        Seleccionar Categoría Principal
                    </Text>

                </View>


                {/* ==========================================
                    DEUDA / FIJO
                ========================================== */}

                <View
                    style={
                        styles.tipoContainer
                    }
                >

                    <TouchableOpacity
                        style={[
                            styles.tipoBtn,
                            {
                                borderColor:
                                    COLOR_SUAVE,
                            },
                            tipoGasto === 'deuda' &&
                            {
                                borderColor:
                                    COLOR_PRINCIPAL,
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                            },
                        ]}
                        onPress={() => {

                            setTipoGasto(
                                'deuda'
                            );

                            setSubCategoria(
                                'Tarjeta de Crédito'
                            );

                            setDeudaSeleccionada(
                                null
                            );

                            setGastoFijoSeleccionado(
                                null
                            );

                            setMontoPagar('');

                        }}
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="card-outline"
                            size={18}
                            color={
                                tipoGasto === 'deuda'
                                    ? COLOR_PRINCIPAL
                                    : '#7A817F'
                            }
                            style={{
                                marginRight: 6,
                            }}
                        />


                        <Text
                            style={[
                                styles.tipoBtnText,
                                tipoGasto === 'deuda' &&
                                {
                                    color:
                                        COLOR_PRINCIPAL,
                                    fontWeight:
                                        '800',
                                },
                            ]}
                        >
                            Pagar Deuda
                        </Text>

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={[
                            styles.tipoBtn,
                            {
                                borderColor:
                                    COLOR_SUAVE,
                            },
                            tipoGasto === 'fijo' &&
                            {
                                borderColor:
                                    COLOR_PRINCIPAL,
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                            },
                        ]}
                        onPress={() => {

                            setTipoGasto(
                                'fijo'
                            );

                            setSubCategoria(
                                'Luz'
                            );

                            setDeudaSeleccionada(
                                null
                            );

                            setGastoFijoSeleccionado(
                                null
                            );

                            setMontoPagar('');

                        }}
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="flash-outline"
                            size={18}
                            color={
                                tipoGasto === 'fijo'
                                    ? COLOR_PRINCIPAL
                                    : '#7A817F'
                            }
                            style={{
                                marginRight: 6,
                            }}
                        />


                        <Text
                            style={[
                                styles.tipoBtnText,
                                tipoGasto === 'fijo' &&
                                {
                                    color:
                                        COLOR_PRINCIPAL,
                                    fontWeight:
                                        '800',
                                },
                            ]}
                        >
                            Servicios / Fijos
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* ==========================================
                    PASO 02
                ========================================== */}

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
                                    COLOR_PRINCIPAL,
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
                                    COLOR_OSCURO,
                            },
                        ]}
                    >
                        Tipo de{' '}
                        {tipoGasto === 'deuda'
                            ? 'deuda'
                            : 'servicio'}
                    </Text>

                </View>


                {/* ==========================================
                    SUBCATEGORÍAS
                ========================================== */}

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.rowSub
                    }
                >

                    {(tipoGasto === 'deuda'
                        ? subCategoriasDeuda
                        : subCategoriasFijo
                    ).map(
                        (item) => (

                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.subBtn,
                                    {
                                        borderColor:
                                            COLOR_SUAVE,
                                    },
                                    subCategoria ===
                                        item &&
                                    {
                                        backgroundColor:
                                            COLOR_SUAVE,
                                        borderColor:
                                            COLOR_PRINCIPAL,
                                    },
                                ]}
                                onPress={() => {

                                    setSubCategoria(
                                        item
                                    );

                                    setDeudaSeleccionada(
                                        null
                                    );

                                    setGastoFijoSeleccionado(
                                        null
                                    );

                                    setMontoPagar('');

                                }}
                                activeOpacity={0.8}
                            >

                                <Text
                                    style={[
                                        styles.subText,
                                        subCategoria ===
                                            item &&
                                        {
                                            color:
                                                COLOR_PRINCIPAL,
                                            fontWeight:
                                                '800',
                                        },
                                    ]}
                                >
                                    {item}
                                </Text>

                            </TouchableOpacity>

                        )
                    )}

                </ScrollView>


                {/* ==========================================
                    DEUDAS
                ========================================== */}

                {tipoGasto === 'deuda' && (

                    <View
                        style={[
                            styles.seccionDeudasBox,
                            {
                                borderColor:
                                    COLOR_SUAVE,
                            },
                        ]}
                    >

                        <Text
                            style={[
                                styles.labelBox,
                                {
                                    color:
                                        COLOR_OSCURO,
                                },
                            ]}
                        >
                            Deudas de tipo "{subCategoria}":
                        </Text>


                        {deudasFiltradas.length === 0 ? (

                            <Text
                                style={
                                    styles.avisoTexto
                                }
                            >
                                No hay deudas registradas bajo esta categoría exacta.
                            </Text>

                        ) : (

                            deudasFiltradas.map(
                                (deuda) => {

                                    const nombreEntidad =
                                        deuda.nombreEntidad ||
                                        deuda.entidad ||
                                        deuda.nombre ||
                                        'Deuda sin nombre';

                                    const valorCuota =
                                        Number(
                                            deuda.cuotaPagar
                                        ) ||
                                        Number(
                                            deuda.valorCuota
                                        ) ||
                                        0;

                                    const saldoTotalRestante =
                                        Number(
                                            deuda.saldoRestante
                                        ) || 0;

                                    const totalCuotas =
                                        deuda.numeroCuotas ||
                                        1;

                                    const isSelected =
                                        deudaSeleccionada?.id ===
                                        deuda.id;

                                    return (

                                        <TouchableOpacity
                                            key={
                                                deuda.id
                                            }
                                            style={[
                                                styles.deudaItemCard,
                                                {
                                                    backgroundColor:
                                                        COLOR_MUY_SUAVE,
                                                    borderColor:
                                                        COLOR_SUAVE,
                                                },
                                                isSelected &&
                                                {
                                                    borderColor:
                                                        COLOR_PRINCIPAL,
                                                    backgroundColor:
                                                        COLOR_SUAVE,
                                                },
                                            ]}
                                            onPress={() => {

                                                setDeudaSeleccionada(
                                                    deuda
                                                );

                                                if (
                                                    valorCuota
                                                ) {

                                                    setMontoPagar(
                                                        valorCuota.toString()
                                                    );

                                                }

                                            }}
                                            activeOpacity={
                                                0.8
                                            }
                                        >

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >

                                                <Text
                                                    style={[
                                                        styles.deudaNombre,
                                                        {
                                                            color:
                                                                COLOR_OSCURO,
                                                        },
                                                    ]}
                                                >
                                                    {
                                                        nombreEntidad
                                                    }
                                                </Text>


                                                {deuda.esConsumoTarjeta && (

                                                    <Text
                                                        style={[
                                                            styles.deudaMonto,
                                                            {
                                                                color:
                                                                    COLOR_PRINCIPAL,
                                                            },
                                                        ]}
                                                    >
                                                        Consumido: $
                                                        {Number(
                                                            deuda.monto ||
                                                            0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </Text>

                                                )}


                                                <Text
                                                    style={[
                                                        styles.deudaMonto,
                                                        {
                                                            color:
                                                                COLOR_PRINCIPAL,
                                                        },
                                                    ]}
                                                >
                                                    Cuota: $
                                                    {valorCuota.toFixed(
                                                        2
                                                    )}{' '}
                                                    (
                                                    {
                                                        totalCuotas
                                                    }{' '}
                                                    cuotas)
                                                </Text>


                                                <Text
                                                    style={
                                                        styles.deudaTotalRestante
                                                    }
                                                >
                                                    Total a deber: $
                                                    {saldoTotalRestante.toFixed(
                                                        2
                                                    )}
                                                </Text>

                                            </View>


                                            {isSelected && (

                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={22}
                                                    color={
                                                        COLOR_PRINCIPAL
                                                    }
                                                />

                                            )}

                                        </TouchableOpacity>

                                    );

                                }
                            )

                        )}

                    </View>

                )}


                {/* ==========================================
                    GASTOS FIJOS
                ========================================== */}

                {tipoGasto === 'fijo' && (

                    <View
                        style={[
                            styles.seccionDeudasBox,
                            {
                                borderColor:
                                    COLOR_SUAVE,
                            },
                        ]}
                    >

                        <Text
                            style={[
                                styles.labelBox,
                                {
                                    color:
                                        COLOR_OSCURO,
                                },
                            ]}
                        >
                            Servicios fijos en "{subCategoria}":
                        </Text>


                        {fijosFiltrados.length === 0 ? (

                            <Text
                                style={
                                    styles.avisoTexto
                                }
                            >
                                No hay servicios fijos configurados en esta categoría.
                            </Text>

                        ) : (

                            fijosFiltrados.map(
                                (gasto) => {

                                    const isSelected =
                                        gastoFijoSeleccionado?.id ===
                                        gasto.id;

                                    const montoVal =
                                        Number(
                                            gasto.monto
                                        ) ||
                                        Number(
                                            gasto.montoEstimado
                                        ) ||
                                        0;

                                    return (

                                        <TouchableOpacity
                                            key={
                                                gasto.id
                                            }
                                            style={[
                                                styles.deudaItemCard,
                                                {
                                                    backgroundColor:
                                                        COLOR_MUY_SUAVE,
                                                    borderColor:
                                                        COLOR_SUAVE,
                                                },
                                                isSelected &&
                                                {
                                                    borderColor:
                                                        COLOR_PRINCIPAL,
                                                    backgroundColor:
                                                        COLOR_SUAVE,
                                                },
                                            ]}
                                            onPress={() => {

                                                setGastoFijoSeleccionado(
                                                    gasto
                                                );

                                                if (
                                                    montoVal
                                                ) {

                                                    setMontoPagar(
                                                        montoVal.toString()
                                                    );

                                                }

                                            }}
                                            activeOpacity={
                                                0.8
                                            }
                                        >

                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >

                                                <Text
                                                    style={[
                                                        styles.deudaNombre,
                                                        {
                                                            color:
                                                                COLOR_OSCURO,
                                                        },
                                                    ]}
                                                >
                                                    {
                                                        gasto.nombre ||
                                                        'Servicio sin nombre'
                                                    }
                                                </Text>


                                                <Text
                                                    style={[
                                                        styles.deudaMonto,
                                                        {
                                                            color:
                                                                COLOR_PRINCIPAL,
                                                        },
                                                    ]}
                                                >
                                                    Monto: $
                                                    {montoVal.toFixed(
                                                        2
                                                    )}
                                                </Text>

                                            </View>


                                            {isSelected && (

                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={22}
                                                    color={
                                                        COLOR_PRINCIPAL
                                                    }
                                                />

                                            )}

                                        </TouchableOpacity>

                                    );

                                }
                            )

                        )}

                    </View>

                )}


                {/* ==========================================
                    FORMULARIO
                ========================================== */}

                <View
                    style={[
                        styles.formCard,
                        {
                            borderColor:
                                COLOR_SUAVE,
                        },
                    ]}
                >

                    <Text
                        style={[
                            styles.formCardTitle,
                            {
                                color:
                                    COLOR_OSCURO,
                            },
                        ]}
                    >
                        Detalles del Pago
                    </Text>


                    {/* CUENTA */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        ¿De qué cuenta sale el dinero?
                    </Text>


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
                                No tienes cuentas creadas. Toca aquí para crear una (banco o efectivo).
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

                                    const seleccionada =
                                        cuentaOrigenId ===
                                        cuenta.id;

                                    return (

                                        <TouchableOpacity
                                            key={
                                                cuenta.id
                                            }
                                            style={[
                                                styles.cuentaChip,
                                                {
                                                    backgroundColor:
                                                        COLOR_MUY_SUAVE,
                                                    borderColor:
                                                        COLOR_SUAVE,
                                                },
                                                seleccionada &&
                                                {
                                                    backgroundColor:
                                                        COLOR_PRINCIPAL,
                                                    borderColor:
                                                        COLOR_PRINCIPAL,
                                                },
                                            ]}
                                            onPress={() =>
                                                setCuentaOrigenId(
                                                    cuenta.id
                                                )
                                            }
                                        >

                                            <Ionicons
                                                name={
                                                    cuenta.tipo ===
                                                        'efectivo'
                                                        ? 'cash-outline'
                                                        : 'card-outline'
                                                }
                                                size={14}
                                                color={
                                                    seleccionada
                                                        ? '#FFFFFF'
                                                        : COLOR_PRINCIPAL
                                                }
                                                style={{
                                                    marginRight: 6,
                                                }}
                                            />


                                            <Text
                                                style={[
                                                    styles.cuentaChipText,
                                                    {
                                                        color:
                                                            COLOR_PRINCIPAL,
                                                    },
                                                    seleccionada &&
                                                    {
                                                        color:
                                                            '#FFFFFF',
                                                    },
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

                        </View>

                    )}


                    {/* MONTO */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Monto a pagar / abonar ($)
                    </Text>


                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                                borderColor:
                                    COLOR_SUAVE,
                                color:
                                    COLOR_OSCURO,
                            },
                        ]}
                        placeholder="Ej. 45.00"
                        placeholderTextColor={
                            '#7A817F'
                        }
                        keyboardType="numeric"
                        value={
                            montoPagar
                        }
                        onChangeText={
                            setMontoPagar
                        }
                    />


                    {/* DESCRIPCIÓN */}

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Descripción o Nota adicional (Opcional)
                    </Text>


                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                                borderColor:
                                    COLOR_SUAVE,
                                color:
                                    COLOR_OSCURO,
                            },
                        ]}
                        placeholder="Ej. Pago del mes"
                        placeholderTextColor={
                            '#7A817F'
                        }
                        value={
                            descripcionDetalle
                        }
                        onChangeText={
                            setDescripcionDetalle
                        }
                    />


                    {/* GUARDAR */}

                    <TouchableOpacity
                        style={[
                            styles.btnGuardar,
                            {
                                backgroundColor:
                                    COLOR_PRINCIPAL,
                            },
                        ]}
                        onPress={
                            guardarPagoDetallado
                        }
                        activeOpacity={0.85}
                    >

                        <Ionicons
                            name="save-outline"
                            size={18}
                            color="#FFFFFF"
                            style={{
                                marginRight: 7,
                            }}
                        />


                        <Text
                            style={
                                styles.btnGuardarText
                            }
                        >
                            Registrar Pago y Descontar
                        </Text>

                    </TouchableOpacity>


                    {/* VOLVER */}

                    <TouchableOpacity
                        style={[
                            styles.btnVolver,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                                borderColor:
                                    COLOR_SUAVE,
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={0.85}
                    >

                        <Text
                            style={[
                                styles.btnVolverText,
                                {
                                    color:
                                        COLOR_PRINCIPAL,
                                },
                            ]}
                        >
                            Cancelar / Volver
                        </Text>

                    </TouchableOpacity>

                </View>

            </ScrollView>

        </View>
    );
}


// ============================================================
// ESTILOS FIJOS
// LOS COLORES DINÁMICOS SE APLICAN ARRIBA
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
        paddingTop: 10,
        paddingBottom: 40,
    },

    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },

    topHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
    },

    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
    },

    heroIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },

    heroTextContainer: {
        flex: 1,
    },

    heroTitle: {
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 3,
    },

    heroSubtitle: {
        color: '#7A817F',
        fontSize: 12,
        lineHeight: 16,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 6,
    },

    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },

    stepBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
    },

    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },

    tipoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },

    tipoBtn: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 15,
        borderWidth: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },

    tipoBtnText: {
        color: '#7A817F',
        fontWeight: '600',
        fontSize: 13,
    },

    rowSub: {
        paddingVertical: 4,
        paddingRight: 10,
        marginBottom: 16,
    },

    subBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
    },

    subText: {
        color: '#7A817F',
        fontSize: 12,
        fontWeight: '600',
    },

    seccionDeudasBox: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
        marginBottom: 20,
    },

    labelBox: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 12,
    },

    avisoTexto: {
        color: '#A16B25',
        fontSize: 13,
        lineHeight: 18,
        fontStyle: 'italic',
        paddingVertical: 5,
    },

    deudaItemCard: {
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },

    deudaNombre: {
        fontWeight: '800',
        fontSize: 14,
        marginBottom: 3,
    },

    deudaMonto: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
    },

    deudaTotalRestante: {
        color: '#A16B25',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
    },

    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        marginBottom: 20,
    },

    formCardTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 10,
    },

    label: {
        color: '#171A19',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 12,
    },

    input: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 13,
    },

    cuentasChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    cuentaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
    },

    cuentaChipText: {
        fontSize: 12,
        fontWeight: '700',
    },

    avisoSinCuentas: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F3ED',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E8D9C8',
    },

    avisoSinCuentasText: {
        color: '#8A6748',
        fontSize: 12,
        marginLeft: 8,
        flex: 1,
    },

    btnGuardar: {
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },

    btnGuardarText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 14,
    },

    btnVolver: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
        borderRadius: 14,
        borderWidth: 1,
    },

    btnVolverText: {
        fontWeight: '700',
        fontSize: 13,
    },

});