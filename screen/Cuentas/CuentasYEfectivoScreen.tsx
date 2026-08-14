import React, { useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    onValue,
    push,
    ref,
    set,
    update,
} from 'firebase/database';


// ============================================================
// TIPOS
// ============================================================

type TipoCuenta = 'banco' | 'efectivo' | 'otra';

interface Cuenta {
    id: string;
    nombre: string;
    tipo: TipoCuenta;
    saldo: number;
    banco?: string;
    numero?: string;
    activa?: boolean;
    fechaRegistro?: string;
}

interface MovimientoCuenta {
    id: string;
    tipo: string;
    cuentaOrigenId?: string;
    cuentaDestinoId?: string;
    cuentaOrigenNombre?: string;
    cuentaDestinoNombre?: string;
    monto: number;
    descripcion?: string;
    fecha?: string;
    autor?: string;
}


// ============================================================
// COLORES
// MISMA PALETA DE TU PROYECTO
// ============================================================

const COLOR_PRINCIPAL = '#176B63';
const COLOR_OSCURO = '#124C47';
const COLOR_VERDE = '#2E7D6E';
const COLOR_SUAVE = '#DCEAE7';
const COLOR_MUY_SUAVE = '#F3F7F6';

const COLOR_ROJO = '#B85C5C';

const COLOR_TEXTO = '#171A19';
const COLOR_GRIS = '#777F7C';
const COLOR_BORDE = '#EAEEED';


// ============================================================
// PANTALLA
// ============================================================

export default function CuentasYEfectivoScreen({
    navigation,
}: any) {

    const usuarioActual = auth.currentUser;

    // ========================================================
    // ESTADOS
    // ========================================================

    const [idPareja, setIdPareja] =
        useState<string | null>(null);

    const [nombreUsuario, setNombreUsuario] =
        useState('Usuario');

    const [cuentas, setCuentas] =
        useState<Cuenta[]>([]);

    const [movimientos, setMovimientos] =
        useState<MovimientoCuenta[]>([]);

    const [loading, setLoading] =
        useState(true);

    // ========================================================
    // MODAL CREAR CUENTA
    // ========================================================

    const [modalCuentaVisible, setModalCuentaVisible] =
        useState(false);

    const [nombreCuenta, setNombreCuenta] =
        useState('');

    const [tipoCuenta, setTipoCuenta] =
        useState<TipoCuenta>('banco');

    const [saldoInicial, setSaldoInicial] =
        useState('');

    const [nombreBanco, setNombreBanco] =
        useState('');

    const [numeroCuenta, setNumeroCuenta] =
        useState('');

    // ========================================================
    // MODAL TRANSFERENCIA
    // ========================================================

    const [modalTransferenciaVisible, setModalTransferenciaVisible] =
        useState(false);

    const [cuentaOrigenId, setCuentaOrigenId] =
        useState('');

    const [cuentaDestinoId, setCuentaDestinoId] =
        useState('');

    const [montoTransferencia, setMontoTransferencia] =
        useState('');

    const [descripcionTransferencia, setDescripcionTransferencia] =
        useState('');

    // ========================================================
    // MODAL RETIRO
    // ========================================================

    const [modalRetiroVisible, setModalRetiroVisible] =
        useState(false);

    const [cuentaRetiroId, setCuentaRetiroId] =
        useState('');

    const [montoRetiro, setMontoRetiro] =
        useState('');

    // ========================================================
    // MODAL DEPOSITO
    // ========================================================

    const [modalDepositoVisible, setModalDepositoVisible] =
        useState(false);

    const [cuentaDepositoId, setCuentaDepositoId] =
        useState('');

    const [montoDeposito, setMontoDeposito] =
        useState('');


    // ========================================================
    // OBTENER USUARIO + PAREJA
    // ========================================================

    useEffect(() => {

        const uid = usuarioActual?.uid;

        if (!uid) {
            setLoading(false);
            return;
        }

        const usuarioRef = ref(
            db,
            `usuarios/${uid}`
        );

        const unsubscribe = onValue(
            usuarioRef,
            (snapshot) => {

                const data = snapshot.val();

                if (data) {

                    setNombreUsuario(
                        data.nombre ||
                        data.nombreCompleto ||
                        usuarioActual?.displayName ||
                        usuarioActual?.email?.split('@')[0] ||
                        'Usuario'
                    );

                    if (data.idPareja) {
                        setIdPareja(data.idPareja);
                    } else {
                        setLoading(false);
                    }

                } else {
                    setLoading(false);
                }
            }
        );

        return () => unsubscribe();

    }, [usuarioActual]);


    // ========================================================
    // CARGAR CUENTAS Y MOVIMIENTOS
    // ========================================================

    useEffect(() => {

        if (!idPareja) {
            return;
        }

        const cuentasRef = ref(
            db,
            `parejas/${idPareja}/cuentas`
        );

        const movimientosRef = ref(
            db,
            `parejas/${idPareja}/movimientosCuentas`
        );

        const unsubscribeCuentas = onValue(
            cuentasRef,
            (snapshot) => {

                const data = snapshot.val();

                if (!data) {
                    setCuentas([]);
                    setLoading(false);
                    return;
                }

                const lista: Cuenta[] =
                    Object.keys(data).map((key) => {

                        return {
                            id: key,
                            ...data[key],
                            saldo:
                                Number(
                                    data[key].saldo
                                ) || 0,
                        };

                    });

                setCuentas(lista);

                setLoading(false);
            }
        );


        const unsubscribeMovimientos = onValue(
            movimientosRef,
            (snapshot) => {

                const data = snapshot.val();

                if (!data) {
                    setMovimientos([]);
                    return;
                }

                const lista: MovimientoCuenta[] =
                    Object.keys(data)
                        .map((key) => {

                            return {
                                id: key,
                                ...data[key],
                                monto:
                                    Number(
                                        data[key].monto
                                    ) || 0,
                            };

                        })
                        .sort((a, b) => {

                            const fechaA =
                                new Date(
                                    a.fecha || 0
                                ).getTime();

                            const fechaB =
                                new Date(
                                    b.fecha || 0
                                ).getTime();

                            return fechaB - fechaA;
                        });

                setMovimientos(lista);
            }
        );


        return () => {

            unsubscribeCuentas();
            unsubscribeMovimientos();

        };

    }, [idPareja]);


    // ========================================================
    // TOTAL DE DINERO
    // ========================================================

    const totalDinero = cuentas.reduce(
        (total, cuenta) =>
            total + Number(cuenta.saldo || 0),
        0
    );


    const totalBancos = cuentas
        .filter(
            cuenta =>
                cuenta.tipo === 'banco'
        )
        .reduce(
            (total, cuenta) =>
                total + Number(cuenta.saldo || 0),
            0
        );


    const totalEfectivo = cuentas
        .filter(
            cuenta =>
                cuenta.tipo === 'efectivo'
        )
        .reduce(
            (total, cuenta) =>
                total + Number(cuenta.saldo || 0),
            0
        );


    // ========================================================
    // FORMATEAR DINERO
    // ========================================================

    const dinero = (valor: number) => {

        return `$${Number(valor || 0).toFixed(2)}`;

    };


    // ========================================================
    // CREAR CUENTA
    // ========================================================

    const crearCuenta = async () => {

        if (!idPareja) {
            Alert.alert(
                'Error',
                'No se encontró la pareja.'
            );
            return;
        }

        if (!nombreCuenta.trim()) {

            Alert.alert(
                'Falta información',
                'Escribe el nombre de la cuenta.'
            );

            return;
        }

        const saldo =
            Number(
                saldoInicial.replace(',', '.')
            ) || 0;


        if (saldo < 0) {

            Alert.alert(
                'Saldo incorrecto',
                'El saldo inicial no puede ser negativo.'
            );

            return;
        }


        try {

            const cuentasRef = ref(
                db,
                `parejas/${idPareja}/cuentas`
            );

            const nuevaCuenta = push(cuentasRef);

            await set(
                nuevaCuenta,
                {

                    nombre:
                        nombreCuenta.trim(),

                    tipo:
                        tipoCuenta,

                    saldo:
                        saldo,

                    banco:
                        tipoCuenta === 'banco'
                            ? nombreBanco.trim()
                            : '',

                    numero:
                        tipoCuenta === 'banco'
                            ? numeroCuenta.trim()
                            : '',

                    activa: true,

                    fechaRegistro:
                        new Date().toISOString(),

                }
            );


            // Si existe saldo inicial,
            // guardamos también el movimiento.

            if (saldo > 0) {

                const movimientosRef =
                    ref(
                        db,
                        `parejas/${idPareja}/movimientosCuentas`
                    );

                const nuevoMovimiento =
                    push(movimientosRef);

                await set(
                    nuevoMovimiento,
                    {

                        tipo: 'saldo_inicial',

                        cuentaDestinoId:
                            nuevaCuenta.key,

                        cuentaDestinoNombre:
                            nombreCuenta.trim(),

                        monto:
                            saldo,

                        descripcion:
                            'Saldo inicial',

                        fecha:
                            new Date().toISOString(),

                        autor:
                            nombreUsuario,

                    }
                );

            }


            limpiarFormularioCuenta();

            Alert.alert(
                'Cuenta creada',
                'La cuenta se agregó correctamente.'
            );

        } catch (error) {

            console.error(error);

            Alert.alert(
                'Error',
                'No se pudo crear la cuenta.'
            );

        }

    };


    // ========================================================
    // TRANSFERENCIA ENTRE CUENTAS
    // ========================================================

    const realizarTransferencia = async () => {

        if (!idPareja) {
            return;
        }

        if (!cuentaOrigenId || !cuentaDestinoId) {

            Alert.alert(
                'Falta información',
                'Selecciona la cuenta de origen y destino.'
            );

            return;
        }


        if (
            cuentaOrigenId ===
            cuentaDestinoId
        ) {

            Alert.alert(
                'Cuentas iguales',
                'La cuenta de origen y destino deben ser diferentes.'
            );

            return;
        }


        const monto =
            Number(
                montoTransferencia.replace(',', '.')
            ) || 0;


        if (monto <= 0) {

            Alert.alert(
                'Monto incorrecto',
                'Ingresa un monto válido.'
            );

            return;
        }


        const origen =
            cuentas.find(
                cuenta =>
                    cuenta.id ===
                    cuentaOrigenId
            );

        const destino =
            cuentas.find(
                cuenta =>
                    cuenta.id ===
                    cuentaDestinoId
            );


        if (!origen || !destino) {

            Alert.alert(
                'Error',
                'No se encontraron las cuentas.'
            );

            return;
        }


        if (origen.saldo < monto) {

            Alert.alert(
                'Saldo insuficiente',
                `La cuenta ${origen.nombre} tiene ${dinero(
                    origen.saldo
                )}.`
            );

            return;
        }


        try {

            const origenNuevo =
                origen.saldo - monto;

            const destinoNuevo =
                destino.saldo + monto;


            const cuentasBase =
                `parejas/${idPareja}/cuentas`;


            await update(
                ref(
                    db,
                    `${cuentasBase}/${origen.id}`
                ),
                {
                    saldo: origenNuevo,
                }
            );


            await update(
                ref(
                    db,
                    `${cuentasBase}/${destino.id}`
                ),
                {
                    saldo: destinoNuevo,
                }
            );


            const movimientosRef =
                ref(
                    db,
                    `parejas/${idPareja}/movimientosCuentas`
                );

            const nuevoMovimiento =
                push(movimientosRef);


            await set(
                nuevoMovimiento,
                {

                    tipo: 'transferencia',

                    cuentaOrigenId:
                        origen.id,

                    cuentaDestinoId:
                        destino.id,

                    cuentaOrigenNombre:
                        origen.nombre,

                    cuentaDestinoNombre:
                        destino.nombre,

                    monto:
                        monto,

                    descripcion:
                        descripcionTransferencia.trim() ||
                        'Transferencia entre cuentas',

                    fecha:
                        new Date().toISOString(),

                    autor:
                        nombreUsuario,

                }
            );


            limpiarFormularioTransferencia();


            Alert.alert(
                'Transferencia realizada',
                `${dinero(monto)} pasó de ${origen.nombre} a ${destino.nombre}.`
            );

        } catch (error) {

            console.error(error);

            Alert.alert(
                'Error',
                'No se pudo realizar la transferencia.'
            );

        }

    };


    // ========================================================
    // RETIRO DEL CAJERO
    // BANCO -> EFECTIVO
    // ========================================================

    const realizarRetiro = async () => {

        if (!idPareja) {
            return;
        }


        const banco =
            cuentas.find(
                cuenta =>
                    cuenta.id ===
                    cuentaRetiroId
            );


        const efectivo =
            cuentas.find(
                cuenta =>
                    cuenta.tipo ===
                    'efectivo'
            );


        if (!banco) {

            Alert.alert(
                'Selecciona una cuenta',
                'Selecciona el banco desde donde retirarás el dinero.'
            );

            return;
        }


        if (banco.tipo !== 'banco') {

            Alert.alert(
                'Cuenta incorrecta',
                'El retiro debe hacerse desde una cuenta bancaria.'
            );

            return;
        }


        if (!efectivo) {

            Alert.alert(
                'No existe efectivo',
                'Primero crea una cuenta de tipo Efectivo.'
            );

            return;
        }


        const monto =
            Number(
                montoRetiro.replace(',', '.')
            ) || 0;


        if (monto <= 0) {

            Alert.alert(
                'Monto incorrecto',
                'Ingresa un monto válido.'
            );

            return;
        }


        if (banco.saldo < monto) {

            Alert.alert(
                'Saldo insuficiente',
                `Tu cuenta tiene ${dinero(
                    banco.saldo
                )}.`
            );

            return;
        }


        try {

            await update(
                ref(
                    db,
                    `parejas/${idPareja}/cuentas/${banco.id}`
                ),
                {
                    saldo:
                        banco.saldo - monto,
                }
            );


            await update(
                ref(
                    db,
                    `parejas/${idPareja}/cuentas/${efectivo.id}`
                ),
                {
                    saldo:
                        efectivo.saldo + monto,
                }
            );


            const movimientosRef =
                ref(
                    db,
                    `parejas/${idPareja}/movimientosCuentas`
                );


            const nuevoMovimiento =
                push(movimientosRef);


            await set(
                nuevoMovimiento,
                {

                    tipo: 'retiro_cajero',

                    cuentaOrigenId:
                        banco.id,

                    cuentaDestinoId:
                        efectivo.id,

                    cuentaOrigenNombre:
                        banco.nombre,

                    cuentaDestinoNombre:
                        efectivo.nombre,

                    monto:
                        monto,

                    descripcion:
                        'Retiro de cajero',

                    fecha:
                        new Date().toISOString(),

                    autor:
                        nombreUsuario,

                }
            );


            setModalRetiroVisible(false);
            setMontoRetiro('');
            setCuentaRetiroId('');


            Alert.alert(
                'Retiro registrado',
                `${dinero(monto)} fue retirado de ${banco.nombre} y agregado a Efectivo.`
            );

        } catch (error) {

            console.error(error);

            Alert.alert(
                'Error',
                'No se pudo registrar el retiro.'
            );

        }

    };


    // ========================================================
    // DEPOSITO
    // EFECTIVO -> BANCO
    // ========================================================

    const realizarDeposito = async () => {

        if (!idPareja) {
            return;
        }


        const efectivo =
            cuentas.find(
                cuenta =>
                    cuenta.tipo ===
                    'efectivo'
            );


        const banco =
            cuentas.find(
                cuenta =>
                    cuenta.id ===
                    cuentaDepositoId
            );


        if (!efectivo) {

            Alert.alert(
                'No existe efectivo',
                'Primero crea una cuenta de tipo Efectivo.'
            );

            return;
        }


        if (!banco || banco.tipo !== 'banco') {

            Alert.alert(
                'Selecciona un banco',
                'Selecciona la cuenta bancaria donde depositarás.'
            );

            return;
        }


        const monto =
            Number(
                montoDeposito.replace(',', '.')
            ) || 0;


        if (monto <= 0) {

            Alert.alert(
                'Monto incorrecto',
                'Ingresa un monto válido.'
            );

            return;
        }


        if (efectivo.saldo < monto) {

            Alert.alert(
                'Efectivo insuficiente',
                `Tienes ${dinero(
                    efectivo.saldo
                )} en efectivo.`
            );

            return;
        }


        try {

            await update(
                ref(
                    db,
                    `parejas/${idPareja}/cuentas/${efectivo.id}`
                ),
                {
                    saldo:
                        efectivo.saldo - monto,
                }
            );


            await update(
                ref(
                    db,
                    `parejas/${idPareja}/cuentas/${banco.id}`
                ),
                {
                    saldo:
                        banco.saldo + monto,
                }
            );


            const movimientosRef =
                ref(
                    db,
                    `parejas/${idPareja}/movimientosCuentas`
                );


            const nuevoMovimiento =
                push(movimientosRef);


            await set(
                nuevoMovimiento,
                {

                    tipo: 'deposito',

                    cuentaOrigenId:
                        efectivo.id,

                    cuentaDestinoId:
                        banco.id,

                    cuentaOrigenNombre:
                        efectivo.nombre,

                    cuentaDestinoNombre:
                        banco.nombre,

                    monto:
                        monto,

                    descripcion:
                        'Depósito de efectivo',

                    fecha:
                        new Date().toISOString(),

                    autor:
                        nombreUsuario,

                }
            );


            setModalDepositoVisible(false);
            setMontoDeposito('');
            setCuentaDepositoId('');


            Alert.alert(
                'Depósito registrado',
                `${dinero(monto)} pasó de Efectivo a ${banco.nombre}.`
            );

        } catch (error) {

            console.error(error);

            Alert.alert(
                'Error',
                'No se pudo registrar el depósito.'
            );

        }

    };


    // ========================================================
    // LIMPIAR CUENTA
    // ========================================================

    const limpiarFormularioCuenta = () => {

        setModalCuentaVisible(false);

        setNombreCuenta('');
        setSaldoInicial('');
        setNombreBanco('');
        setNumeroCuenta('');
        setTipoCuenta('banco');

    };


    // ========================================================
    // LIMPIAR TRANSFERENCIA
    // ========================================================

    const limpiarFormularioTransferencia = () => {

        setModalTransferenciaVisible(false);

        setCuentaOrigenId('');
        setCuentaDestinoId('');
        setMontoTransferencia('');
        setDescripcionTransferencia('');

    };


    // ========================================================
    // ICONO CUENTA
    // ========================================================

    const obtenerIconoCuenta = (
        tipo: TipoCuenta
    ): keyof typeof Ionicons.glyphMap => {

        if (tipo === 'banco') {
            return 'business-outline';
        }

        if (tipo === 'efectivo') {
            return 'cash-outline';
        }

        return 'wallet-outline';

    };


    // ========================================================
    // NOMBRE TIPO
    // ========================================================

    const obtenerNombreTipo = (
        tipo: TipoCuenta
    ) => {

        if (tipo === 'banco') {
            return 'Cuenta bancaria';
        }

        if (tipo === 'efectivo') {
            return 'Dinero físico';
        }

        return 'Otra cuenta';

    };


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <View style={styles.loadingScreen}>

                <ActivityIndicator
                    size="large"
                    color={COLOR_PRINCIPAL}
                />

                <Text style={styles.loadingText}>
                    Cargando cuentas...
                </Text>

            </View>
        );

    }


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <KeyboardAvoidingView
            style={styles.root}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={false}
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <View style={styles.header}>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() =>
                            navigation.goBack()
                        }
                    >

                        <Ionicons
                            name="arrow-back"
                            size={21}
                            color={COLOR_PRINCIPAL}
                        />

                    </TouchableOpacity>


                    <View style={styles.headerInfo}>

                        <Text style={styles.headerTitle}>
                            Cuentas y Efectivo
                        </Text>

                        <Text style={styles.headerSubtitle}>
                            ¿Dónde está tu dinero?
                        </Text>

                    </View>


                    <View style={styles.headerIcon}>

                        <Ionicons
                            name="wallet-outline"
                            size={22}
                            color="#FFFFFF"
                        />

                    </View>

                </View>


                {/* ================================================= */}
                {/* TOTAL */}
                {/* ================================================= */}

                <View style={styles.totalCard}>

                    <View style={styles.totalTopRow}>

                        <View>

                            <Text style={styles.totalLabel}>
                                DINERO DISPONIBLE
                            </Text>

                            <Text style={styles.totalAmount}>
                                {dinero(totalDinero)}
                            </Text>

                        </View>


                        <View style={styles.totalIcon}>

                            <Ionicons
                                name="wallet"
                                size={25}
                                color="#FFFFFF"
                            />

                        </View>

                    </View>


                    <View style={styles.totalDivider} />


                    <View style={styles.summaryRow}>

                        <View style={styles.summaryItem}>

                            <Ionicons
                                name="business-outline"
                                size={17}
                                color="#CDE6E1"
                            />

                            <View>

                                <Text style={styles.summaryLabel}>
                                    Bancos
                                </Text>

                                <Text style={styles.summaryValue}>
                                    {dinero(totalBancos)}
                                </Text>

                            </View>

                        </View>


                        <View style={styles.summaryItem}>

                            <Ionicons
                                name="cash-outline"
                                size={17}
                                color="#CDE6E1"
                            />

                            <View>

                                <Text style={styles.summaryLabel}>
                                    Efectivo
                                </Text>

                                <Text style={styles.summaryValue}>
                                    {dinero(totalEfectivo)}
                                </Text>

                            </View>

                        </View>

                    </View>

                </View>


                {/* ================================================= */}
                {/* BOTONES */}
                {/* ================================================= */}

                <Text style={styles.sectionTitle}>
                    Operaciones
                </Text>


                <View style={styles.operationsRow}>

                    <TouchableOpacity
                        style={styles.operationButton}
                        activeOpacity={0.85}
                        onPress={() =>
                            setModalCuentaVisible(true)
                        }
                    >

                        <View
                            style={[
                                styles.operationIcon,
                                {
                                    backgroundColor:
                                        COLOR_MUY_SUAVE,
                                },
                            ]}
                        >

                            <Ionicons
                                name="add"
                                size={22}
                                color={COLOR_PRINCIPAL}
                            />

                        </View>

                        <Text style={styles.operationText}>
                            Nueva
                        </Text>

                        <Text style={styles.operationSmall}>
                            Cuenta
                        </Text>

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.operationButton}
                        activeOpacity={0.85}
                        onPress={() =>
                            setModalTransferenciaVisible(
                                true
                            )
                        }
                    >

                        <View
                            style={[
                                styles.operationIcon,
                                {
                                    backgroundColor:
                                        '#EDF5F2',
                                },
                            ]}
                        >

                            <Ionicons
                                name="swap-horizontal"
                                size={22}
                                color={COLOR_VERDE}
                            />

                        </View>

                        <Text style={styles.operationText}>
                            Transferir
                        </Text>

                        <Text style={styles.operationSmall}>
                            Entre cuentas
                        </Text>

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.operationButton}
                        activeOpacity={0.85}
                        onPress={() =>
                            setModalRetiroVisible(true)
                        }
                    >

                        <View
                            style={[
                                styles.operationIcon,
                                {
                                    backgroundColor:
                                        '#F8EEEE',
                                },
                            ]}
                        >

                            <Ionicons
                                name="cash-outline"
                                size={22}
                                color={COLOR_ROJO}
                            />

                        </View>

                        <Text style={styles.operationText}>
                            Retirar
                        </Text>

                        <Text style={styles.operationSmall}>
                            Cajero
                        </Text>

                    </TouchableOpacity>


                    <TouchableOpacity
                        style={styles.operationButton}
                        activeOpacity={0.85}
                        onPress={() =>
                            setModalDepositoVisible(
                                true
                            )
                        }
                    >

                        <View
                            style={[
                                styles.operationIcon,
                                {
                                    backgroundColor:
                                        COLOR_MUY_SUAVE,
                                },
                            ]}
                        >

                            <Ionicons
                                name="arrow-down-circle-outline"
                                size={22}
                                color={COLOR_PRINCIPAL}
                            />

                        </View>

                        <Text style={styles.operationText}>
                            Depositar
                        </Text>

                        <Text style={styles.operationSmall}>
                            Efectivo
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* ================================================= */}
                {/* CUENTAS */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

                    <View>

                        <Text style={styles.sectionTitle}>
                            Mis cuentas
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Saldos disponibles actualmente
                        </Text>

                    </View>

                    <View style={styles.countBadge}>

                        <Text style={styles.countBadgeText}>
                            {cuentas.length}
                        </Text>

                    </View>

                </View>


                {cuentas.length === 0 ? (

                    <View style={styles.emptyCard}>

                        <View style={styles.emptyIcon}>

                            <Ionicons
                                name="wallet-outline"
                                size={28}
                                color={COLOR_PRINCIPAL}
                            />

                        </View>

                        <Text style={styles.emptyTitle}>
                            No tienes cuentas registradas
                        </Text>

                        <Text style={styles.emptyText}>
                            Agrega tu banco, efectivo u otra
                            cuenta para comenzar a controlar
                            dónde está tu dinero.
                        </Text>


                        <TouchableOpacity
                            style={styles.emptyButton}
                            onPress={() =>
                                setModalCuentaVisible(
                                    true
                                )
                            }
                        >

                            <Ionicons
                                name="add"
                                size={18}
                                color="#FFFFFF"
                            />

                            <Text style={styles.emptyButtonText}>
                                Agregar cuenta
                            </Text>

                        </TouchableOpacity>

                    </View>

                ) : (

                    cuentas.map((cuenta) => (

                        <View
                            key={cuenta.id}
                            style={styles.accountCard}
                        >

                            <View
                                style={[
                                    styles.accountIcon,
                                    cuenta.tipo ===
                                        'efectivo'
                                        ? styles.accountIconCash
                                        : styles.accountIconBank,
                                ]}
                            >

                                <Ionicons
                                    name={obtenerIconoCuenta(
                                        cuenta.tipo
                                    )}
                                    size={22}
                                    color={
                                        cuenta.tipo ===
                                        'efectivo'
                                            ? COLOR_VERDE
                                            : COLOR_PRINCIPAL
                                    }
                                />

                            </View>


                            <View style={styles.accountInfo}>

                                <Text
                                    style={
                                        styles.accountName
                                    }
                                >
                                    {cuenta.nombre}
                                </Text>

                                <Text
                                    style={
                                        styles.accountType
                                    }
                                >
                                    {obtenerNombreTipo(
                                        cuenta.tipo
                                    )}

                                    {cuenta.banco
                                        ? ` · ${cuenta.banco}`
                                        : ''}
                                </Text>

                                {cuenta.numero ? (

                                    <Text
                                        style={
                                            styles.accountNumber
                                        }
                                    >
                                        {cuenta.numero}
                                    </Text>

                                ) : null}

                            </View>


                            <View
                                style={
                                    styles.accountAmountContainer
                                }
                            >

                                <Text
                                    style={
                                        styles.accountAmount
                                    }
                                >
                                    {dinero(
                                        cuenta.saldo
                                    )}
                                </Text>

                                <Text
                                    style={
                                        styles.availableText
                                    }
                                >
                                    Disponible
                                </Text>

                            </View>

                        </View>

                    ))

                )}


                {/* ================================================= */}
                {/* MOVIMIENTOS */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

                    <View>

                        <Text style={styles.sectionTitle}>
                            Movimientos de dinero
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Transferencias, retiros y depósitos
                        </Text>

                    </View>

                    <View style={styles.countBadge}>

                        <Text style={styles.countBadgeText}>
                            {movimientos.length}
                        </Text>

                    </View>

                </View>


                {movimientos.length === 0 ? (

                    <View style={styles.smallEmptyCard}>

                        <Ionicons
                            name="swap-horizontal-outline"
                            size={25}
                            color="#A0A7A4"
                        />

                        <Text style={styles.smallEmptyText}>
                            Todavía no existen movimientos
                            entre tus cuentas.
                        </Text>

                    </View>

                ) : (

                    movimientos
                        .slice(0, 15)
                        .map((movimiento) => {

                            const esRetiro =
                                movimiento.tipo ===
                                'retiro_cajero';

                            const esDeposito =
                                movimiento.tipo ===
                                'deposito';

                            const esSaldoInicial =
                                movimiento.tipo ===
                                'saldo_inicial';


                            return (

                                <View
                                    key={
                                        movimiento.id
                                    }
                                    style={
                                        styles.movementCard
                                    }
                                >

                                    <View
                                        style={[
                                            styles.movementIcon,
                                            esRetiro
                                                ? styles.movementIconRetiro
                                                : esDeposito
                                                ? styles.movementIconDeposito
                                                : styles.movementIconTransferencia,
                                        ]}
                                    >

                                        <Ionicons
                                            name={
                                                esSaldoInicial
                                                    ? 'add-circle-outline'
                                                    : esRetiro
                                                    ? 'arrow-down'
                                                    : esDeposito
                                                    ? 'arrow-up'
                                                    : 'swap-horizontal'
                                            }
                                            size={18}
                                            color={
                                                esRetiro
                                                    ? COLOR_ROJO
                                                    : COLOR_PRINCIPAL
                                            }
                                        />

                                    </View>


                                    <View
                                        style={
                                            styles.movementInfo
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.movementTitle
                                            }
                                        >
                                            {movimiento.descripcion ||
                                                'Movimiento'}
                                        </Text>


                                        {!esSaldoInicial &&
                                            movimiento.cuentaOrigenNombre &&
                                            movimiento.cuentaDestinoNombre ? (

                                            <Text
                                                style={
                                                    styles.movementRoute
                                                }
                                            >
                                                {
                                                    movimiento.cuentaOrigenNombre
                                                }

                                                {' → '}

                                                {
                                                    movimiento.cuentaDestinoNombre
                                                }
                                            </Text>

                                        ) : null}


                                        <Text
                                            style={
                                                styles.movementAuthor
                                            }
                                        >
                                            Registrado por:{' '}
                                            {
                                                movimiento.autor ||
                                                'Usuario'
                                            }
                                        </Text>

                                    </View>


                                    <View
                                        style={
                                            styles.movementAmountContainer
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.movementAmount
                                            }
                                        >
                                            {dinero(
                                                movimiento.monto
                                            )}
                                        </Text>

                                        <Text
                                            style={
                                                styles.movementDate
                                            }
                                        >
                                            {movimiento.fecha
                                                ? new Date(
                                                      movimiento.fecha
                                                  ).toLocaleDateString(
                                                      'es-EC'
                                                  )
                                                : ''}
                                        </Text>

                                    </View>

                                </View>

                            );

                        })

                )}


                {/* ================================================= */}
                {/* NOTA IMPORTANTE */}
                {/* ================================================= */}

                <View style={styles.infoCard}>

                    <View style={styles.infoIcon}>

                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color={COLOR_PRINCIPAL}
                        />

                    </View>

                    <View style={styles.infoContent}>

                        <Text style={styles.infoTitle}>
                            Las transferencias no son gastos
                        </Text>

                        <Text style={styles.infoText}>
                            Cuando pasas dinero de un banco a
                            efectivo, o de un banco a otro,
                            tu dinero total no cambia. Solamente
                            cambia dónde está guardado.
                        </Text>

                    </View>

                </View>


                {/* ================================================= */}
                {/* FOOTER */}
                {/* ================================================= */}

                <View style={styles.footer}>

                    <Ionicons
                        name="shield-checkmark-outline"
                        size={15}
                        color={COLOR_PRINCIPAL}
                    />

                    <Text style={styles.footerText}>
                        Dinero organizado y sincronizado
                    </Text>

                </View>

            </ScrollView>


            {/* ==================================================== */}
            {/* MODAL NUEVA CUENTA */}
            {/* ==================================================== */}

            <Modal
                visible={modalCuentaVisible}
                transparent
                animationType="slide"
                onRequestClose={() =>
                    limpiarFormularioCuenta()
                }
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                        >

                            <View style={styles.modalHeader}>

                                <View>

                                    <Text
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Nueva cuenta
                                    </Text>

                                    <Text
                                        style={
                                            styles.modalSubtitle
                                        }
                                    >
                                        Registra dónde tienes tu dinero
                                    </Text>

                                </View>


                                <TouchableOpacity
                                    onPress={() =>
                                        limpiarFormularioCuenta()
                                    }
                                    style={
                                        styles.modalClose
                                    }
                                >

                                    <Ionicons
                                        name="close"
                                        size={22}
                                        color="#555"
                                    />

                                </TouchableOpacity>

                            </View>


                            <Text style={styles.inputLabel}>
                                Tipo de cuenta
                            </Text>


                            <View style={styles.typeRow}>

                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        tipoCuenta ===
                                            'banco' &&
                                            styles.typeButtonActive,
                                    ]}
                                    onPress={() =>
                                        setTipoCuenta(
                                            'banco'
                                        )
                                    }
                                >

                                    <Ionicons
                                        name="business-outline"
                                        size={19}
                                        color={
                                            tipoCuenta ===
                                            'banco'
                                                ? COLOR_PRINCIPAL
                                                : COLOR_GRIS
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            tipoCuenta ===
                                                'banco' &&
                                                styles.typeButtonTextActive,
                                        ]}
                                    >
                                        Banco
                                    </Text>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        tipoCuenta ===
                                            'efectivo' &&
                                            styles.typeButtonActive,
                                    ]}
                                    onPress={() =>
                                        setTipoCuenta(
                                            'efectivo'
                                        )
                                    }
                                >

                                    <Ionicons
                                        name="cash-outline"
                                        size={19}
                                        color={
                                            tipoCuenta ===
                                            'efectivo'
                                                ? COLOR_VERDE
                                                : COLOR_GRIS
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            tipoCuenta ===
                                                'efectivo' &&
                                                styles.typeButtonTextActive,
                                        ]}
                                    >
                                        Efectivo
                                    </Text>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={[
                                        styles.typeButton,
                                        tipoCuenta ===
                                            'otra' &&
                                            styles.typeButtonActive,
                                    ]}
                                    onPress={() =>
                                        setTipoCuenta(
                                            'otra'
                                        )
                                    }
                                >

                                    <Ionicons
                                        name="wallet-outline"
                                        size={19}
                                        color={
                                            tipoCuenta ===
                                            'otra'
                                                ? COLOR_PRINCIPAL
                                                : COLOR_GRIS
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            tipoCuenta ===
                                                'otra' &&
                                                styles.typeButtonTextActive,
                                        ]}
                                    >
                                        Otra
                                    </Text>

                                </TouchableOpacity>

                            </View>


                            <Text style={styles.inputLabel}>
                                Nombre de la cuenta
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder={
                                    tipoCuenta ===
                                    'efectivo'
                                        ? 'Ej: Efectivo'
                                        : 'Ej: Banco Pichincha'
                                }
                                placeholderTextColor="#A0A6A3"
                                value={nombreCuenta}
                                onChangeText={
                                    setNombreCuenta
                                }
                            />


                            {tipoCuenta === 'banco' && (

                                <>

                                    <Text
                                        style={
                                            styles.inputLabel
                                        }
                                    >
                                        Banco
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej: Banco Pichincha"
                                        placeholderTextColor="#A0A6A3"
                                        value={
                                            nombreBanco
                                        }
                                        onChangeText={
                                            setNombreBanco
                                        }
                                    />


                                    <Text
                                        style={
                                            styles.inputLabel
                                        }
                                    >
                                        Número de cuenta
                                    </Text>

                                    <TextInput
                                        style={styles.input}
                                        placeholder="Opcional"
                                        placeholderTextColor="#A0A6A3"
                                        value={
                                            numeroCuenta
                                        }
                                        onChangeText={
                                            setNumeroCuenta
                                        }
                                        keyboardType="number-pad"
                                    />

                                </>

                            )}


                            <Text style={styles.inputLabel}>
                                Saldo inicial
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor="#A0A6A3"
                                value={saldoInicial}
                                onChangeText={
                                    setSaldoInicial
                                }
                                keyboardType="decimal-pad"
                            />


                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={crearCuenta}
                            >

                                <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#FFFFFF"
                                />

                                <Text
                                    style={
                                        styles.primaryButtonText
                                    }
                                >
                                    Crear cuenta
                                </Text>

                            </TouchableOpacity>

                        </ScrollView>

                    </View>

                </View>

            </Modal>


            {/* ==================================================== */}
            {/* MODAL TRANSFERENCIA */}
            {/* ==================================================== */}

            <Modal
                visible={
                    modalTransferenciaVisible
                }
                transparent
                animationType="slide"
                onRequestClose={() =>
                    limpiarFormularioTransferencia()
                }
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>

                            <View>

                                <Text
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Transferir dinero
                                </Text>

                                <Text
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Mueve dinero entre tus cuentas
                                </Text>

                            </View>


                            <TouchableOpacity
                                onPress={() =>
                                    limpiarFormularioTransferencia()
                                }
                                style={
                                    styles.modalClose
                                }
                            >

                                <Ionicons
                                    name="close"
                                    size={22}
                                    color="#555"
                                />

                            </TouchableOpacity>

                        </View>


                        <Text style={styles.inputLabel}>
                            Desde
                        </Text>


                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={
                                false
                            }
                            style={styles.selectionScroll}
                        >

                            {cuentas.map((cuenta) => (

                                <TouchableOpacity
                                    key={cuenta.id}
                                    style={[
                                        styles.selectionChip,
                                        cuentaOrigenId ===
                                            cuenta.id &&
                                            styles.selectionChipActive,
                                    ]}
                                    onPress={() =>
                                        setCuentaOrigenId(
                                            cuenta.id
                                        )
                                    }
                                >

                                    <Ionicons
                                        name={obtenerIconoCuenta(
                                            cuenta.tipo
                                        )}
                                        size={17}
                                        color={
                                            cuentaOrigenId ===
                                            cuenta.id
                                                ? COLOR_PRINCIPAL
                                                : COLOR_GRIS
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.selectionText,
                                            cuentaOrigenId ===
                                                cuenta.id &&
                                                styles.selectionTextActive,
                                        ]}
                                    >
                                        {cuenta.nombre}
                                    </Text>

                                </TouchableOpacity>

                            ))}

                        </ScrollView>


                        <Text style={styles.inputLabel}>
                            Hacia
                        </Text>


                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={
                                false
                            }
                            style={styles.selectionScroll}
                        >

                            {cuentas.map((cuenta) => (

                                <TouchableOpacity
                                    key={cuenta.id}
                                    style={[
                                        styles.selectionChip,
                                        cuentaDestinoId ===
                                            cuenta.id &&
                                            styles.selectionChipActive,
                                    ]}
                                    onPress={() =>
                                        setCuentaDestinoId(
                                            cuenta.id
                                        )
                                    }
                                >

                                    <Ionicons
                                        name={obtenerIconoCuenta(
                                            cuenta.tipo
                                        )}
                                        size={17}
                                        color={
                                            cuentaDestinoId ===
                                            cuenta.id
                                                ? COLOR_PRINCIPAL
                                                : COLOR_GRIS
                                        }
                                    />

                                    <Text
                                        style={[
                                            styles.selectionText,
                                            cuentaDestinoId ===
                                                cuenta.id &&
                                                styles.selectionTextActive,
                                        ]}
                                    >
                                        {cuenta.nombre}
                                    </Text>

                                </TouchableOpacity>

                            ))}

                        </ScrollView>


                        <Text style={styles.inputLabel}>
                            Monto
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="$ 0.00"
                            placeholderTextColor="#A0A6A3"
                            value={
                                montoTransferencia
                            }
                            onChangeText={
                                setMontoTransferencia
                            }
                            keyboardType="decimal-pad"
                        />


                        <Text style={styles.inputLabel}>
                            Descripción
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej: Pasar dinero a mi cuenta de ahorros"
                            placeholderTextColor="#A0A6A3"
                            value={
                                descripcionTransferencia
                            }
                            onChangeText={
                                setDescripcionTransferencia
                            }
                        />


                        <TouchableOpacity
                            style={
                                styles.primaryButton
                            }
                            onPress={
                                realizarTransferencia
                            }
                        >

                            <Ionicons
                                name="swap-horizontal"
                                size={20}
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.primaryButtonText
                                }
                            >
                                Realizar transferencia
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>


            {/* ==================================================== */}
            {/* MODAL RETIRO */}
            {/* ==================================================== */}

            <Modal
                visible={modalRetiroVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {

                    setModalRetiroVisible(false);
                    setMontoRetiro('');
                    setCuentaRetiroId('');

                }}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>

                            <View>

                                <Text
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Retiro de cajero
                                </Text>

                                <Text
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Banco → Efectivo
                                </Text>

                            </View>


                            <TouchableOpacity
                                onPress={() => {

                                    setModalRetiroVisible(
                                        false
                                    );

                                    setMontoRetiro('');
                                    setCuentaRetiroId('');

                                }}
                                style={
                                    styles.modalClose
                                }
                            >

                                <Ionicons
                                    name="close"
                                    size={22}
                                    color="#555"
                                />

                            </TouchableOpacity>

                        </View>


                        <View style={styles.explanationCard}>

                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color={COLOR_PRINCIPAL}
                            />

                            <Text
                                style={
                                    styles.explanationText
                                }
                            >
                                Este retiro no se registrará
                                como gasto. El dinero solamente
                                pasará de tu banco a efectivo.
                            </Text>

                        </View>


                        <Text style={styles.inputLabel}>
                            Banco
                        </Text>


                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={
                                false
                            }
                        >

                            {cuentas
                                .filter(
                                    cuenta =>
                                        cuenta.tipo ===
                                        'banco'
                                )
                                .map((cuenta) => (

                                    <TouchableOpacity
                                        key={
                                            cuenta.id
                                        }
                                        style={[
                                            styles.selectionChip,
                                            cuentaRetiroId ===
                                                cuenta.id &&
                                                styles.selectionChipActive,
                                        ]}
                                        onPress={() =>
                                            setCuentaRetiroId(
                                                cuenta.id
                                            )
                                        }
                                    >

                                        <Ionicons
                                            name="business-outline"
                                            size={17}
                                            color={
                                                cuentaRetiroId ===
                                                cuenta.id
                                                    ? COLOR_PRINCIPAL
                                                    : COLOR_GRIS
                                            }
                                        />

                                        <Text
                                            style={[
                                                styles.selectionText,
                                                cuentaRetiroId ===
                                                    cuenta.id &&
                                                    styles.selectionTextActive,
                                            ]}
                                        >
                                            {cuenta.nombre}
                                        </Text>

                                    </TouchableOpacity>

                                ))}

                        </ScrollView>


                        <Text style={styles.inputLabel}>
                            Monto a retirar
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="$ 0.00"
                            placeholderTextColor="#A0A6A3"
                            value={montoRetiro}
                            onChangeText={
                                setMontoRetiro
                            }
                            keyboardType="decimal-pad"
                        />


                        <TouchableOpacity
                            style={
                                styles.primaryButton
                            }
                            onPress={
                                realizarRetiro
                            }
                        >

                            <Ionicons
                                name="cash-outline"
                                size={20}
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.primaryButtonText
                                }
                            >
                                Registrar retiro
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>


            {/* ==================================================== */}
            {/* MODAL DEPOSITO */}
            {/* ==================================================== */}

            <Modal
                visible={
                    modalDepositoVisible
                }
                transparent
                animationType="slide"
                onRequestClose={() => {

                    setModalDepositoVisible(false);
                    setMontoDeposito('');
                    setCuentaDepositoId('');

                }}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>

                            <View>

                                <Text
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    Depositar efectivo
                                </Text>

                                <Text
                                    style={
                                        styles.modalSubtitle
                                    }
                                >
                                    Efectivo → Banco
                                </Text>

                            </View>


                            <TouchableOpacity
                                onPress={() => {

                                    setModalDepositoVisible(
                                        false
                                    );

                                    setMontoDeposito('');
                                    setCuentaDepositoId('');

                                }}
                                style={
                                    styles.modalClose
                                }
                            >

                                <Ionicons
                                    name="close"
                                    size={22}
                                    color="#555"
                                />

                            </TouchableOpacity>

                        </View>


                        <View style={styles.explanationCard}>

                            <Ionicons
                                name="information-circle-outline"
                                size={20}
                                color={COLOR_PRINCIPAL}
                            />

                            <Text
                                style={
                                    styles.explanationText
                                }
                            >
                                El efectivo disminuirá y el
                                saldo del banco aumentará.
                            </Text>

                        </View>


                        <Text style={styles.inputLabel}>
                            Banco
                        </Text>


                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={
                                false
                            }
                        >

                            {cuentas
                                .filter(
                                    cuenta =>
                                        cuenta.tipo ===
                                        'banco'
                                )
                                .map((cuenta) => (

                                    <TouchableOpacity
                                        key={
                                            cuenta.id
                                        }
                                        style={[
                                            styles.selectionChip,
                                            cuentaDepositoId ===
                                                cuenta.id &&
                                                styles.selectionChipActive,
                                        ]}
                                        onPress={() =>
                                            setCuentaDepositoId(
                                                cuenta.id
                                            )
                                        }
                                    >

                                        <Ionicons
                                            name="business-outline"
                                            size={17}
                                            color={
                                                cuentaDepositoId ===
                                                cuenta.id
                                                    ? COLOR_PRINCIPAL
                                                    : COLOR_GRIS
                                            }
                                        />

                                        <Text
                                            style={[
                                                styles.selectionText,
                                                cuentaDepositoId ===
                                                    cuenta.id &&
                                                    styles.selectionTextActive,
                                            ]}
                                        >
                                            {cuenta.nombre}
                                        </Text>

                                    </TouchableOpacity>

                                ))}

                        </ScrollView>


                        <Text style={styles.inputLabel}>
                            Monto a depositar
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="$ 0.00"
                            placeholderTextColor="#A0A6A3"
                            value={
                                montoDeposito
                            }
                            onChangeText={
                                setMontoDeposito
                            }
                            keyboardType="decimal-pad"
                        />


                        <TouchableOpacity
                            style={
                                styles.primaryButton
                            }
                            onPress={
                                realizarDeposito
                            }
                        >

                            <Ionicons
                                name="arrow-up-circle-outline"
                                size={20}
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.primaryButtonText
                                }
                            >
                                Registrar depósito
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>

        </KeyboardAvoidingView>
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

    loadingScreen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingText: {
        marginTop: 12,
        color: COLOR_GRIS,
        fontSize: 12,
    },


    // ========================================================
    // HEADER
    // ========================================================

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: COLOR_MUY_SUAVE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    headerInfo: {
        flex: 1,
    },

    headerTitle: {
        color: COLOR_TEXTO,
        fontSize: 20,
        fontWeight: '800',
    },

    headerSubtitle: {
        color: COLOR_GRIS,
        fontSize: 11,
        marginTop: 3,
    },

    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: COLOR_PRINCIPAL,
        alignItems: 'center',
        justifyContent: 'center',
    },


    // ========================================================
    // TOTAL
    // ========================================================

    totalCard: {
        backgroundColor: COLOR_PRINCIPAL,
        borderRadius: 18,
        padding: 22,
        marginBottom: 24,
    },

    totalTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    totalLabel: {
        color: '#CDE6E1',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },

    totalAmount: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '800',
        marginTop: 7,
    },

    totalIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor:
            'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    totalDivider: {
        height: 1,
        backgroundColor:
            'rgba(255,255,255,0.18)',
        marginVertical: 18,
    },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    summaryLabel: {
        color: '#CDE6E1',
        fontSize: 9,
    },

    summaryValue: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },


    // ========================================================
    // OPERACIONES
    // ========================================================

    operationsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 27,
    },

    operationButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        marginHorizontal: 3,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
    },

    operationIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 7,
    },

    operationText: {
        color: '#222725',
        fontSize: 10,
        fontWeight: '700',
    },

    operationSmall: {
        color: '#929997',
        fontSize: 8,
        marginTop: 2,
    },


    // ========================================================
    // SECCIONES
    // ========================================================

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 11,
        marginTop: 7,
    },

    sectionTitle: {
        color: COLOR_TEXTO,
        fontSize: 17,
        fontWeight: '700',
    },

    sectionSubtitle: {
        color: COLOR_GRIS,
        fontSize: 10,
        marginTop: 3,
    },

    countBadge: {
        minWidth: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLOR_MUY_SUAVE,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },

    countBadgeText: {
        color: COLOR_PRINCIPAL,
        fontSize: 12,
        fontWeight: '700',
    },


    // ========================================================
    // CUENTAS
    // ========================================================

    accountCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
    },

    accountIcon: {
        width: 45,
        height: 45,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    accountIconBank: {
        backgroundColor: COLOR_MUY_SUAVE,
    },

    accountIconCash: {
        backgroundColor: '#EDF5F2',
    },

    accountInfo: {
        flex: 1,
    },

    accountName: {
        color: '#222725',
        fontSize: 14,
        fontWeight: '700',
    },

    accountType: {
        color: COLOR_GRIS,
        fontSize: 10,
        marginTop: 3,
    },

    accountNumber: {
        color: '#9A9F9D',
        fontSize: 9,
        marginTop: 3,
    },

    accountAmountContainer: {
        alignItems: 'flex-end',
    },

    accountAmount: {
        color: COLOR_PRINCIPAL,
        fontSize: 15,
        fontWeight: '800',
    },

    availableText: {
        color: '#999F9C',
        fontSize: 8,
        marginTop: 3,
    },


    // ========================================================
    // EMPTY
    // ========================================================

    emptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        marginBottom: 20,
    },

    emptyIcon: {
        width: 55,
        height: 55,
        borderRadius: 15,
        backgroundColor: COLOR_MUY_SUAVE,
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
        fontSize: 11,
        lineHeight: 18,
    },

    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLOR_PRINCIPAL,
        paddingHorizontal: 17,
        paddingVertical: 11,
        borderRadius: 11,
        marginTop: 17,
        gap: 5,
    },

    emptyButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    smallEmptyCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        padding: 25,
        alignItems: 'center',
        marginBottom: 20,
    },

    smallEmptyText: {
        color: '#858C89',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 8,
    },


    // ========================================================
    // MOVIMIENTOS
    // ========================================================

    movementCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
    },

    movementIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    movementIconTransferencia: {
        backgroundColor: COLOR_MUY_SUAVE,
    },

    movementIconRetiro: {
        backgroundColor: '#F8EEEE',
    },

    movementIconDeposito: {
        backgroundColor: '#EDF5F2',
    },

    movementInfo: {
        flex: 1,
        paddingRight: 5,
    },

    movementTitle: {
        color: '#222725',
        fontSize: 12,
        fontWeight: '700',
    },

    movementRoute: {
        color: COLOR_PRINCIPAL,
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    },

    movementAuthor: {
        color: '#9A9F9D',
        fontSize: 8,
        marginTop: 4,
    },

    movementAmountContainer: {
        alignItems: 'flex-end',
        minWidth: 65,
    },

    movementAmount: {
        color: COLOR_PRINCIPAL,
        fontSize: 13,
        fontWeight: '800',
    },

    movementDate: {
        color: '#999F9C',
        fontSize: 8,
        marginTop: 3,
    },


    // ========================================================
    // INFO
    // ========================================================

    infoCard: {
        flexDirection: 'row',
        backgroundColor: COLOR_MUY_SUAVE,
        borderRadius: 14,
        padding: 15,
        marginTop: 20,
    },

    infoIcon: {
        marginRight: 10,
    },

    infoContent: {
        flex: 1,
    },

    infoTitle: {
        color: COLOR_OSCURO,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
    },

    infoText: {
        color: '#68736F',
        fontSize: 10,
        lineHeight: 16,
    },


    // ========================================================
    // FOOTER
    // ========================================================

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E3E7E6',
        gap: 5,
    },

    footerText: {
        color: COLOR_OSCURO,
        fontSize: 10,
        fontWeight: '600',
    },


    // ========================================================
    // MODALES
    // ========================================================

    modalOverlay: {
        flex: 1,
        backgroundColor:
            'rgba(0,0,0,0.42)',
        justifyContent: 'flex-end',
    },

    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom:
            Platform.OS === 'ios'
                ? 35
                : 25,
        maxHeight: '90%',
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },

    modalTitle: {
        color: COLOR_TEXTO,
        fontSize: 19,
        fontWeight: '800',
    },

    modalSubtitle: {
        color: COLOR_GRIS,
        fontSize: 10,
        marginTop: 3,
    },

    modalClose: {
        width: 35,
        height: 35,
        borderRadius: 11,
        backgroundColor: '#F3F4F3',
        alignItems: 'center',
        justifyContent: 'center',
    },


    // ========================================================
    // INPUTS
    // ========================================================

    inputLabel: {
        color: '#303634',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 7,
        marginTop: 7,
    },

    input: {
        height: 47,
        borderWidth: 1,
        borderColor: '#E1E6E4',
        borderRadius: 12,
        paddingHorizontal: 14,
        color: COLOR_TEXTO,
        fontSize: 13,
        backgroundColor: '#FFFFFF',
        marginBottom: 7,
    },


    // ========================================================
    // TIPOS
    // ========================================================

    typeRow: {
        flexDirection: 'row',
        gap: 7,
        marginBottom: 8,
    },

    typeButton: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E6E4',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 5,
    },

    typeButtonActive: {
        borderColor: COLOR_PRINCIPAL,
        backgroundColor: COLOR_MUY_SUAVE,
    },

    typeButtonText: {
        color: COLOR_GRIS,
        fontSize: 10,
        fontWeight: '600',
    },

    typeButtonTextActive: {
        color: COLOR_PRINCIPAL,
        fontWeight: '800',
    },


    // ========================================================
    // CHIPS
    // ========================================================

    selectionScroll: {
        marginBottom: 10,
    },

    selectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1E6E4',
        borderRadius: 11,
        paddingHorizontal: 12,
        height: 42,
        marginRight: 7,
        gap: 5,
    },

    selectionChipActive: {
        borderColor: COLOR_PRINCIPAL,
        backgroundColor: COLOR_MUY_SUAVE,
    },

    selectionText: {
        color: COLOR_GRIS,
        fontSize: 10,
        fontWeight: '600',
    },

    selectionTextActive: {
        color: COLOR_PRINCIPAL,
        fontWeight: '800',
    },


    // ========================================================
    // BOTON PRINCIPAL
    // ========================================================

    primaryButton: {
        height: 50,
        borderRadius: 13,
        backgroundColor: COLOR_PRINCIPAL,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
        marginTop: 18,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },


    // ========================================================
    // EXPLICACION
    // ========================================================

    explanationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLOR_MUY_SUAVE,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
    },

    explanationText: {
        flex: 1,
        color: '#68736F',
        fontSize: 10,
        lineHeight: 15,
        marginLeft: 8,
    },

});