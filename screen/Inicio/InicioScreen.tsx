import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';

import React, { useEffect, useState } from 'react';

import { auth, db } from '../../firebase/FirebaseConfig';

import { ref, onValue } from 'firebase/database';

import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';

export default function InicioScreen({ navigation }: any) {

    // ============================================================
    // TEMA
    // ============================================================

    const { colors } = useTheme();

    const COLOR_PRINCIPAL = colors.primary;
    const COLOR_OSCURO = colors.dark;
    const COLOR_SUAVE = colors.light;
    const COLOR_MUY_SUAVE = colors.veryLight;

    const COLOR_VERDE = colors.primary;
    const COLOR_ROJO = '#B85C5C';

    // ============================================================
    // USUARIO
    // ============================================================

    const usuarioActual = auth.currentUser;

    const [idPareja, setIdPareja] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [totalIngresos, setTotalIngresos] =
        useState(0);

    const [totalGastos, setTotalGastos] =
        useState(0);

    const [totalDeudas, setTotalDeudas] =
        useState(0);

    const [cuentas, setCuentas] =
        useState<any[]>([]);

    const [movimientos, setMovimientos] =
        useState<any[]>([]);

    // ============================================================
    // PERFIL
    // ============================================================

    const [nombreCuenta, setNombreCuenta] =
        useState<string>('');

    const [fotoCuenta, setFotoCuenta] =
        useState<string | null>(null);

    // ============================================================
    // CONFIGURACIÓN HEADER
    // ============================================================

    useEffect(() => {

        navigation.setOptions({
            headerShown: false,
        });

    }, [navigation]);

    // ============================================================
    // OBTENER USUARIO + PAREJA + PERFIL
    // ============================================================

    useEffect(() => {

        const uid = auth.currentUser?.uid;

        if (!uid) {

            setLoading(false);

            return;
        }

        const userRef = ref(
            db,
            `usuarios/${uid}`
        );

        const unsubscribe = onValue(
            userRef,
            (snapshot) => {

                const data = snapshot.val();

                const nombreRegistrado =
                    data?.nombre ||
                    data?.nombreCompleto ||
                    data?.displayName ||
                    auth.currentUser?.displayName ||
                    auth.currentUser?.email?.split('@')[0] ||
                    'Usuario';

                setNombreCuenta(
                    String(nombreRegistrado)
                );

                setFotoCuenta(
                    data?.foto ||
                    auth.currentUser?.photoURL ||
                    null
                );

                if (data?.idPareja) {

                    setIdPareja(
                        String(data.idPareja)
                    );

                } else {

                    setIdPareja(null);

                    setLoading(false);
                }
            }
        );

        return () => {

            unsubscribe();

        };

    }, []);

    // ============================================================
    // CARGAR DATOS DE FIREBASE
    // ============================================================

    useEffect(() => {

        if (!idPareja) {
            return;
        }

        setLoading(true);

        const movimientosRef = ref(
            db,
            `parejas/${idPareja}/movimientos`
        );

        const ingresosRef = ref(
            db,
            `parejas/${idPareja}/ingresos`
        );

        const deudasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        const cuentasRef = ref(
            db,
            `parejas/${idPareja}/cuentas`
        );

        let movimientosData: any = null;
        let ingresosData: any = null;
        let deudasData: any = null;

        let movimientosCargados = false;
        let ingresosCargados = false;
        let deudasCargadas = false;
        let cuentasCargadas = false;

        // ========================================================
        // PROCESAR TODO
        // ========================================================

        const procesarDatos = () => {

            let listaMovimientos: any[] = [];

            let ingresosAcc = 0;
            let gastosAcc = 0;
            let deudasAcc = 0;

            // ====================================================
            // MOVIMIENTOS
            // ====================================================

            if (
                movimientosData &&
                typeof movimientosData === 'object'
            ) {

                const listaMovimientosFirebase =
                    Object.keys(movimientosData)
                        .map((key) => {

                            const movimiento =
                                movimientosData[key];

                            return {
                                id: key,
                                ...movimiento,
                            };

                        });

                listaMovimientosFirebase.forEach(
                    (item) => {

                        const monto =
                            Number(item?.monto) || 0;

                        if (
                            item?.tipo === 'ingreso'
                        ) {

                            ingresosAcc += monto;

                        }

                        if (
                            item?.tipo === 'gasto' ||
                            item?.tipo === 'gastos'
                        ) {

                            gastosAcc += monto;

                        }

                    }
                );

                listaMovimientos = [
                    ...listaMovimientos,
                    ...listaMovimientosFirebase,
                ];
            }

            // ====================================================
            // INGRESOS
            // ====================================================

            if (
                ingresosData &&
                typeof ingresosData === 'object'
            ) {

                const listaIngresos =
                    Object.keys(ingresosData)
                        .map((key) => {

                            const ingreso =
                                ingresosData[key];

                            return {
                                id: `ingreso-${key}`,
                                ...ingreso,
                                tipo: 'ingreso',
                            };

                        });

                listaIngresos.forEach(
                    (item) => {

                        const yaExisteEnMovimientos =
                            listaMovimientos.some(
                                (mov) => {

                                    if (
                                        mov.id ===
                                        item.id
                                    ) {

                                        return true;
                                    }

                                    if (
                                        mov.ingresoId &&
                                        item.id ===
                                        `ingreso-${mov.ingresoId}`
                                    ) {

                                        return true;
                                    }

                                    if (
                                        item.idOriginal &&
                                        mov.id ===
                                        item.idOriginal
                                    ) {

                                        return true;
                                    }

                                    return false;
                                }
                            );

                        if (!yaExisteEnMovimientos) {

                            ingresosAcc +=
                                Number(item?.monto) || 0;

                        }

                    }
                );

                listaMovimientos = [
                    ...listaMovimientos,
                    ...listaIngresos,
                ];
            }

            // ====================================================
            // DEUDAS
            // ====================================================

            if (
                deudasData &&
                typeof deudasData === 'object'
            ) {

                const listaDeudas =
                    Object.keys(deudasData)
                        .map((key) => {

                            const deuda =
                                deudasData[key];

                            // ====================================
                            // TARJETA REGISTRADA
                            // ====================================

                            if (
                                deuda?.tipo === 'tarjeta'
                            ) {

                                return {

                                    id:
                                        `tarjeta-${key}`,

                                    ...deuda,

                                    tipo: 'tarjeta',

                                    esTarjeta: true,

                                    esDeuda: false,

                                    monto: 0,

                                    descripcion:
                                        `${deuda?.marcaTarjeta ||
                                            'Tarjeta'} - ${deuda?.entidad ||
                                            'Banco'
                                        }`,
                                };
                            }

                            // ====================================
                            // CONSUMO TARJETA
                            // ====================================

                            if (
                                deuda?.tipo ===
                                'consumoTarjeta'
                            ) {

                                const montoConsumo =
                                    Number(
                                        deuda?.monto
                                    ) || 0;

                                deudasAcc +=
                                    montoConsumo;

                                return {

                                    id:
                                        `consumo-${key}`,

                                    ...deuda,

                                    tipo:
                                        'consumoTarjeta',

                                    esTarjeta: true,

                                    esDeuda: true,

                                    monto:
                                        montoConsumo,

                                    descripcion:
                                        deuda?.descripcion &&
                                        deuda.descripcion !==
                                        'N/A'
                                            ? deuda.descripcion
                                            : `Consumo ${deuda?.tarjetaMarca ||
                                                'Tarjeta'
                                            } - ${deuda?.tarjetaBanco ||
                                                ''
                                            }`,
                                };
                            }

                            // ====================================
                            // DEUDA NORMAL
                            // ====================================

                            if (
                                deuda?.tipo === 'deuda'
                            ) {

                                const montoOriginal =
                                    Number(
                                        deuda?.monto
                                    ) || 0;

                                const pagosAsociados =
                                    listaMovimientos.filter(
                                        (mov) => {

                                            if (
                                                mov?.deudaId &&
                                                mov.deudaId ===
                                                key
                                            ) {

                                                return true;
                                            }

                                            const descripcionMovimiento =
                                                String(
                                                    mov?.descripcion ||
                                                    mov?.entidadDeuda ||
                                                    ''
                                                ).toLowerCase();

                                            const entidadDeuda =
                                                String(
                                                    deuda?.entidad ||
                                                    ''
                                                ).toLowerCase();

                                            const categoriaMovimiento =
                                                String(
                                                    mov?.categoria ||
                                                    ''
                                                ).toLowerCase();

                                            const categoriaDeuda =
                                                String(
                                                    deuda?.categoria ||
                                                    ''
                                                ).toLowerCase();

                                            const esPago =
                                                String(
                                                    mov?.tipo ||
                                                    ''
                                                )
                                                    .toLowerCase()
                                                    .includes(
                                                        'pago'
                                                    );

                                            return (

                                                (
                                                    entidadDeuda &&
                                                    descripcionMovimiento.includes(
                                                        entidadDeuda
                                                    )
                                                ) ||

                                                (
                                                    categoriaDeuda &&
                                                    categoriaMovimiento ===
                                                    categoriaDeuda &&
                                                    esPago
                                                )

                                            );
                                        }
                                    );

                                const totalPagado =
                                    pagosAsociados.reduce(
                                        (
                                            total,
                                            movimiento
                                        ) => {

                                            return (
                                                total +
                                                (
                                                    Number(
                                                        movimiento?.monto
                                                    ) || 0
                                                )
                                            );

                                        },
                                        0
                                    );

                                const saldoPendiente =
                                    Math.max(
                                        0,
                                        montoOriginal -
                                        totalPagado
                                    );

                                deudasAcc +=
                                    saldoPendiente;

                                return {

                                    id:
                                        `deuda-${key}`,

                                    deudaId:
                                        key,

                                    ...deuda,

                                    tipo:
                                        'deuda',

                                    esDeuda: true,

                                    esTarjeta: false,

                                    monto:
                                        saldoPendiente,

                                    montoRestante:
                                        saldoPendiente,

                                    descripcion:
                                        deuda?.descripcion ||
                                        `${deuda?.categoria ||
                                            'Deuda'
                                        } - ${deuda?.entidad ||
                                            ''
                                        }`,
                                };
                            }

                            // ====================================
                            // OTRO
                            // ====================================

                            return {

                                id:
                                    `otro-${key}`,

                                ...deuda,

                                tipo:
                                    deuda?.tipo ||
                                    'otro',
                            };

                        });

                const deudasParaActividad =
                    listaDeudas.filter(
                        (item) =>
                            item?.tipo !== 'tarjeta'
                    );

                listaMovimientos = [
                    ...listaMovimientos,
                    ...deudasParaActividad,
                ];
            }

            // ====================================================
            // ORDENAR ACTIVIDAD
            // ====================================================

            listaMovimientos.sort(
                (a, b) => {

                    const fechaA =
                        new Date(
                            a?.fechaRegistro ||
                            a?.fecha ||
                            a?.createdAt ||
                            0
                        ).getTime();

                    const fechaB =
                        new Date(
                            b?.fechaRegistro ||
                            b?.fecha ||
                            b?.createdAt ||
                            0
                        ).getTime();

                    return fechaB - fechaA;
                }
            );

            // ====================================================
            // ACTUALIZAR ESTADOS
            // ====================================================

            setTotalIngresos(
                Number(ingresosAcc) || 0
            );

            setTotalGastos(
                Number(gastosAcc) || 0
            );

            setTotalDeudas(
                Number(deudasAcc) || 0
            );

            setMovimientos(
                listaMovimientos
            );

            if (
                movimientosCargados &&
                ingresosCargados &&
                deudasCargadas &&
                cuentasCargadas
            ) {

                setLoading(false);

            }

        };

        // ========================================================
        // MOVIMIENTOS
        // ========================================================

        const unsubscribeMovimientos =
            onValue(
                movimientosRef,
                (snapshot) => {

                    movimientosData =
                        snapshot.val();

                    movimientosCargados = true;

                    procesarDatos();
                }
            );

        // ========================================================
        // INGRESOS
        // ========================================================

        const unsubscribeIngresos =
            onValue(
                ingresosRef,
                (snapshot) => {

                    ingresosData =
                        snapshot.val();

                    ingresosCargados = true;

                    procesarDatos();
                }
            );

        // ========================================================
        // DEUDAS
        // ========================================================

        const unsubscribeDeudas =
            onValue(
                deudasRef,
                (snapshot) => {

                    deudasData =
                        snapshot.val();

                    deudasCargadas = true;

                    procesarDatos();
                }
            );

        // ========================================================
        // CUENTAS
        // ========================================================

        const unsubscribeCuentas =
            onValue(
                cuentasRef,
                (snapshot) => {

                    const data =
                        snapshot.val();

                    const lista =
                        data &&
                        typeof data === 'object'
                            ? Object.keys(data)
                                .map((key) => {

                                    return {

                                        id: key,

                                        ...data[key],

                                    };

                                })
                            : [];

                    setCuentas(lista);

                    cuentasCargadas = true;

                    procesarDatos();

                }
            );

        // ========================================================
        // CLEANUP
        // ========================================================

        return () => {

            unsubscribeMovimientos();

            unsubscribeIngresos();

            unsubscribeDeudas();

            unsubscribeCuentas();

        };

    }, [idPareja]);

    // ============================================================
    // CUENTAS
    // ============================================================

    const totalEnBancos =
        cuentas
            .filter(
                (c) =>
                    c?.tipo === 'banco'
            )
            .reduce(
                (acc, c) =>
                    acc +
                    (
                        Number(
                            c?.saldo
                        ) || 0
                    ),
                0
            );

    const totalEnEfectivo =
        cuentas
            .filter(
                (c) =>
                    c?.tipo === 'efectivo'
            )
            .reduce(
                (acc, c) =>
                    acc +
                    (
                        Number(
                            c?.saldo
                        ) || 0
                    ),
                0
            );

    const totalEnCuentas =
        cuentas.reduce(
            (acc, c) =>
                acc +
                (
                    Number(
                        c?.saldo
                    ) || 0
                ),
            0
        );

    // ============================================================
    // BALANCE NETO
    // ============================================================

    const balanceNeto =
        totalEnCuentas;

    // ============================================================
    // INICIALES
    // ============================================================

    const iniciales =
        nombreCuenta
            .trim()
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(
                (palabra) =>
                    palabra[0]?.toUpperCase()
            )
            .join('') || 'U';

    // ============================================================
    // RETURN
    // ============================================================

    return (

        <View style={styles.root}>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={
                    false
                }
            >

                {/* HEADER */}

                <View style={styles.header}>

                    <View
                        style={[
                            styles.avatarContainer,
                            {
                                backgroundColor:
                                    COLOR_PRINCIPAL,
                            },
                        ]}
                    >

                        {fotoCuenta ? (

                            <Image
                                source={{
                                    uri: fotoCuenta,
                                }}
                                style={
                                    styles.avatarImage
                                }
                            />

                        ) : (

                            <Text
                                style={
                                    styles.avatarIniciales
                                }
                            >
                                {iniciales}
                            </Text>

                        )}

                    </View>

                    <View
                        style={
                            styles.headerInfo
                        }
                    >

                        <Text
                            style={
                                styles.welcomeText
                            }
                        >
                            Hola,
                        </Text>

                        <Text
                            style={
                                styles.nameText
                            }
                        >
                            {nombreCuenta ||
                                'Usuario'}
                        </Text>

                    </View>

                    <View
                        style={[
                            styles.headerSyncPill,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                            },
                        ]}
                    >

                        <View
                            style={[
                                styles.onlineDot,
                                {
                                    backgroundColor:
                                        COLOR_VERDE,
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.onlineText,
                                {
                                    color:
                                        COLOR_OSCURO,
                                },
                            ]}
                        >
                            Sincronizado
                        </Text>

                    </View>

                </View>

                {/* BALANCE */}

                <View
                    style={[
                        styles.mainDashboardCard,
                        {
                            backgroundColor:
                                COLOR_PRINCIPAL,
                        },
                    ]}
                >

                    <View
                        style={
                            styles.balanceTopRow
                        }
                    >

                        <Text
                            style={
                                styles.mainCardTitle
                            }
                        >
                            BALANCE NETO
                        </Text>

                        <View
                            style={[
                                styles.balanceStatusChip,
                                balanceNeto < 0 &&
                                    styles.balanceStatusChipNegativo,
                            ]}
                        >

                            <Ionicons
                                name={
                                    balanceNeto >= 0
                                        ? 'trending-up'
                                        : 'trending-down'
                                }
                                size={12}
                                color="#FFFFFF"
                            />

                        </View>

                    </View>

                    <Text
                        style={
                            styles.mainCardAmount
                        }
                    >
                        $
                        {balanceNeto.toFixed(2)}
                    </Text>

                    <Text
                        style={
                            styles.mainCardSubtitle
                        }
                    >
                        {balanceNeto >= 0
                            ? 'Dinero disponible actualmente'
                            : 'Tu saldo disponible es negativo'}
                    </Text>

                    <View
                        style={
                            styles.balanceDivider
                        }
                    />

                    <View
                        style={
                            styles.balanceMiniRow
                        }
                    >

                        <View
                            style={
                                styles.balanceMiniItem
                            }
                        >

                            <Text
                                style={
                                    styles.balanceMiniLabel
                                }
                            >
                                Ingresos
                            </Text>

                            <Text
                                style={
                                    styles.balanceMiniValueIngreso
                                }
                            >
                                $
                                {totalIngresos.toFixed(
                                    2
                                )}
                            </Text>

                        </View>

                        <View
                            style={
                                styles.balanceMiniSeparator
                            }
                        />

                        <View
                            style={
                                styles.balanceMiniItem
                            }
                        >

                            <Text
                                style={
                                    styles.balanceMiniLabel
                                }
                            >
                                Gastos
                            </Text>

                            <Text
                                style={
                                    styles.balanceMiniValueGasto
                                }
                            >
                                $
                                {totalGastos.toFixed(
                                    2
                                )}
                            </Text>

                        </View>

                        <View
                            style={
                                styles.balanceMiniSeparator
                            }
                        />

                        <View
                            style={
                                styles.balanceMiniItem
                            }
                        >

                            <Text
                                style={
                                    styles.balanceMiniLabel
                                }
                            >
                                Deudas
                            </Text>

                            <Text
                                style={
                                    styles.balanceMiniValueDeuda
                                }
                            >
                                $
                                {totalDeudas.toFixed(
                                    2
                                )}
                            </Text>

                        </View>

                    </View>

                </View>

                {/* MIS CUENTAS */}

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={
                        styles.cuentasCard
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

                    <View
                        style={
                            styles.cuentasCardHeader
                        }
                    >

                        <Text
                            style={
                                styles.cuentasCardTitle
                            }
                        >
                            Mis Cuentas
                        </Text>

                        <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#64748B"
                        />

                    </View>

                    {cuentas.length === 0 ? (

                        <Text
                            style={
                                styles.cuentasCardVacio
                            }
                        >
                            Aún no tienes cuentas
                            creadas. Toca aquí
                            para agregar tu
                            banco o efectivo.
                        </Text>

                    ) : (

                        <>

                            <Text
                                style={[
                                    styles.cuentasCardTotal,
                                    {
                                        color:
                                            COLOR_PRINCIPAL,
                                    },
                                ]}
                            >
                                $
                                {totalEnCuentas.toFixed(
                                    2
                                )}
                            </Text>

                            <View
                                style={
                                    styles.cuentasMiniRow
                                }
                            >

                                <View
                                    style={
                                        styles.cuentasMiniItem
                                    }
                                >

                                    <Ionicons
                                        name="card-outline"
                                        size={14}
                                        color={
                                            COLOR_PRINCIPAL
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.cuentasMiniLabel
                                        }
                                    >
                                        Banco
                                    </Text>

                                    <Text
                                        style={
                                            styles.cuentasMiniValor
                                        }
                                    >
                                        $
                                        {totalEnBancos.toFixed(
                                            2
                                        )}
                                    </Text>

                                </View>

                                <View
                                    style={
                                        styles.cuentasMiniSeparator
                                    }
                                />

                                <View
                                    style={
                                        styles.cuentasMiniItem
                                    }
                                >

                                    <Ionicons
                                        name="cash-outline"
                                        size={14}
                                        color={
                                            COLOR_PRINCIPAL
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.cuentasMiniLabel
                                        }
                                    >
                                        Efectivo
                                    </Text>

                                    <Text
                                        style={
                                            styles.cuentasMiniValor
                                        }
                                    >
                                        $
                                        {totalEnEfectivo.toFixed(
                                            2
                                        )}
                                    </Text>

                                </View>

                            </View>

                        </>

                    )}

                </TouchableOpacity>

                {/* ACCIONES */}

                <Text
                    style={
                        styles.quickTitle
                    }
                >
                    Acciones rápidas
                </Text>

                <View
                    style={
                        styles.actionButtonsRow
                    }
                >

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={
                            styles.actionButton
                        }
                        onPress={() =>
                            navigation.navigate(
                                'gastosRapidos'
                            )
                        }
                    >

                        <View
                            style={[
                                styles.actionIconContainer,
                                {
                                    backgroundColor:
                                        '#F8EEEE',
                                },
                            ]}
                        >

                            <Ionicons
                                name="flash-outline"
                                size={19}
                                color={COLOR_ROJO}
                            />

                        </View>

                        <Text
                            style={
                                styles.actionButtonText
                            }
                        >
                            Gastos
                        </Text>

                        <Text
                            style={
                                styles.actionButtonSmallText
                            }
                        >
                            Rápidos
                        </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={
                            styles.actionButton
                        }
                        onPress={() =>
                            navigation.navigate(
                                'Registros'
                            )
                        }
                    >

                        <View
                            style={[
                                styles.actionIconContainer,
                                {
                                    backgroundColor:
                                        COLOR_SUAVE,
                                },
                            ]}
                        >

                            <Ionicons
                                name="document-text-outline"
                                size={19}
                                color={
                                    COLOR_PRINCIPAL
                                }
                            />

                        </View>

                        <Text
                            style={
                                styles.actionButtonText
                            }
                        >
                            Registros
                        </Text>

                        <Text
                            style={
                                styles.actionButtonSmallText
                            }
                        >
                            Movimientos
                        </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={
                            styles.actionButton
                        }
                        onPress={() =>
                            navigation.navigate(
                                'deudas'
                            )
                        }
                    >

                        <View
                            style={[
                                styles.actionIconContainer,
                                {
                                    backgroundColor:
                                        COLOR_MUY_SUAVE,
                                },
                            ]}
                        >

                            <Ionicons
                                name="card-outline"
                                size={19}
                                color={
                                    COLOR_VERDE
                                }
                            />

                        </View>

                        <Text
                            style={
                                styles.actionButtonText
                            }
                        >
                            Deudas
                        </Text>

                        <Text
                            style={
                                styles.actionButtonSmallText
                            }
                        >
                            Obligaciones
                        </Text>

                    </TouchableOpacity>

                </View>

                {/* ACTIVIDAD */}

                <View
                    style={
                        styles.activityHeader
                    }
                >

                    <View
                        style={
                            styles.activityInfo
                        }
                    >

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Actividad reciente
                        </Text>

                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Últimos movimientos de
                            la pareja
                        </Text>

                    </View>

                    <View
                        style={[
                            styles.activityCount,
                            {
                                backgroundColor:
                                    COLOR_MUY_SUAVE,
                            },
                        ]}
                    >

                        <Text
                            style={[
                                styles.activityCountText,
                                {
                                    color:
                                        COLOR_PRINCIPAL,
                                },
                            ]}
                        >
                            {movimientos.length}
                        </Text>

                    </View>

                </View>

                {/* LOADING */}

                {loading ? (

                    <View
                        style={
                            styles.loadingCard
                        }
                    >

                        <ActivityIndicator
                            size="large"
                            color={
                                COLOR_PRINCIPAL
                            }
                        />

                        <Text
                            style={
                                styles.loadingText
                            }
                        >
                            Sincronizando
                            información...
                        </Text>

                    </View>

                ) : movimientos.length === 0 ? (

                    <View
                        style={
                            styles.emptyCard
                        }
                    >

                        <View
                            style={[
                                styles.emptyIcon,
                                {
                                    backgroundColor:
                                        COLOR_MUY_SUAVE,
                                },
                            ]}
                        >

                            <Ionicons
                                name="wallet-outline"
                                size={26}
                                color={
                                    COLOR_PRINCIPAL
                                }
                            />

                        </View>

                        <Text
                            style={
                                styles.emptyTitle
                            }
                        >
                            Aún no hay
                            movimientos
                        </Text>

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Empieza registrando
                            tus ingresos, gastos
                            o deudas.
                        </Text>

                    </View>

                ) : (

                    movimientos.map(
                        (item) => {

                            const esIngreso =
                                item?.tipo ===
                                'ingreso';

                            const esDeuda =
                                item?.tipo ===
                                    'deuda' ||
                                item?.tipo ===
                                    'consumoTarjeta';

                            const esConsumoTarjeta =
                                item?.tipo ===
                                'consumoTarjeta';

                            return (

                                <View
                                    key={
                                        item?.id
                                    }
                                    style={
                                        styles.transactionItem
                                    }
                                >

                                    <View
                                        style={[
                                            styles.transactionIcon,

                                            esIngreso
                                                ? styles.transactionIncome
                                                : esDeuda
                                                    ? styles.transactionDebt
                                                    : styles.transactionExpense,
                                        ]}
                                    >

                                        <Ionicons
                                            name={
                                                esIngreso
                                                    ? 'arrow-up'
                                                    : esDeuda
                                                        ? 'card-outline'
                                                        : 'arrow-down'
                                            }
                                            size={18}
                                            color={
                                                esIngreso
                                                    ? COLOR_VERDE
                                                    : esDeuda
                                                        ? COLOR_PRINCIPAL
                                                        : COLOR_ROJO
                                            }
                                        />

                                    </View>

                                    <View
                                        style={
                                            styles.transactionInfo
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.transactionTitle
                                            }
                                            numberOfLines={
                                                2
                                            }
                                        >
                                            {
                                                item?.descripcion ||
                                                'Movimiento'
                                            }
                                        </Text>

                                        {esConsumoTarjeta && (

                                            <Text
                                                style={
                                                    styles.cardDetailText
                                                }
                                            >
                                                {
                                                    item?.tarjetaMarca ||
                                                    'Tarjeta'
                                                }
                                                {' '}
                                                ·{' '}
                                                {
                                                    item?.tarjetaBanco ||
                                                    ''
                                                }
                                            </Text>

                                        )}

                                        {esConsumoTarjeta &&
                                            item?.diferido ===
                                            true && (

                                                <Text
                                                    style={
                                                        styles.subDetailText
                                                    }
                                                >
                                                    Diferido a{' '}
                                                    {
                                                        item?.numeroCuotas
                                                    }{' '}
                                                    cuotas
                                                </Text>

                                            )}

                                        {esConsumoTarjeta &&
                                            Number(
                                                item?.cuotaPagar
                                            ) > 0 && (

                                                <Text
                                                    style={
                                                        styles.cuotaText
                                                    }
                                                >
                                                    Cuota: $
                                                    {Number(
                                                        item?.cuotaPagar
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </Text>

                                            )}

                                        {item?.tipo ===
                                            'deuda' &&
                                            Number(
                                                item?.cuotaPagar
                                            ) > 0 && (

                                                <Text
                                                    style={
                                                        styles.cuotaText
                                                    }
                                                >
                                                    Cuota: $
                                                    {Number(
                                                        item?.cuotaPagar
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </Text>

                                            )}

                                        <Text
                                            style={
                                                styles.transactionAuthor
                                            }
                                        >
                                            Registrado por:{' '}
                                            {
                                                item?.autor ||
                                                'Usuario'
                                            }
                                        </Text>

                                    </View>

                                    <View
                                        style={
                                            styles.amountContainer
                                        }
                                    >

                                        <Text
                                            style={[
                                                styles.transactionAmount,

                                                esIngreso
                                                    ? styles.textGreen
                                                    : esDeuda
                                                        ? styles.textTeal
                                                        : styles.textRed,
                                            ]}
                                        >

                                            {esIngreso
                                                ? `+$${Number(
                                                    item?.monto
                                                ).toFixed(
                                                    2
                                                )}`
                                                : esDeuda
                                                    ? `$${Number(
                                                        item?.monto
                                                    ).toFixed(
                                                        2
                                                    )}`
                                                    : `-$${Number(
                                                        item?.monto
                                                    ).toFixed(
                                                        2
                                                    )}`}

                                        </Text>

                                        <Text
                                            style={
                                                styles.amountLabel
                                            }
                                        >
                                            {esIngreso
                                                ? 'Ingreso'
                                                : esDeuda
                                                    ? 'Deuda'
                                                    : 'Gasto'}
                                        </Text>

                                    </View>

                                </View>

                            );

                        }
                    )

                )}

                {/* FOOTER */}

                <View
                    style={
                        styles.footer
                    }
                >

                    <View
                        style={
                            styles.footerLogoRow
                        }
                    >

                        <Ionicons
                            name="heart-outline"
                            size={14}
                            color={
                                COLOR_PRINCIPAL
                            }
                        />

                        <Text
                            style={
                                styles.footerText
                            }
                        >
                            Finanzas en Pareja
                        </Text>

                    </View>

                    <Text
                        style={
                            styles.footerSubText
                        }
                    >
                        Tu dinero, organizado
                        entre los dos.
                    </Text>

                </View>

            </ScrollView>

        </View>
    );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    container: {
        paddingHorizontal: 20,
        paddingTop:
            Platform.OS === 'web'
                ? 25
                : 38,
        paddingBottom: 45,
    },

    // HEADER

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },

    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },

    avatarImage: {
        width: 50,
        height: 50,
    },

    avatarIniciales: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },

    headerInfo: {
        flex: 1,
    },

    welcomeText: {
        color: '#8A908E',
        fontSize: 12,
    },

    nameText: {
        color: '#171A19',
        fontSize: 18,
        fontWeight: '700',
    },

    headerSyncPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },

    onlineDot: {
        width: 6,
        height: 6,
        borderRadius: 4,
        marginRight: 5,
    },

    onlineText: {
        fontSize: 10,
        fontWeight: '600',
    },

    // BALANCE

    mainDashboardCard: {
        borderRadius: 18,
        padding: 22,
        marginBottom: 25,
    },

    balanceTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    mainCardTitle: {
        color: '#CDE6E1',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
    },

    balanceStatusChip: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor:
            'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    balanceStatusChipNegativo: {
        backgroundColor:
            'rgba(184,92,92,0.55)',
    },

    mainCardAmount: {
        color: '#FFFFFF',
        fontSize: 36,
        fontWeight: '800',
        marginTop: 12,
    },

    mainCardSubtitle: {
        color: '#CDE6E1',
        fontSize: 12,
        marginTop: 4,
    },

    balanceDivider: {
        height: 1,
        backgroundColor:
            'rgba(255,255,255,0.18)',
        marginTop: 18,
        marginBottom: 16,
    },

    balanceMiniRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    balanceMiniItem: {
        flex: 1,
    },

    balanceMiniSeparator: {
        width: 1,
        height: 28,
        backgroundColor:
            'rgba(255,255,255,0.18)',
        marginHorizontal: 12,
    },

    balanceMiniLabel: {
        color: '#CDE6E1',
        fontSize: 10,
        marginBottom: 4,
    },

    balanceMiniValueIngreso: {
        color: '#A9E6C9',
        fontSize: 14,
        fontWeight: '700',
    },

    balanceMiniValueGasto: {
        color: '#F0BEBE',
        fontSize: 14,
        fontWeight: '700',
    },

    balanceMiniValueDeuda: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    // CUENTAS

    cuentasCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },

    cuentasCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:
            'space-between',
        marginBottom: 6,
    },

    cuentasCardTitle: {
        color: '#1E293B',
        fontSize: 13,
        fontWeight: '700',
    },

    cuentasCardVacio: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 17,
        marginTop: 4,
    },

    cuentasCardTotal: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },

    cuentasMiniRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 10,
    },

    cuentasMiniItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },

    cuentasMiniSeparator: {
        width: 1,
        height: 20,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 10,
    },

    cuentasMiniLabel: {
        color: '#64748B',
        fontSize: 11,
        marginLeft: 6,
        marginRight: 6,
    },

    cuentasMiniValor: {
        color: '#1E293B',
        fontSize: 12,
        fontWeight: '700',
    },

    // TEXTOS

    textRed: {
        color: '#B85C5C',
    },

    textGreen: {
        color: '#2E7D6E',
    },

    textTeal: {
        color: '#176B63',
    },

    // ACCIONES

    quickTitle: {
        color: '#171A19',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 10,
    },

    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent:
            'space-between',
        marginBottom: 29,
    },

    actionButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#EAEEED',
    },

    actionIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },

    actionButtonText: {
        color: '#222725',
        fontSize: 12,
        fontWeight: '700',
    },

    actionButtonSmallText: {
        color: '#929997',
        fontSize: 9,
        marginTop: 2,
    },

    // ACTIVIDAD

    activityHeader: {
        flexDirection: 'row',
        justifyContent:
            'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    activityInfo: {
        flex: 1,
    },

    sectionTitle: {
        color: '#171A19',
        fontSize: 18,
        fontWeight: '700',
    },

    sectionSubtitle: {
        color: '#777F7C',
        fontSize: 11,
        marginTop: 3,
    },

    activityCount: {
        minWidth: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

    activityCountText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // LOADING

    loadingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E7E6',
    },

    loadingText: {
        color: '#707875',
        fontSize: 12,
        marginTop: 12,
    },

    // EMPTY

    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E7E6',
    },

    emptyIcon: {
        width: 54,
        height: 54,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    emptyTitle: {
        color: '#202523',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 5,
    },

    emptyText: {
        color: '#707875',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 19,
    },

    // TRANSACCIONES

    transactionItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
        borderWidth: 1,
        borderColor: '#EAEEED',
    },

    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    transactionIncome: {
        backgroundColor: '#EDF5F2',
    },

    transactionExpense: {
        backgroundColor: '#F8EEEE',
    },

    transactionDebt: {
        backgroundColor:
            '#F3F7F6',
    },

    transactionInfo: {
        flex: 1,
        paddingRight: 5,
    },

    transactionTitle: {
        color: '#222725',
        fontSize: 14,
        fontWeight: '600',
    },

    cardDetailText: {
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },

    subDetailText: {
        color: '#747C79',
        fontSize: 11,
        marginTop: 3,
        fontWeight: '500',
    },

    cuotaText: {
        fontSize: 11,
        marginTop: 3,
        fontWeight: '700',
    },

    transactionAuthor: {
        color: '#9A9F9D',
        fontSize: 10,
        marginTop: 5,
    },

    amountContainer: {
        alignItems: 'flex-end',
        minWidth: 70,
    },

    transactionAmount: {
        fontSize: 14,
        fontWeight: '800',
    },

    amountLabel: {
        color: '#999F9C',
        fontSize: 9,
        marginTop: 3,
    },

    // FOOTER

    footer: {
        alignItems: 'center',
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E3E7E6',
    },

    footerLogoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },

    footerText: {
        fontSize: 12,
        fontWeight: '700',
    },

    footerSubText: {
        color: '#999F9C',
        fontSize: 10,
        marginTop: 3,
    },

});