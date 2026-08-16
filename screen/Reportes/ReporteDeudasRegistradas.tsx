import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
} from 'react-native';

import React, { useEffect, useMemo, useState } from 'react';

import { db, auth } from '../../firebase/FirebaseConfig';

import {
    ref,
    onValue,
    remove,
    update,
} from 'firebase/database';

import { Ionicons } from '@expo/vector-icons';

export default function ReporteDeudasRegistradas({
    navigation,
}: any) {

    // ============================================================
    // ESTADOS
    // ============================================================

    const [tipoVista, setTipoVista] = useState<
        'deudas' | 'fijos' | 'cuentas' | 'rapidos'
    >('deudas');

    const [deudas, setDeudas] = useState<any[]>([]);
    const [gastosFijos, setGastosFijos] = useState<any[]>([]);
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [movimientosCuentas, setMovimientosCuentas] = useState<any[]>([]);

    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [loading, setLoading] = useState(true);
    const [idPareja, setIdPareja] = useState<string | null>(null);

    // ============================================================
    // MODAL EDICIÓN
    // ============================================================

    const [modalVisible, setModalVisible] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);

    const [nuevoMonto, setNuevoMonto] = useState('');
    const [nuevaCuota, setNuevaCuota] = useState('');
    const [nuevaFechaPago, setNuevaFechaPago] = useState('');
    const [nuevoNombre, setNuevoNombre] = useState('');
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [nuevoMotivo, setNuevoMotivo] = useState('');

    // ============================================================
    // CONFIGURACIÓN HEADER
    // ============================================================

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            setLoading(false);
            return;
        }

        const userRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        const unsubscribe = onValue(
            userRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data && data.idPareja) {
                    setIdPareja(data.idPareja);
                } else {
                    setLoading(false);
                }
            },
            {
                onlyOnce: true,
            }
        );

        return () => unsubscribe();
    }, [navigation]);

    // ============================================================
    // CARGAR DATOS
    // ============================================================

    useEffect(() => {
        if (!idPareja) return;

        setLoading(true);

        const deudasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        const fijosRef = ref(
            db,
            `parejas/${idPareja}/gastosFijos`
        );

        const movimientosRef = ref(
            db,
            `parejas/${idPareja}/movimientos`
        );

        const movimientosCuentasRef = ref(
            db,
            `parejas/${idPareja}/movimientosCuentas`
        );

        const unsubDeudas = onValue(
            deudasRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const listaDeudas = Object.keys(data).map(
                        (key) => ({
                            id: key,
                            ...data[key],
                        })
                    );

                    listaDeudas.sort(
                        (a, b) =>
                            new Date(
                                b.fechaRegistro || 0
                            ).getTime() -
                            new Date(
                                a.fechaRegistro || 0
                            ).getTime()
                    );

                    setDeudas(listaDeudas);
                } else {
                    setDeudas([]);
                }
            },
            (error) => {
                console.error(
                    'Error cargando deudas:',
                    error
                );
            }
        );

        const unsubFijos = onValue(
            fijosRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const listaFijos = Object.keys(data).map(
                        (key) => ({
                            id: key,
                            ...data[key],
                        })
                    );

                    listaFijos.sort(
                        (a, b) =>
                            new Date(
                                b.fechaRegistro || 0
                            ).getTime() -
                            new Date(
                                a.fechaRegistro || 0
                            ).getTime()
                    );

                    setGastosFijos(listaFijos);
                } else {
                    setGastosFijos([]);
                }
            },
            (error) => {
                console.error(
                    'Error cargando gastos fijos:',
                    error
                );
            }
        );

        const unsubMovimientos = onValue(
            movimientosRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const listaMovs = Object.keys(data).map(
                        (key) => ({
                            id: key,
                            ...data[key],
                        })
                    );

                    setMovimientos(listaMovs);
                } else {
                    setMovimientos([]);
                }

                setLoading(false);
            },
            (error) => {
                console.error(
                    'Error cargando movimientos:',
                    error
                );

                setLoading(false);
            }
        );

        const unsubMovimientosCuentas = onValue(
            movimientosCuentasRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const lista = Object.keys(data).map(
                        (key) => ({
                            id: key,
                            ...data[key],
                        })
                    );

                    lista.sort(
                        (a, b) =>
                            new Date(
                                b.fecha || 0
                            ).getTime() -
                            new Date(
                                a.fecha || 0
                            ).getTime()
                    );

                    setMovimientosCuentas(lista);
                } else {
                    setMovimientosCuentas([]);
                }
            },
            (error) => {
                console.error(
                    'Error cargando movimientos de cuentas:',
                    error
                );
            }
        );

        return () => {
            unsubDeudas();
            unsubFijos();
            unsubMovimientos();
            unsubMovimientosCuentas();
        };
    }, [idPareja]);

    // ============================================================
    // OBTENER PAGOS ASOCIADOS A DEUDA
    // ============================================================

    const obtenerPagosAsociados = (deuda: any) => {
        return movimientos.filter((mov) => {

            if (
                mov.deudaId &&
                mov.deudaId === deuda.id
            ) {
                return true;
            }

            const desc = (
                mov.descripcion ||
                mov.entidadDeuda ||
                mov.entidad ||
                ''
            ).toLowerCase();

            const entidad = (
                deuda.entidad || ''
            ).toLowerCase();

            return (
                (entidad &&
                    desc.includes(entidad)) ||
                (
                    mov.categoria === deuda.categoria &&
                    typeof mov.tipo === 'string' &&
                    mov.tipo.includes('pago')
                )
            );
        });
    };

    // ============================================================
    // PROCESAR DEUDAS
    // ============================================================

    const deudasProcesadas = useMemo(() => {

        const tarjetas = deudas.filter(
            (item) => item.tipo === 'tarjeta'
        );

        const consumosTarjeta = deudas.filter(
            (item) =>
                item.tipo === 'consumoTarjeta'
        );

        const deudasNormales = deudas.filter(
            (item) =>
                item.tipo !== 'tarjeta' &&
                item.tipo !== 'consumoTarjeta'
        );

        // --------------------------------------------------------
        // TARJETAS
        // --------------------------------------------------------

        const tarjetasProcesadas = tarjetas.map(
            (tarjeta) => {

                const cupoTotal =
                    Number(tarjeta.cupoTotal) || 0;

                const consumos =
                    consumosTarjeta.filter(
                        (consumo) =>
                            consumo.tarjetaId === tarjeta.id
                    );

                const totalConsumido =
                    consumos.reduce(
                        (sum, consumo) =>
                            sum +
                            (Number(consumo.monto) || 0),
                        0
                    );

                const pagosTarjeta =
                    movimientos.filter((mov) => {

                        if (
                            mov.deudaId &&
                            consumos.some(
                                (consumo) =>
                                    consumo.id ===
                                    mov.deudaId
                            )
                        ) {
                            return true;
                        }

                        const descripcion = (
                            mov.descripcion ||
                            mov.entidadDeuda ||
                            mov.entidad ||
                            ''
                        ).toLowerCase();

                        const banco = (
                            tarjeta.entidad || ''
                        ).toLowerCase();

                        return (
                            banco &&
                            descripcion.includes(banco) &&
                            typeof mov.tipo === 'string' &&
                            mov.tipo.includes('pago')
                        );
                    });

                const totalPagado =
                    pagosTarjeta.reduce(
                        (sum, mov) =>
                            sum +
                            (Number(mov.monto) || 0),
                        0
                    );

                const deudaPendiente =
                    Math.max(
                        0,
                        totalConsumido -
                        totalPagado
                    );

                const cupoDisponible =
                    Math.max(
                        0,
                        cupoTotal -
                        totalConsumido +
                        totalPagado
                    );

                return {
                    ...tarjeta,
                    tipo: 'tarjeta',
                    cupoTotal,
                    totalConsumido,
                    totalPagado,
                    montoRestante:
                        deudaPendiente,
                    cupoDisponible,
                    consumos,
                };
            }
        );

        // --------------------------------------------------------
        // CONSUMOS SIN TARJETA
        // --------------------------------------------------------

        const consumosSinTarjeta =
            consumosTarjeta
                .filter(
                    (consumo) =>
                        !tarjetas.some(
                            (tarjeta) =>
                                tarjeta.id ===
                                consumo.tarjetaId
                        )
                )
                .map((consumo) => {

                    const pagos =
                        obtenerPagosAsociados(
                            consumo
                        );

                    const totalPagado =
                        pagos.reduce(
                            (sum, mov) =>
                                sum +
                                (Number(
                                    mov.monto
                                ) || 0),
                            0
                        );

                    const monto =
                        Number(
                            consumo.monto
                        ) || 0;

                    return {
                        ...consumo,
                        montoRestante:
                            Math.max(
                                0,
                                monto -
                                totalPagado
                            ),
                        totalPagado,
                        consumoSinTarjeta: true,
                    };
                });

        // --------------------------------------------------------
        // DEUDAS NORMALES
        // --------------------------------------------------------

        const normalesProcesadas =
            deudasNormales.map((deuda) => {

                const pagosAsociados =
                    obtenerPagosAsociados(
                        deuda
                    );

                const totalPagado =
                    pagosAsociados.reduce(
                        (sum, mov) =>
                            sum +
                            (Number(
                                mov.monto
                            ) || 0),
                        0
                    );

                const montoOriginal =
                    Number(
                        deuda.monto
                    ) || 0;

                const saldoPendiente =
                    Math.max(
                        0,
                        montoOriginal -
                        totalPagado
                    );

                return {
                    ...deuda,
                    montoRestante:
                        saldoPendiente,
                    totalPagado,
                };
            });

        return [
            ...tarjetasProcesadas,
            ...consumosSinTarjeta,
            ...normalesProcesadas,
        ];

    }, [deudas, movimientos]);

    // ============================================================
    // PROCESAR GASTOS FIJOS
    // ============================================================

    const fijosConSaldo = useMemo(() => {

        return gastosFijos.map((gasto) => {

            const pagosAsociados =
                movimientos.filter((mov) => {

                    const desc = (
                        mov.descripcion || ''
                    ).toLowerCase();

                    const nombreFijo = (
                        gasto.nombre || ''
                    ).toLowerCase();

                    const catFijo = (
                        gasto.categoria || ''
                    ).toLowerCase();

                    return (
                        (
                            nombreFijo &&
                            desc.includes(
                                nombreFijo
                            )
                        ) ||
                        (
                            catFijo &&
                            desc.includes(
                                catFijo
                            )
                        )
                    );
                });

            const totalPagado =
                pagosAsociados.reduce(
                    (sum, mov) =>
                        sum +
                        (Number(
                            mov.monto
                        ) || 0),
                    0
                );

            const montoEstimado =
                Number(
                    gasto.monto ||
                    gasto.montoEstimado
                ) || 0;

            const saldoPendiente =
                Math.max(
                    0,
                    montoEstimado -
                    totalPagado
                );

            return {
                ...gasto,
                montoRestante:
                    saldoPendiente,
                totalPagado,
                monto:
                    montoEstimado,
            };
        });

    }, [gastosFijos, movimientos]);

    // ============================================================
    // GASTOS RÁPIDOS
    // ============================================================

    const gastosRapidos = useMemo(() => {

        return movimientos
            .filter(
                (mov) =>
                    mov.origen === 'gastoRapido'
            )
            .sort(
                (a, b) =>
                    new Date(
                        b.fecha || 0
                    ).getTime() -
                    new Date(
                        a.fecha || 0
                    ).getTime()
            );

    }, [movimientos]);

    // ============================================================
    // CATEGORÍAS
    // ============================================================

    const categoriasDeudas = [
        'Todas',
        'Tarjeta de Crédito',
        'Préstamo Bancario',
        'Casa Comercial',
        'Operadora Celular',
        'Deuda Familiar',
    ];

    const categoriasFijos = [
        'Todas',
        'Luz',
        'Agua',
        'Internet / Teléfono',
        'Alquiler',
        'Otro',
    ];

    const categoriasRapidos = [
        'Todas',
        'Tienda',
        'Farmacia',
        'Comida',
        'Transporte',
    ];

    // ============================================================
    // LISTA ACTUAL
    // ============================================================

    const listaActual =
        tipoVista === 'deudas'
            ? deudasProcesadas
            : tipoVista === 'fijos'
                ? fijosConSaldo
                : tipoVista === 'cuentas'
                    ? movimientosCuentas
                    : gastosRapidos;

    const categoriasDisponibles =
        tipoVista === 'deudas'
            ? categoriasDeudas
            : tipoVista === 'fijos'
                ? categoriasFijos
                : tipoVista === 'rapidos'
                    ? categoriasRapidos
                    : ['Todas'];

    // ============================================================
    // FILTROS
    // ============================================================

    const itemsFiltrados =
        categoriaFiltro === 'Todas'
            ? listaActual
            : listaActual.filter((item) => {

                const catItem = String(
                    item.categoria || ''
                )
                    .trim()
                    .toLowerCase();

                const catFiltro =
                    categoriaFiltro
                        .trim()
                        .toLowerCase();

                if (
                    catFiltro.includes(
                        'internet'
                    )
                ) {
                    return (
                        catItem.includes(
                            'internet'
                        ) ||
                        catItem.includes(
                            'teléfono'
                        ) ||
                        catItem.includes(
                            'telefono'
                        )
                    );
                }

                return catItem === catFiltro;
            });

    // ============================================================
    // TOTAL
    // ============================================================

    const totalFiltrado =
        tipoVista === 'cuentas'
            ? itemsFiltrados.reduce(
                (acc, item) =>
                    acc +
                    (
                        Number(
                            item.monto
                        ) || 0
                    ),
                0
            )
            : tipoVista === 'rapidos'
                ? itemsFiltrados.reduce(
                    (acc, item) =>
                        acc +
                        (
                            Number(
                                item.monto
                            ) || 0
                        ),
                    0
                )
                : itemsFiltrados.reduce(
                    (acc, item) => {

                        if (
                            item.tipo ===
                            'tarjeta'
                        ) {
                            return acc;
                        }

                        return (
                            acc +
                            (
                                Number(
                                    item.montoRestante
                                ) || 0
                            )
                        );
                    },
                    0
                );

    // ============================================================
    // ELIMINAR DEUDA / FIJO
    // ============================================================

    const eliminarItem = (
        id: string,
        nombre: string
    ) => {

        if (!idPareja) return;

        const rutaNodo =
            tipoVista === 'deudas'
                ? 'deudas'
                : 'gastosFijos';

        Alert.alert(
            'Eliminar Registro',
            `¿Estás seguro de eliminar el registro de ${nombre}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {

                        remove(
                            ref(
                                db,
                                `parejas/${idPareja}/${rutaNodo}/${id}`
                            )
                        )
                            .then(() => {

                                Alert.alert(
                                    'Éxito',
                                    'Registro eliminado correctamente.'
                                );

                            })
                            .catch((error) => {

                                Alert.alert(
                                    'Error',
                                    error.message
                                );

                            });
                    },
                },
            ]
        );
    };

    // ============================================================
    // ABRIR EDICIÓN
    // ============================================================

    const abrirEdicion = (item: any) => {

        setItemSeleccionado(item);

        // --------------------------------------------------------
        // GASTO RÁPIDO
        // --------------------------------------------------------

        if (
            tipoVista === 'rapidos'
        ) {

            setNuevoMonto(
                Number(
                    item.monto || 0
                ).toString()
            );

            const descripcion =
                String(
                    item.descripcion || ''
                );

            let motivo = descripcion;

            if (
                descripcion.includes(
                    ' - '
                )
            ) {
                motivo =
                    descripcion
                        .split(' - ')
                        .slice(1)
                        .join(' - ');
            }

            setNuevoMotivo(
                motivo
            );

            setNuevaCategoria(
                item.categoria ||
                'Tienda'
            );

            setModalVisible(true);
            return;
        }

        // --------------------------------------------------------
        // RESTO DE REGISTROS
        // --------------------------------------------------------

        if (
            item.tipo ===
            'tarjeta'
        ) {

            setNuevoMonto(
                Number(
                    item.cupoTotal || 0
                ).toString()
            );

        } else {

            setNuevoMonto(
                Number(
                    item.monto || 0
                ).toString()
            );
        }

        setNuevaCuota(
            item.cuotaPagar
                ? item.cuotaPagar.toString()
                : ''
        );

        setNuevaFechaPago(
            item.fechaMaxPago || ''
        );

        setNuevoNombre(
            item.nombre ||
            item.entidad ||
            item.tarjetaBanco ||
            ''
        );

        setModalVisible(true);
    };

    // ============================================================
    // ACTUALIZAR MOVIMIENTO DE CUENTA
    // ============================================================

    const actualizarMovimientoCuentaRapido =
        async (
            gasto: any,
            nuevoMontoNumero: number,
            nuevaDescripcion: string
        ) => {

            if (!idPareja) return;

            const movimientosRapidos =
                movimientosCuentas.filter(
                    (mov) =>
                        mov.tipo === 'gasto' &&
                        mov.cuentaOrigenId ===
                        gasto.cuentaOrigenId
                );

            let movimientoRelacionado =
                movimientosRapidos.find(
                    (mov) =>
                        mov.gastoId ===
                        gasto.id
                );

            if (!movimientoRelacionado) {

                movimientoRelacionado =
                    movimientosRapidos.find(
                        (mov) => {

                            const mismaFecha =
                                mov.fecha ===
                                gasto.fecha;

                            const mismoMonto =
                                Number(
                                    mov.monto
                                ) ===
                                Number(
                                    gasto.monto
                                );

                            return (
                                mismaFecha &&
                                mismoMonto
                            );
                        }
                    );
            }

            if (
                movimientoRelacionado
            ) {

                await update(
                    ref(
                        db,
                        `parejas/${idPareja}/movimientosCuentas/${movimientoRelacionado.id}`
                    ),
                    {
                        monto:
                            nuevoMontoNumero,
                        descripcion:
                            nuevaDescripcion,
                    }
                );
            }
        };

    // ============================================================
    // GUARDAR EDICIÓN
    // ============================================================

    const guardarEdicion = async () => {

        if (
            !idPareja ||
            !itemSeleccionado
        ) {
            return;
        }

        if (!nuevoMonto) {

            Alert.alert(
                'Atención',
                'El monto no puede estar vacío.'
            );

            return;
        }

        const montoNuevo =
            parseFloat(
                nuevoMonto
            );

        if (
            isNaN(montoNuevo) ||
            montoNuevo <= 0
        ) {

            Alert.alert(
                'Atención',
                'Ingresa un monto válido.'
            );

            return;
        }

        try {

            // ====================================================
            // GASTO RÁPIDO
            // ====================================================

            if (
                tipoVista ===
                'rapidos'
            ) {

                const montoAnterior =
                    Number(
                        itemSeleccionado.monto
                    ) || 0;

                const diferencia =
                    montoNuevo -
                    montoAnterior;

                const cuentaId =
                    itemSeleccionado.cuentaOrigenId;

                if (!cuentaId) {

                    Alert.alert(
                        'Error',
                        'Este gasto rápido no tiene una cuenta de origen asociada.'
                    );

                    return;
                }

                const cuentaRef =
                    ref(
                        db,
                        `parejas/${idPareja}/cuentas/${cuentaId}`
                    );

                const cuentaSnapshot =
                    await new Promise<any>(
                        (resolve) => {

                            onValue(
                                cuentaRef,
                                (snap) => {
                                    resolve(
                                        snap
                                    );
                                },
                                {
                                    onlyOnce:
                                        true,
                                }
                            );
                        }
                    );

                const cuentaData =
                    cuentaSnapshot.val();

                if (!cuentaData) {

                    Alert.alert(
                        'Error',
                        'La cuenta de origen ya no existe.'
                    );

                    return;
                }

                const saldoActual =
                    Number(
                        cuentaData.saldo
                    ) || 0;

                // Si aumentó el gasto,
                // necesitamos quitar más dinero.
                if (
                    diferencia > 0 &&
                    saldoActual <
                    diferencia
                ) {

                    Alert.alert(
                        'Saldo insuficiente',
                        `La cuenta no tiene suficiente saldo para aumentar el gasto en $${diferencia.toFixed(2)}.`
                    );

                    return;
                }

                const nuevoSaldo =
                    saldoActual -
                    diferencia;

                const motivo =
                    nuevoMotivo.trim();

                const descripcionFinal =
                    motivo
                        ? `${nuevaCategoria} - ${motivo}`
                        : `Gasto rápido: ${nuevaCategoria}`;

                // Actualizar gasto
                await update(
                    ref(
                        db,
                        `parejas/${idPareja}/movimientos/${itemSeleccionado.id}`
                    ),
                    {
                        monto:
                            Number(
                                montoNuevo.toFixed(
                                    2
                                )
                            ),
                        categoria:
                            nuevaCategoria,
                        descripcion:
                            descripcionFinal,
                    }
                );

                // Ajustar cuenta
                await update(
                    cuentaRef,
                    {
                        saldo:
                            Number(
                                nuevoSaldo.toFixed(
                                    2
                                )
                            ),
                    }
                );

                // Actualizar movimiento de cuentas
                await actualizarMovimientoCuentaRapido(
                    itemSeleccionado,
                    Number(
                        montoNuevo.toFixed(
                            2
                        )
                    ),
                    descripcionFinal
                );

                Alert.alert(
                    '¡Éxito!',
                    'Gasto rápido actualizado correctamente.'
                );

                setModalVisible(false);
                setItemSeleccionado(null);

                return;
            }

            // ====================================================
            // DEUDAS / GASTOS FIJOS
            // ====================================================

            const rutaNodo =
                tipoVista === 'deudas'
                    ? 'deudas'
                    : 'gastosFijos';

            const itemRef =
                ref(
                    db,
                    `parejas/${idPareja}/${rutaNodo}/${itemSeleccionado.id}`
                );

            let datosActualizados: any = {};

            if (
                tipoVista ===
                'deudas' &&
                itemSeleccionado.tipo ===
                'tarjeta'
            ) {

                datosActualizados = {
                    cupoTotal:
                        montoNuevo,
                };

            } else if (
                tipoVista ===
                'deudas' &&
                itemSeleccionado.tipo ===
                'consumoTarjeta'
            ) {

                datosActualizados = {
                    monto:
                        montoNuevo,
                    fechaMaxPago:
                        nuevaFechaPago ||
                        'N/A',
                };

            } else if (
                tipoVista ===
                'deudas'
            ) {

                datosActualizados = {
                    monto:
                        montoNuevo,
                    cuotaPagar:
                        parseFloat(
                            nuevaCuota
                        ) || 0,
                    fechaMaxPago:
                        nuevaFechaPago ||
                        'N/A',
                };

            } else {

                datosActualizados = {
                    monto:
                        montoNuevo,
                    nombre:
                        nuevoNombre ||
                        'Gasto Fijo',
                };
            }

            await update(
                itemRef,
                datosActualizados
            );

            Alert.alert(
                '¡Éxito!',
                'Actualizado correctamente.'
            );

            setModalVisible(false);
            setItemSeleccionado(null);

        } catch (error: any) {

            Alert.alert(
                'Error',
                error?.message ||
                'No se pudo actualizar el registro.'
            );
        }
    };

    // ============================================================
    // ELIMINAR GASTO RÁPIDO
    // ============================================================

    const eliminarGastoRapido = (
        item: any
    ) => {

        if (!idPareja) return;

        Alert.alert(
            'Eliminar gasto rápido',
            `¿Quieres eliminar "${item.descripcion || 'este gasto'}"?\n\nEl dinero será devuelto a la cuenta de origen.`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',

                    onPress: async () => {

                        try {

                            const monto =
                                Number(
                                    item.monto
                                ) || 0;

                            const cuentaId =
                                item.cuentaOrigenId;

                            // ------------------------------------
                            // DEVOLVER DINERO A LA CUENTA
                            // ------------------------------------

                            if (
                                cuentaId
                            ) {

                                const cuentaRef =
                                    ref(
                                        db,
                                        `parejas/${idPareja}/cuentas/${cuentaId}`
                                    );

                                const cuentaSnapshot =
                                    await new Promise<any>(
                                        (resolve) => {

                                            onValue(
                                                cuentaRef,
                                                (snap) => {
                                                    resolve(
                                                        snap
                                                    );
                                                },
                                                {
                                                    onlyOnce:
                                                        true,
                                                }
                                            );
                                        }
                                    );

                                const cuentaData =
                                    cuentaSnapshot.val();

                                if (
                                    cuentaData
                                ) {

                                    const saldoActual =
                                        Number(
                                            cuentaData.saldo
                                        ) || 0;

                                    await update(
                                        cuentaRef,
                                        {
                                            saldo:
                                                Number(
                                                    (
                                                        saldoActual +
                                                        monto
                                                    ).toFixed(
                                                        2
                                                    )
                                                ),
                                        }
                                    );
                                }
                            }

                            // ------------------------------------
                            // ELIMINAR MOVIMIENTO DE CUENTA
                            // ------------------------------------

                            const relacionados =
                                movimientosCuentas.filter(
                                    (mov) => {

                                        if (
                                            mov.gastoId &&
                                            mov.gastoId ===
                                            item.id
                                        ) {
                                            return true;
                                        }

                                        return (
                                            mov.tipo ===
                                            'gasto' &&
                                            mov.cuentaOrigenId ===
                                            item.cuentaOrigenId &&
                                            Number(
                                                mov.monto
                                            ) ===
                                            monto &&
                                            mov.fecha ===
                                            item.fecha
                                        );
                                    }
                                );

                            for (
                                const mov of relacionados
                            ) {

                                await remove(
                                    ref(
                                        db,
                                        `parejas/${idPareja}/movimientosCuentas/${mov.id}`
                                    )
                                );
                            }

                            // ------------------------------------
                            // ELIMINAR GASTO
                            // ------------------------------------

                            await remove(
                                ref(
                                    db,
                                    `parejas/${idPareja}/movimientos/${item.id}`
                                )
                            );

                            Alert.alert(
                                'Eliminado',
                                `El gasto fue eliminado y $${monto.toFixed(2)} fue devuelto a la cuenta de origen.`
                            );

                        } catch (
                        error: any
                        ) {

                            Alert.alert(
                                'Error',
                                error?.message ||
                                'No se pudo eliminar el gasto rápido.'
                            );
                        }
                    },
                },
            ]
        );
    };

    // ============================================================
    // ELIMINAR MOVIMIENTO DE CUENTA
    // ============================================================

    const eliminarMovimientoCuenta = (
        item: any
    ) => {

        if (!idPareja) return;

        Alert.alert(
            'Eliminar movimiento',
            '¿Estás seguro de eliminar este movimiento? Se revertirá el saldo afectado en la(s) cuenta(s) correspondiente(s).',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',

                    onPress: async () => {

                        try {

                            const monto =
                                Number(
                                    item.monto
                                ) || 0;

                            // ------------------------------------
                            // CUENTA ORIGEN
                            // ------------------------------------

                            if (
                                item.cuentaOrigenId
                            ) {

                                const cuentaRef =
                                    ref(
                                        db,
                                        `parejas/${idPareja}/cuentas/${item.cuentaOrigenId}`
                                    );

                                const cuentaSnapshot =
                                    await new Promise<any>(
                                        (resolve) => {

                                            onValue(
                                                cuentaRef,
                                                (snap) => {
                                                    resolve(
                                                        snap
                                                    );
                                                },
                                                {
                                                    onlyOnce:
                                                        true,
                                                }
                                            );
                                        }
                                    );

                                const data =
                                    cuentaSnapshot.val();

                                const saldoActual =
                                    Number(
                                        data?.saldo
                                    ) || 0;

                                await update(
                                    cuentaRef,
                                    {
                                        saldo:
                                            saldoActual +
                                            monto,
                                    }
                                );
                            }

                            // ------------------------------------
                            // CUENTA DESTINO
                            // ------------------------------------

                            if (
                                item.cuentaDestinoId
                            ) {

                                const cuentaRef =
                                    ref(
                                        db,
                                        `parejas/${idPareja}/cuentas/${item.cuentaDestinoId}`
                                    );

                                const cuentaSnapshot =
                                    await new Promise<any>(
                                        (resolve) => {

                                            onValue(
                                                cuentaRef,
                                                (snap) => {
                                                    resolve(
                                                        snap
                                                    );
                                                },
                                                {
                                                    onlyOnce:
                                                        true,
                                                }
                                            );
                                        }
                                    );

                                const data =
                                    cuentaSnapshot.val();

                                const saldoActual =
                                    Number(
                                        data?.saldo
                                    ) || 0;

                                await update(
                                    cuentaRef,
                                    {
                                        saldo:
                                            saldoActual -
                                            monto,
                                    }
                                );
                            }

                            await remove(
                                ref(
                                    db,
                                    `parejas/${idPareja}/movimientosCuentas/${item.id}`
                                )
                            );

                            Alert.alert(
                                'Eliminado',
                                'El movimiento fue eliminado y el saldo fue revertido.'
                            );

                        } catch (
                        error: any
                        ) {

                            Alert.alert(
                                'Error',
                                error?.message ||
                                'No se pudo eliminar el movimiento.'
                            );
                        }
                    },
                },
            ]
        );
    };

    // ============================================================
    // ICONOS MOVIMIENTOS CUENTAS
    // ============================================================

    const iconoMovimientoCuenta = (
        tipo: string
    ) => {

        if (
            tipo === 'deposito'
        ) {
            return 'arrow-down-circle-outline';
        }

        if (
            tipo === 'retiro_cajero'
        ) {
            return 'arrow-up-circle-outline';
        }

        if (
            tipo === 'pago_deuda'
        ) {
            return 'card-outline';
        }

        if (
            tipo === 'gasto'
        ) {
            return 'cart-outline';
        }

        return 'swap-horizontal-outline';
    };

    const tituloMovimientoCuenta = (
        tipo: string
    ) => {

        if (
            tipo === 'deposito'
        ) {
            return 'Depósito a Banco';
        }

        if (
            tipo === 'retiro_cajero'
        ) {
            return 'Retiro a Efectivo';
        }

        if (
            tipo === 'pago_deuda'
        ) {
            return 'Pago de Deuda';
        }

        if (
            tipo === 'transferencia'
        ) {
            return 'Transferencia';
        }

        if (
            tipo === 'gasto'
        ) {
            return 'Gasto';
        }

        return 'Movimiento';
    };

    // ============================================================
    // RENDER CUENTAS
    // ============================================================

    const renderItemCuenta = ({
        item,
    }: {
        item: any;
    }) => (

        <View style={styles.cardDeuda}>

            <View style={styles.cardHeaderRow}>

                <View style={styles.badgeCategoria}>

                    <Ionicons
                        name={
                            iconoMovimientoCuenta(
                                item.tipo
                            ) as any
                        }
                        size={12}
                        color="#059669"
                        style={{
                            marginRight: 4,
                        }}
                    />

                    <Text
                        style={
                            styles.badgeText
                        }
                    >
                        {
                            tituloMovimientoCuenta(
                                item.tipo
                            )
                        }
                    </Text>

                </View>

                <View
                    style={
                        styles.cardActions
                    }
                >

                    <TouchableOpacity
                        style={[
                            styles.actionIconBtn,
                            {
                                backgroundColor:
                                    'rgba(239, 68, 68, 0.08)',
                                borderColor:
                                    'rgba(239, 68, 68, 0.2)',
                            },
                        ]}
                        onPress={() =>
                            eliminarMovimientoCuenta(
                                item
                            )
                        }
                    >
                        <Ionicons
                            name="trash-outline"
                            size={13}
                            color="#EF4444"
                        />
                    </TouchableOpacity>

                </View>

            </View>

            <Text
                style={
                    styles.cardEntidad
                }
            >
                {
                    item.descripcion ||
                    tituloMovimientoCuenta(
                        item.tipo
                    )
                }
            </Text>

            <View
                style={
                    styles.gridInfo
                }
            >

                <View
                    style={
                        styles.infoBox
                    }
                >
                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Monto
                    </Text>

                    <Text
                        style={
                            styles.infoValue
                        }
                    >
                        $
                        {Number(
                            item.monto ||
                            0
                        ).toFixed(2)}
                    </Text>
                </View>

                <View
                    style={
                        styles.infoBox
                    }
                >
                    <Text
                        style={
                            styles.infoLabel
                        }
                    >
                        Fecha
                    </Text>

                    <Text
                        style={[
                            styles.infoValue,
                            {
                                fontSize: 11,
                            },
                        ]}
                    >
                        {item.fecha
                            ? new Date(
                                item.fecha
                            ).toLocaleDateString()
                            : 'N/A'}
                    </Text>
                </View>

            </View>

            {
                (
                    item.cuentaOrigenNombre ||
                    item.cuentaDestinoNombre
                ) && (

                    <Text
                        style={
                            styles.cardAutor
                        }
                    >
                        {
                            item.cuentaOrigenNombre
                                ? `Desde: ${item.cuentaOrigenNombre}`
                                : ''
                        }

                        {
                            item.cuentaOrigenNombre &&
                                item.cuentaDestinoNombre
                                ? '  →  '
                                : ''
                        }

                        {
                            item.cuentaDestinoNombre
                                ? `Hacia: ${item.cuentaDestinoNombre}`
                                : ''
                        }
                    </Text>
                )
            }

            {
                item.autor && (

                    <Text
                        style={
                            styles.cardAutor
                        }
                    >
                        Registrado por: {
                            item.autor
                        }
                    </Text>
                )
            }

        </View>
    );

    // ============================================================
    // RENDER GASTO RÁPIDO
    // ============================================================

    const renderItemRapido = ({
        item,
    }: {
        item: any;
    }) => {

        return (

            <View
                style={
                    styles.cardDeuda
                }
            >

                <View
                    style={
                        styles.cardHeaderRow
                    }
                >

                    <View
                        style={
                            styles.badgeCategoria
                        }
                    >

                        <Ionicons
                            name="flash-outline"
                            size={12}
                            color="#059669"
                            style={{
                                marginRight: 4,
                            }}
                        />

                        <Text
                            style={
                                styles.badgeText
                            }
                        >
                            {item.categoria ||
                                'Gasto Rápido'}
                        </Text>

                    </View>

                    <View
                        style={
                            styles.cardActions
                        }
                    >

                        <TouchableOpacity
                            style={
                                styles.actionIconBtn
                            }
                            onPress={() =>
                                abrirEdicion(
                                    item
                                )
                            }
                        >
                            <Ionicons
                                name="pencil"
                                size={13}
                                color="#059669"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionIconBtn,
                                {
                                    backgroundColor:
                                        'rgba(239, 68, 68, 0.08)',
                                    borderColor:
                                        'rgba(239, 68, 68, 0.2)',
                                },
                            ]}
                            onPress={() =>
                                eliminarGastoRapido(
                                    item
                                )
                            }
                        >
                            <Ionicons
                                name="trash-outline"
                                size={13}
                                color="#EF4444"
                            />
                        </TouchableOpacity>

                    </View>

                </View>

                <Text
                    style={
                        styles.cardEntidad
                    }
                >
                    {
                        item.descripcion ||
                        'Gasto rápido'
                    }
                </Text>

                <View
                    style={
                        styles.gridInfoSimple
                    }
                >

                    <View
                        style={
                            styles.infoBox
                        }
                    >

                        <Text
                            style={
                                styles.infoLabel
                            }
                        >
                            Monto
                        </Text>

                        <Text
                            style={[
                                styles.infoValue,
                                {
                                    color:
                                        '#EF4444',
                                    fontSize: 13,
                                },
                            ]}
                        >
                            $
                            {Number(
                                item.monto ||
                                0
                            ).toFixed(2)}
                        </Text>

                    </View>

                    <View
                        style={
                            styles.infoBox
                        }
                    >

                        <Text
                            style={
                                styles.infoLabel
                            }
                        >
                            Fecha
                        </Text>

                        <Text
                            style={[
                                styles.infoValue,
                                {
                                    fontSize: 10,
                                },
                            ]}
                        >
                            {item.fecha
                                ? new Date(
                                    item.fecha
                                ).toLocaleDateString()
                                : 'N/A'}
                        </Text>

                    </View>

                    <View
                        style={
                            styles.infoBox
                        }
                    >

                        <Text
                            style={
                                styles.infoLabel
                            }
                        >
                            Cuenta
                        </Text>

                        <Text
                            style={[
                                styles.infoValue,
                                {
                                    fontSize: 10,
                                },
                            ]}
                        >
                            {
                                item.cuentaOrigenNombre ||
                                'N/A'
                            }
                        </Text>

                    </View>

                </View>

                {
                    item.autor && (

                        <Text
                            style={
                                styles.cardAutor
                            }
                        >
                            Registrado por: {
                                item.autor
                            }
                        </Text>
                    )
                }

            </View>
        );
    };

    // ============================================================
    // RENDER GENERAL
    // ============================================================

    const renderItem = ({
        item,
    }: {
        item: any;
    }) => {

        if (
            tipoVista ===
            'cuentas'
        ) {
            return renderItemCuenta({
                item,
            });
        }

        if (
            tipoVista ===
            'rapidos'
        ) {
            return renderItemRapido({
                item,
            });
        }

        const nombreEntidad =
            tipoVista ===
                'deudas'
                ? item.tipo ===
                    'tarjeta'
                    ? `${item.entidad || 'Banco'} ${item.marcaTarjeta
                        ? `(${item.marcaTarjeta})`
                        : ''
                    }`
                    : item.tipo ===
                        'consumoTarjeta'
                        ? `${item.tarjetaBanco ||
                        'Tarjeta'
                        } ${item.tarjetaMarca
                            ? `(${item.tarjetaMarca})`
                            : ''
                        }`
                        : `${item.entidad ||
                        'Deuda'
                        }`
                : item.nombre ||
                'Gasto Fijo';

        return (

            <View
                style={
                    styles.cardDeuda
                }
            >

                <View
                    style={
                        styles.cardHeaderRow
                    }
                >

                    <View
                        style={
                            styles.badgeCategoria
                        }
                    >

                        <Text
                            style={
                                styles.badgeText
                            }
                        >
                            {
                                item.categoria ||
                                'General'
                            }
                        </Text>

                    </View>

                    <View
                        style={
                            styles.cardActions
                        }
                    >

                        <TouchableOpacity
                            style={
                                styles.actionIconBtn
                            }
                            onPress={() =>
                                abrirEdicion(
                                    item
                                )
                            }
                        >
                            <Ionicons
                                name="pencil"
                                size={13}
                                color="#059669"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionIconBtn,
                                {
                                    backgroundColor:
                                        'rgba(239, 68, 68, 0.08)',
                                    borderColor:
                                        'rgba(239, 68, 68, 0.2)',
                                },
                            ]}
                            onPress={() =>
                                eliminarItem(
                                    item.id,
                                    nombreEntidad
                                )
                            }
                        >
                            <Ionicons
                                name="trash-outline"
                                size={13}
                                color="#EF4444"
                            />
                        </TouchableOpacity>

                    </View>

                </View>

                <Text
                    style={
                        styles.cardEntidad
                    }
                >
                    {nombreEntidad}
                </Text>

                {
                    tipoVista ===
                        'deudas' &&
                        item.tipo ===
                        'tarjeta' ? (

                        <View
                            style={
                                styles.gridInfo
                            }
                        >

                            <View
                                style={
                                    styles.infoBox
                                }
                            >
                                <Text
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Cupo Total
                                </Text>

                                <Text
                                    style={
                                        styles.infoValue
                                    }
                                >
                                    $
                                    {Number(
                                        item.cupoTotal ||
                                        0
                                    ).toFixed(2)}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.infoBox
                                }
                            >
                                <Text style={styles.infoLabel}>
                                    Consumido
                                </Text>



                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:
                                                '#EF4444',
                                        },
                                    ]}
                                >
                                    $
                                    {Number(
                                        item.totalConsumido ||
                                        0
                                    ).toFixed(2)}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.infoBox
                                }
                            >
                                <Text
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Pagado
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:
                                                '#059669',
                                        },
                                    ]}
                                >
                                    $
                                    {Number(
                                        item.totalPagado ||
                                        0
                                    ).toFixed(2)}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.infoBox
                                }
                            >
                                <Text
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Disponible
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:
                                                '#059669',
                                        },
                                    ]}
                                >
                                    $
                                    {Number(
                                        item.cupoDisponible ||
                                        0
                                    ).toFixed(2)}
                                </Text>
                            </View>

                        </View>

                    ) : (

                        <View
                            style={
                                styles.gridInfoSimple
                            }
                        >

                            <View
                                style={
                                    styles.infoBox
                                }
                            >

                                <Text
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Monto / Pendiente
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            color:
                                                '#EF4444',
                                        },
                                    ]}
                                >
                                    $
                                    {Number(
                                        item.montoRestante !==
                                            undefined
                                            ? item.montoRestante
                                            : item.monto ||
                                            0
                                    ).toFixed(2)}
                                </Text>

                            </View>

                            {
                                item.cuotaPagar ? (

                                    <View
                                        style={
                                            styles.infoBox
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            Cuota
                                        </Text>

                                        <Text
                                            style={
                                                styles.infoValue
                                            }
                                        >
                                            $
                                            {Number(
                                                item.cuotaPagar
                                            ).toFixed(2)}
                                        </Text>

                                    </View>

                                ) : null
                            }

                            <View
                                style={
                                    styles.infoBox
                                }
                            >

                                <Text
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Vencimiento
                                </Text>

                                <Text
                                    style={[
                                        styles.infoValue,
                                        {
                                            fontSize:
                                                11,
                                        },
                                    ]}
                                >
                                    {
                                        item.fechaMaxPago ||
                                        item.fechaCaducidad ||
                                        'N/A'
                                    }
                                </Text>

                            </View>

                            {
                                tipoVista === 'deudas' && (

                                    <View
                                        style={
                                            styles.infoBox
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.infoLabel
                                            }
                                        >
                                            Fecha
                                        </Text>

                                        <Text
                                            style={[
                                                styles.infoValue,
                                                {
                                                    fontSize: 11,
                                                },
                                            ]}
                                        >
                                            {
                                                item.fechaRegistro
                                                    ? new Date(
                                                        item.fechaRegistro
                                                    ).toLocaleDateString()
                                                    : 'N/A'
                                            }
                                        </Text>

                                    </View>
                                )
                            }

                        </View>
                    )
                }

                {
                    item.autor && (

                        <Text
                            style={
                                styles.cardAutor
                            }
                        >
                            Registrado por: {
                                item.autor
                            }
                        </Text>
                    )
                }

            </View>
        );
    };

    // ============================================================
    // HEADER
    // ============================================================

    const renderHeader = () => (

        <View>

            <Text
                style={
                    styles.titulo
                }
            >
                Reporte General
            </Text>

            <Text
                style={
                    styles.subtitulo
                }
            >
                Consulta y administra tus compromisos financieros
            </Text>

            {/* ==================================================
                SELECTOR DE VISTA
            ================================================== */}

            <View
                style={
                    styles.tipoVistaContainer
                }
            >

                {/* DEUDAS */}

                <TouchableOpacity
                    style={[
                        styles.tipoVistaBtn,
                        tipoVista ===
                        'deudas' &&
                        styles.tipoVistaBtnActive,
                    ]}
                    onPress={() => {

                        setTipoVista(
                            'deudas'
                        );

                        setCategoriaFiltro(
                            'Todas'
                        );
                    }}
                >

                    <Ionicons
                        name="card-outline"
                        size={15}
                        color={
                            tipoVista ===
                                'deudas'
                                ? '#FFFFFF'
                                : '#64748B'
                        }
                        style={{
                            marginRight: 6,
                        }}
                    />

                    <Text
                        style={[
                            styles.tipoVistaText,
                            tipoVista ===
                            'deudas' &&
                            styles.tipoVistaTextActive,
                        ]}
                    >
                        Deudas
                    </Text>

                </TouchableOpacity>

                {/* GASTOS FIJOS */}

                <TouchableOpacity
                    style={[
                        styles.tipoVistaBtn,
                        tipoVista ===
                        'fijos' &&
                        styles.tipoVistaBtnActive,
                    ]}
                    onPress={() => {

                        setTipoVista(
                            'fijos'
                        );

                        setCategoriaFiltro(
                            'Todas'
                        );
                    }}
                >

                    <Ionicons
                        name="flash-outline"
                        size={15}
                        color={
                            tipoVista ===
                                'fijos'
                                ? '#FFFFFF'
                                : '#64748B'
                        }
                        style={{
                            marginRight: 6,
                        }}
                    />

                    <Text
                        style={[
                            styles.tipoVistaText,
                            tipoVista ===
                            'fijos' &&
                            styles.tipoVistaTextActive,
                        ]}
                    >
                        Gastos Fijos
                    </Text>

                </TouchableOpacity>

                {/* CUENTAS */}

                <TouchableOpacity
                    style={[
                        styles.tipoVistaBtn,
                        tipoVista ===
                        'cuentas' &&
                        styles.tipoVistaBtnActive,
                    ]}
                    onPress={() => {

                        setTipoVista(
                            'cuentas'
                        );

                        setCategoriaFiltro(
                            'Todas'
                        );
                    }}
                >

                    <Ionicons
                        name="swap-horizontal-outline"
                        size={15}
                        color={
                            tipoVista ===
                                'cuentas'
                                ? '#FFFFFF'
                                : '#64748B'
                        }
                        style={{
                            marginRight: 6,
                        }}
                    />

                    <Text
                        style={[
                            styles.tipoVistaText,
                            tipoVista ===
                            'cuentas' &&
                            styles.tipoVistaTextActive,
                        ]}
                    >
                        Cuentas
                    </Text>

                </TouchableOpacity>

                {/* GASTOS RÁPIDOS */}

                <TouchableOpacity
                    style={[
                        styles.tipoVistaBtn,
                        tipoVista ===
                        'rapidos' &&
                        styles.tipoVistaBtnActive,
                    ]}
                    onPress={() => {

                        setTipoVista(
                            'rapidos'
                        );

                        setCategoriaFiltro(
                            'Todas'
                        );
                    }}
                >

                    <Ionicons
                        name="flash"
                        size={15}
                        color={
                            tipoVista ===
                                'rapidos'
                                ? '#FFFFFF'
                                : '#64748B'
                        }
                        style={{
                            marginRight: 6,
                        }}
                    />

                    <Text
                        style={[
                            styles.tipoVistaText,
                            tipoVista ===
                            'rapidos' &&
                            styles.tipoVistaTextActive,
                        ]}
                    >
                        Gastos Rápidos
                    </Text>

                </TouchableOpacity>

            </View>

            {/* ==================================================
                FILTROS
            ================================================== */}

            <FlatList
                horizontal
                showsHorizontalScrollIndicator={
                    false
                }
                data={
                    categoriasDisponibles
                }
                keyExtractor={(
                    item
                ) => item}
                contentContainerStyle={
                    styles.filterScroll
                }
                renderItem={({
                    item: cat,
                }) => (

                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            categoriaFiltro ===
                            cat &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() =>
                            setCategoriaFiltro(
                                cat
                            )
                        }
                    >

                        <Text
                            style={[
                                styles.filterText,
                                categoriaFiltro ===
                                cat &&
                                styles.filterTextSelected,
                            ]}
                        >
                            {cat}
                        </Text>

                    </TouchableOpacity>
                )}
            />

            {/* ==================================================
                RESUMEN
            ================================================== */}

            <View
                style={
                    styles.resumenCard
                }
            >

                <Text
                    style={
                        styles.resumenTitle
                    }
                >
                    {
                        tipoVista ===
                            'cuentas'
                            ? 'Total Movido en Cuentas'
                            : tipoVista ===
                                'rapidos'
                                ? `Total Gastos Rápidos: ${categoriaFiltro}`
                                : `Total Pendiente: ${categoriaFiltro}`
                    }
                </Text>

                <Text
                    style={
                        styles.resumenAmount
                    }
                >
                    $
                    {totalFiltrado.toFixed(
                        2
                    )}
                </Text>

                <Text
                    style={
                        styles.resumenSub
                    }
                >
                    {
                        itemsFiltrados.length
                    }{' '}
                    {
                        itemsFiltrados.length ===
                            1
                            ? 'registro encontrado'
                            : 'registros encontrados'
                    }
                </Text>

            </View>

        </View>
    );

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (

        <View
            style={
                styles.rootContainer
            }
        >

            <FlatList
                data={
                    itemsFiltrados
                }
                keyExtractor={(
                    item
                ) => item.id}
                renderItem={
                    renderItem
                }
                ListHeaderComponent={
                    renderHeader
                }
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={
                    false
                }
                ListEmptyComponent={

                    loading ? (

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            Cargando registros...
                        </Text>

                    ) : (

                        <Text
                            style={
                                styles.emptyText
                            }
                        >
                            No hay registros en esta categoría.
                        </Text>
                    )
                }
            />

            {/* ==================================================
                MODAL EDICIÓN
            ================================================== */}

            <Modal
                visible={
                    modalVisible
                }
                transparent={
                    true
                }
                animationType="fade"
                onRequestClose={() =>
                    setModalVisible(
                        false
                    )
                }
            >

                <View
                    style={
                        styles.modalOverlay
                    }
                >

                    <View
                        style={
                            styles.modalContent
                        }
                    >

                        <Text
                            style={
                                styles.modalTitle
                            }
                        >
                            {
                                tipoVista ===
                                    'rapidos'
                                    ? 'Editar Gasto Rápido'
                                    : 'Editar Registro'
                            }
                        </Text>

                        {/* ==================================================
                            GASTO RÁPIDO
                        ================================================== */}

                        {
                            tipoVista ===
                                'rapidos' ? (

                                <>

                                    <Text
                                        style={
                                            styles.modalLabel
                                        }
                                    >
                                        Categoría
                                    </Text>

                                    <View
                                        style={
                                            styles.modalCategorias
                                        }
                                    >

                                        {
                                            [
                                                {
                                                    id: 'Tienda',
                                                    icon: 'storefront-outline',
                                                },
                                                {
                                                    id: 'Farmacia',
                                                    icon: 'medical-outline',
                                                },
                                                {
                                                    id: 'Comida',
                                                    icon: 'fast-food-outline',
                                                },
                                                {
                                                    id: 'Transporte',
                                                    icon: 'car-outline',
                                                },
                                            ].map(
                                                (
                                                    cat
                                                ) => (

                                                    <TouchableOpacity
                                                        key={
                                                            cat.id
                                                        }
                                                        style={[
                                                            styles.modalCategoriaBtn,
                                                            nuevaCategoria ===
                                                            cat.id &&
                                                            styles.modalCategoriaActive,
                                                        ]}
                                                        onPress={() =>
                                                            setNuevaCategoria(
                                                                cat.id
                                                            )
                                                        }
                                                    >

                                                        <Ionicons
                                                            name={
                                                                cat.icon as any
                                                            }
                                                            size={
                                                                15
                                                            }
                                                            color={
                                                                nuevaCategoria ===
                                                                    cat.id
                                                                    ? '#FFFFFF'
                                                                    : '#059669'
                                                            }
                                                        />

                                                        <Text
                                                            style={[
                                                                styles.modalCategoriaText,
                                                                nuevaCategoria ===
                                                                cat.id &&
                                                                styles.modalCategoriaTextActive,
                                                            ]}
                                                        >
                                                            {
                                                                cat.id
                                                            }
                                                        </Text>

                                                    </TouchableOpacity>
                                                )
                                            )
                                        }

                                    </View>

                                    <Text
                                        style={
                                            styles.modalLabel
                                        }
                                    >
                                        Monto
                                    </Text>

                                    <TextInput
                                        style={
                                            styles.modalInput
                                        }
                                        keyboardType="numeric"
                                        value={
                                            nuevoMonto
                                        }
                                        onChangeText={
                                            setNuevoMonto
                                        }
                                        placeholder="0.00"
                                        placeholderTextColor="#94A3B8"
                                    />

                                    <Text
                                        style={
                                            styles.modalLabel
                                        }
                                    >
                                        Motivo
                                    </Text>

                                    <TextInput
                                        style={
                                            styles.modalInput
                                        }
                                        value={
                                            nuevoMotivo
                                        }
                                        onChangeText={
                                            setNuevoMotivo
                                        }
                                        placeholder="Ej. Pan, café, pasaje..."
                                        placeholderTextColor="#94A3B8"
                                    />

                                </>

                            ) : (

                                <>
                                    {
                                        tipoVista ===
                                        'fijos' && (

                                            <>
                                                <Text
                                                    style={
                                                        styles.modalLabel
                                                    }
                                                >
                                                    Nombre del Gasto
                                                </Text>

                                                <TextInput
                                                    style={
                                                        styles.modalInput
                                                    }
                                                    value={
                                                        nuevoNombre
                                                    }
                                                    onChangeText={
                                                        setNuevoNombre
                                                    }
                                                    placeholderTextColor="#94A3B8"
                                                />
                                            </>
                                        )
                                    }

                                    <Text
                                        style={
                                            styles.modalLabel
                                        }
                                    >
                                        {
                                            tipoVista ===
                                                'deudas' &&
                                                itemSeleccionado?.tipo ===
                                                'tarjeta'
                                                ? 'Cupo Total'
                                                : 'Monto / Saldo'
                                        }
                                    </Text>

                                    <TextInput
                                        style={
                                            styles.modalInput
                                        }
                                        keyboardType="numeric"
                                        value={
                                            nuevoMonto
                                        }
                                        onChangeText={
                                            setNuevoMonto
                                        }
                                        placeholder="0.00"
                                        placeholderTextColor="#94A3B8"
                                    />

                                    {
                                        tipoVista ===
                                        'deudas' &&
                                        itemSeleccionado?.tipo !==
                                        'tarjeta' && (

                                            <>

                                                <Text
                                                    style={
                                                        styles.modalLabel
                                                    }
                                                >
                                                    Cuota a Pagar
                                                </Text>

                                                <TextInput
                                                    style={
                                                        styles.modalInput
                                                    }
                                                    keyboardType="numeric"
                                                    value={
                                                        nuevaCuota
                                                    }
                                                    onChangeText={
                                                        setNuevaCuota
                                                    }
                                                    placeholder="0.00"
                                                    placeholderTextColor="#94A3B8"
                                                />

                                                <Text
                                                    style={
                                                        styles.modalLabel
                                                    }
                                                >
                                                    Fecha de Vencimiento
                                                </Text>

                                                <TextInput
                                                    style={
                                                        styles.modalInput
                                                    }
                                                    value={
                                                        nuevaFechaPago
                                                    }
                                                    onChangeText={
                                                        setNuevaFechaPago
                                                    }
                                                    placeholder="DD/MM/YYYY"
                                                    placeholderTextColor="#94A3B8"
                                                />

                                            </>
                                        )
                                    }

                                </>
                            )
                        }

                        {/* ==================================================
                            BOTONES
                        ================================================== */}

                        <View
                            style={
                                styles.modalButtonsRow
                            }
                        >

                            <TouchableOpacity
                                style={
                                    styles.modalBtnCancel
                                }
                                onPress={() => {

                                    setModalVisible(
                                        false
                                    );

                                    setItemSeleccionado(
                                        null
                                    );
                                }}
                            >

                                <Text
                                    style={
                                        styles.modalBtnCancelText
                                    }
                                >
                                    Cancelar
                                </Text>

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={
                                    styles.modalBtnSave
                                }
                                onPress={
                                    guardarEdicion
                                }
                            >

                                <Text
                                    style={
                                        styles.modalBtnSaveText
                                    }
                                >
                                    Guardar
                                </Text>

                            </TouchableOpacity>

                        </View>

                    </View>

                </View>

            </Modal>

        </View>
    );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

    rootContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    container: {
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 40,
    },

    titulo: {
        color: '#1E293B',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },

    subtitulo: {
        color: '#64748B',
        fontSize: 12,
        marginBottom: 14,
    },

    // ==========================================================
    // BOTONES DE VISTA
    // ==========================================================

    tipoVistaContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },

    tipoVistaBtn: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 9,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9,
    },

    tipoVistaBtnActive: {
        backgroundColor: '#059669',
    },

    tipoVistaText: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '600',
    },

    tipoVistaTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    // ==========================================================
    // FILTROS
    // ==========================================================

    filterScroll: {
        paddingVertical: 2,
        marginBottom: 12,
    },

    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        marginRight: 6,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    filterChipSelected: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },

    filterText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
    },

    filterTextSelected: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },

    // ==========================================================
    // RESUMEN
    // ==========================================================

    resumenCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },

    resumenTitle: {
        color: '#64748B',
        fontSize: 11,
        marginBottom: 2,
    },

    resumenAmount: {
        color: '#059669',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 2,
    },

    resumenSub: {
        color: '#94A3B8',
        fontSize: 10,
    },

    // ==========================================================
    // TARJETAS
    // ==========================================================

    cardDeuda: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.02,
        shadowRadius: 2,
        elevation: 1,
    },

    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },

    badgeCategoria: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        flexDirection: 'row',
        alignItems: 'center',
    },

    badgeText: {
        color: '#059669',
        fontSize: 10,
        fontWeight: '600',
    },

    cardActions: {
        flexDirection: 'row',
    },

    actionIconBtn: {
        width: 26,
        height: 26,
        borderRadius: 6,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
    },

    cardEntidad: {
        color: '#1E293B',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },

    gridInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 6,
    },

    gridInfoSimple: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 6,
    },

    infoBox: {
        width: '23%',
        alignItems: 'flex-start',
        marginBottom: 6,
    },

    infoLabel: {
        color: '#64748B',
        fontSize: 9,
        marginBottom: 1,
    },

    infoValue: {
        color: '#1E293B',
        fontSize: 11,
        fontWeight: 'bold',
    },

    cardAutor: {
        color: '#94A3B8',
        fontSize: 9,
        marginTop: 6,
        textAlign: 'right',
    },

    emptyText: {
        color: '#64748B',
        textAlign: 'center',
        marginTop: 30,
        fontSize: 12,
    },

    // ==========================================================
    // MODAL
    // ==========================================================

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },

    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    modalTitle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
    },

    modalLabel: {
        color: '#64748B',
        fontSize: 11,
        marginBottom: 3,
    },

    modalInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 9,
        color: '#1E293B',
        fontSize: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    // ==========================================================
    // CATEGORÍAS GASTO RÁPIDO
    // ==========================================================

    modalCategorias: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },

    modalCategoriaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 9,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginRight: 5,
        marginBottom: 5,
    },

    modalCategoriaActive: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },

    modalCategoriaText: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4,
    },

    modalCategoriaTextActive: {
        color: '#FFFFFF',
    },

    // ==========================================================
    // BOTONES MODAL
    // ==========================================================

    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },

    modalBtnCancel: {
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 8,
        marginRight: 6,
        backgroundColor: '#F1F5F9',
    },

    modalBtnCancelText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },

    modalBtnSave: {
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#059669',
    },

    modalBtnSaveText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});