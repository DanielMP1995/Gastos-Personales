import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../firebase/FirebaseConfig';
import { ref, onValue, remove, update } from 'firebase/database';

export default function ReporteDeudasRegistradas({ navigation }: any) {
    const [tipoVista, setTipoVista] = useState<'deudas' | 'fijos'>('deudas');

    const [deudas, setDeudas] = useState<any[]>([]);
    const [gastosFijos, setGastosFijos] = useState<any[]>([]);
    const [movimientos, setMovimientos] = useState<any[]>([]);

    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [loading, setLoading] = useState(true);
    const [idPareja, setIdPareja] = useState<string | null>(null);

    // Modal de edición
    const [modalVisible, setModalVisible] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);

    const [nuevoMonto, setNuevoMonto] = useState('');
    const [nuevaCuota, setNuevaCuota] = useState('');
    const [nuevaFechaPago, setNuevaFechaPago] = useState('');
    const [nuevoNombre, setNuevoNombre] = useState('');

    /*
     * ============================================================
     * OBTENER ID DE LA PAREJA
     * ============================================================
     */
    useEffect(() => {
        navigation.setOptions({ headerShown: false });

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            setLoading(false);
            return;
        }

        const userRef = ref(db, `usuarios/${usuarioActual.uid}`);

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
                onlyOnce: true
            }
        );

        return () => unsubscribe();
    }, [navigation]);

    /*
     * ============================================================
     * CARGAR DATOS
     * ============================================================
     */
    useEffect(() => {
        if (!idPareja) return;

        setLoading(true);

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const fijosRef = ref(db, `parejas/${idPareja}/gastosFijos`);
        const movimientosRef = ref(db, `parejas/${idPareja}/movimientos`);

        const unsubDeudas = onValue(
            deudasRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const listaDeudas = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key]
                    }));

                    listaDeudas.sort(
                        (a, b) =>
                            new Date(b.fechaRegistro || 0).getTime() -
                            new Date(a.fechaRegistro || 0).getTime()
                    );

                    setDeudas(listaDeudas);
                } else {
                    setDeudas([]);
                }
            },
            (error) => {
                console.error('Error cargando deudas:', error);
            }
        );

        const unsubFijos = onValue(
            fijosRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const listaFijos = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key]
                    }));

                    listaFijos.sort(
                        (a, b) =>
                            new Date(b.fechaRegistro || 0).getTime() -
                            new Date(a.fechaRegistro || 0).getTime()
                    );

                    setGastosFijos(listaFijos);
                } else {
                    setGastosFijos([]);
                }
            },
            (error) => {
                console.error('Error cargando gastos fijos:', error);
            }
        );

        const unsubMovimientos = onValue(
            movimientosRef,
            (snapshot) => {
                const data = snapshot.val();

                if (data) {
                    const listaMovs = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key]
                    }));

                    setMovimientos(listaMovs);
                } else {
                    setMovimientos([]);
                }

                setLoading(false);
            },
            (error) => {
                console.error('Error cargando movimientos:', error);
                setLoading(false);
            }
        );

        return () => {
            unsubDeudas();
            unsubFijos();
            unsubMovimientos();
        };
    }, [idPareja]);

    /*
     * ============================================================
     * FUNCIÓN PARA OBTENER PAGOS DE UNA DEUDA
     * ============================================================
     */
    const obtenerPagosAsociados = (deuda: any) => {
        return movimientos.filter((mov) => {
            // Primera prioridad: deudaId
            if (mov.deudaId && mov.deudaId === deuda.id) {
                return true;
            }

            const desc = (
                mov.descripcion ||
                mov.entidadDeuda ||
                mov.entidad ||
                ''
            ).toLowerCase();

            const entidad = (deuda.entidad || '').toLowerCase();

            return (
                (entidad && desc.includes(entidad)) ||
                (
                    mov.categoria === deuda.categoria &&
                    typeof mov.tipo === 'string' &&
                    mov.tipo.includes('pago')
                )
            );
        });
    };

    /*
     * ============================================================
     * PROCESAR DEUDAS
     *
     * IMPORTANTE:
     *
     * tipo === 'tarjeta'
     *      NO es deuda.
     *      Es solamente el cupo de la tarjeta.
     *
     * tipo === 'consumoTarjeta'
     *      SÍ es deuda.
     *
     * tipo === 'deuda'
     *      SÍ es deuda.
     * ============================================================
     */
    const deudasProcesadas = useMemo(() => {
        const tarjetas = deudas.filter(
            (item) => item.tipo === 'tarjeta'
        );

        const consumosTarjeta = deudas.filter(
            (item) => item.tipo === 'consumoTarjeta'
        );

        const deudasNormales = deudas.filter(
            (item) =>
                item.tipo !== 'tarjeta' &&
                item.tipo !== 'consumoTarjeta'
        );

        /*
         * --------------------------------------------------------
         * TARJETAS
         * --------------------------------------------------------
         */
        const tarjetasProcesadas = tarjetas.map((tarjeta) => {
            const cupoTotal = Number(tarjeta.cupoTotal) || 0;

            // Todos los consumos pertenecientes a esta tarjeta
            const consumos = consumosTarjeta.filter(
                (consumo) => consumo.tarjetaId === tarjeta.id
            );

            const totalConsumido = consumos.reduce(
                (sum, consumo) =>
                    sum + (Number(consumo.monto) || 0),
                0
            );

            /*
             * Pagos de consumos de esta tarjeta.
             *
             * Se buscan por tarjetaId/deudaId cuando exista.
             */
            const pagosTarjeta = movimientos.filter((mov) => {
                if (
                    mov.deudaId &&
                    consumos.some(
                        (consumo) => consumo.id === mov.deudaId
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
                    tarjeta.entidad ||
                    ''
                ).toLowerCase();

                return (
                    banco &&
                    descripcion.includes(banco) &&
                    typeof mov.tipo === 'string' &&
                    mov.tipo.includes('pago')
                );
            });

            const totalPagado = pagosTarjeta.reduce(
                (sum, mov) =>
                    sum + (Number(mov.monto) || 0),
                0
            );

            const deudaPendiente = Math.max(
                0,
                totalConsumido - totalPagado
            );

            const cupoDisponible = Math.max(
                0,
                cupoTotal - totalConsumido + totalPagado
            );

            return {
                ...tarjeta,

                tipo: 'tarjeta',

                cupoTotal,
                totalConsumido,
                totalPagado,
                montoRestante: deudaPendiente,
                cupoDisponible,

                consumos
            };
        });

        /*
         * --------------------------------------------------------
         * CONSUMOS DE TARJETA QUE NO TIENEN TARJETA ASOCIADA
         *
         * Esto evita que un consumo antiguo desaparezca del reporte
         * si por alguna razón su tarjeta fue eliminada.
         * --------------------------------------------------------
         */
        const consumosSinTarjeta = consumosTarjeta
            .filter(
                (consumo) =>
                    !tarjetas.some(
                        (tarjeta) =>
                            tarjeta.id === consumo.tarjetaId
                    )
            )
            .map((consumo) => {
                const pagos = obtenerPagosAsociados(consumo);

                const totalPagado = pagos.reduce(
                    (sum, mov) =>
                        sum + (Number(mov.monto) || 0),
                    0
                );

                const monto = Number(consumo.monto) || 0;

                return {
                    ...consumo,
                    montoRestante: Math.max(
                        0,
                        monto - totalPagado
                    ),
                    totalPagado,
                    consumoSinTarjeta: true
                };
            });

        /*
         * --------------------------------------------------------
         * DEUDAS NORMALES
         * --------------------------------------------------------
         */
        const normalesProcesadas = deudasNormales.map((deuda) => {
            const pagosAsociados =
                obtenerPagosAsociados(deuda);

            const totalPagado = pagosAsociados.reduce(
                (sum, mov) =>
                    sum + (Number(mov.monto) || 0),
                0
            );

            const montoOriginal =
                Number(deuda.monto) || 0;

            const saldoPendiente = Math.max(
                0,
                montoOriginal - totalPagado
            );

            return {
                ...deuda,
                montoRestante: saldoPendiente,
                totalPagado
            };
        });

        /*
         * Las tarjetas aparecen como registros informativos,
         * pero NO como deuda para el total.
         */
        return [
            ...tarjetasProcesadas,
            ...consumosSinTarjeta,
            ...normalesProcesadas
        ];
    }, [deudas, movimientos]);

    /*
     * ============================================================
     * PROCESAR GASTOS FIJOS
     * ============================================================
     */
    const fijosConSaldo = useMemo(() => {
        return gastosFijos.map((gasto) => {
            const pagosAsociados = movimientos.filter((mov) => {
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
                    (nombreFijo &&
                        desc.includes(nombreFijo)) ||
                    (catFijo &&
                        desc.includes(catFijo))
                );
            });

            const totalPagado = pagosAsociados.reduce(
                (sum, mov) =>
                    sum + (Number(mov.monto) || 0),
                0
            );

            const montoEstimado =
                Number(
                    gasto.monto ||
                    gasto.montoEstimado
                ) || 0;

            const saldoPendiente = Math.max(
                0,
                montoEstimado - totalPagado
            );

            return {
                ...gasto,
                montoRestante: saldoPendiente,
                totalPagado,
                monto: montoEstimado
            };
        });
    }, [gastosFijos, movimientos]);

    /*
     * ============================================================
     * CATEGORÍAS
     * ============================================================
     */
    const categoriasDeudas = [
        'Todas',
        'Tarjeta de Crédito',
        'Préstamo Bancario',
        'Casa Comercial',
        'Operadora Celular',
        'Deuda Familiar'
    ];

    const categoriasFijos = [
        'Todas',
        'Luz',
        'Agua',
        'Internet / Teléfono',
        'Alquiler',
        'Otro'
    ];

    const listaActual =
        tipoVista === 'deudas'
            ? deudasProcesadas
            : fijosConSaldo;

    const categoriasDisponibles =
        tipoVista === 'deudas'
            ? categoriasDeudas
            : categoriasFijos;

    /*
     * ============================================================
     * FILTRADO
     * ============================================================
     */
    const itemsFiltrados =
        categoriaFiltro === 'Todas'
            ? listaActual
            : listaActual.filter((item) => {
                const catItem = (
                    item.categoria || ''
                )
                    .trim()
                    .toLowerCase();

                const catFiltro = categoriaFiltro
                    .trim()
                    .toLowerCase();

                if (catFiltro.includes('internet')) {
                    return (
                        catItem.includes('internet') ||
                        catItem.includes('teléfono') ||
                        catItem.includes('telefono')
                    );
                }

                return catItem === catFiltro;
            });

    /*
     * ============================================================
     * TOTAL PENDIENTE
     *
     * MUY IMPORTANTE:
     * Las tarjetas (tipo tarjeta) NO se suman.
     *
     * Solamente se suman:
     * - consumoTarjeta
     * - deuda normal
     * ============================================================
     */
    const totalFiltrado = itemsFiltrados.reduce(
        (acc, item) => {
            if (item.tipo === 'tarjeta') {
                return acc;
            }

            return (
                acc +
                (Number(item.montoRestante) || 0)
            );
        },
        0
    );

    /*
     * ============================================================
     * ELIMINAR
     * ============================================================
     */
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
                    style: 'cancel'
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
                    }
                }
            ]
        );
    };

    /*
     * ============================================================
     * ABRIR EDICIÓN
     * ============================================================
     */
    const abrirEdicion = (item: any) => {
        setItemSeleccionado(item);

        /*
         * Si es tarjeta:
         * editar cupoTotal, NO monto.
         */
        if (item.tipo === 'tarjeta') {
            setNuevoMonto(
                Number(item.cupoTotal || 0).toString()
            );
        } else {
            setNuevoMonto(
                Number(item.monto || 0).toString()
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

    /*
     * ============================================================
     * GUARDAR EDICIÓN
     * ============================================================
     */
    const guardarEdicion = () => {
        if (!idPareja || !itemSeleccionado) {
            return;
        }

        if (!nuevoMonto) {
            Alert.alert(
                'Atención',
                'El monto no puede estar vacío.'
            );
            return;
        }

        const rutaNodo =
            tipoVista === 'deudas'
                ? 'deudas'
                : 'gastosFijos';

        const itemRef = ref(
            db,
            `parejas/${idPareja}/${rutaNodo}/${itemSeleccionado.id}`
        );

        let datosActualizados: any = {};

        /*
         * TARJETA
         *
         * Aquí actualizamos únicamente cupoTotal.
         */
        if (
            tipoVista === 'deudas' &&
            itemSeleccionado.tipo === 'tarjeta'
        ) {
            datosActualizados = {
                cupoTotal: parseFloat(nuevoMonto)
            };
        }

        /*
         * CONSUMO DE TARJETA
         *
         * Aquí actualizamos monto.
         */
        else if (
            tipoVista === 'deudas' &&
            itemSeleccionado.tipo === 'consumoTarjeta'
        ) {
            datosActualizados = {
                monto: parseFloat(nuevoMonto),
                fechaMaxPago:
                    nuevaFechaPago || 'N/A'
            };
        }

        /*
         * DEUDAS NORMALES
         */
        else if (tipoVista === 'deudas') {
            datosActualizados = {
                monto: parseFloat(nuevoMonto),
                cuotaPagar:
                    parseFloat(nuevaCuota) || 0,
                fechaMaxPago:
                    nuevaFechaPago || 'N/A'
            };
        }

        /*
         * GASTOS FIJOS
         */
        else {
            datosActualizados = {
                monto: parseFloat(nuevoMonto),
                nombre:
                    nuevoNombre || 'Gasto Fijo'
            };
        }

        update(
            itemRef,
            datosActualizados
        )
            .then(() => {
                Alert.alert(
                    '¡Éxito!',
                    'Actualizado correctamente.'
                );

                setModalVisible(false);
                setItemSeleccionado(null);
            })
            .catch((error) => {
                Alert.alert(
                    'Error',
                    error.message
                );
            });
    };

    /*
     * ============================================================
     * RENDER
     * ============================================================
     */
    return (
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={true}
            >
                <Text style={styles.titulo}>
                    Reporte General
                </Text>

                <Text style={styles.subtitulo}>
                    Consulta y administra tus compromisos financieros
                </Text>

                {/* SELECTOR DE VISTA */}
                <View style={styles.tipoVistaContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tipoVistaBtn,
                            tipoVista === 'deudas' &&
                            styles.tipoVistaBtnActive
                        ]}
                        onPress={() => {
                            setTipoVista('deudas');
                            setCategoriaFiltro('Todas');
                        }}
                    >
                        <Text
                            style={[
                                styles.tipoVistaText,
                                tipoVista === 'deudas' &&
                                styles.tipoVistaTextActive
                            ]}
                        >
                            💳 Deudas
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tipoVistaBtn,
                            tipoVista === 'fijos' &&
                            styles.tipoVistaBtnActive
                        ]}
                        onPress={() => {
                            setTipoVista('fijos');
                            setCategoriaFiltro('Todas');
                        }}
                    >
                        <Text
                            style={[
                                styles.tipoVistaText,
                                tipoVista === 'fijos' &&
                                styles.tipoVistaTextActive
                            ]}
                        >
                            ⚡ Gastos Fijos
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* FILTROS */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScroll}
                >
                    {categoriasDisponibles.map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.filterChip,
                                categoriaFiltro === cat &&
                                styles.filterChipSelected
                            ]}
                            onPress={() =>
                                setCategoriaFiltro(cat)
                            }
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    categoriaFiltro === cat &&
                                    styles.filterTextSelected
                                ]}
                            >
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* RESUMEN */}
                <View style={styles.resumenCard}>
                    <Text style={styles.resumenTitle}>
                        Total Pendiente en {categoriaFiltro}{' '}
                        (
                        {tipoVista === 'deudas'
                            ? 'Deudas'
                            : 'Gastos Fijos'}
                        )
                    </Text>

                    <Text style={styles.resumenAmount}>
                        ${totalFiltrado.toFixed(2)}
                    </Text>

                    <Text style={styles.resumenSub}>
                        {itemsFiltrados.length}{' '}
                        {itemsFiltrados.length === 1
                            ? 'registro encontrado'
                            : 'registros encontrados'}
                    </Text>
                </View>

                {/* LISTA */}
                {loading ? (
                    <Text style={styles.emptyText}>
                        Cargando registros...
                    </Text>
                ) : itemsFiltrados.length === 0 ? (
                    <Text style={styles.emptyText}>
                        No hay registros en esta categoría.
                    </Text>
                ) : (
                    itemsFiltrados.map((item) => (
                        <View
                            key={item.id}
                            style={styles.cardDeuda}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardCategoria}>
                                    {item.categoria}
                                </Text>

                                <Text style={styles.cardEntidad}>
                                    {tipoVista === 'deudas'
                                        ? item.tipo === 'tarjeta'
                                            ? `${item.entidad || 'Banco'} ${item.marcaTarjeta
                                                ? `(${item.marcaTarjeta})`
                                                : ''
                                            }`
                                            : item.tipo === 'consumoTarjeta'
                                                ? `${item.tarjetaBanco || 'Tarjeta'} ${item.tarjetaMarca
                                                    ? `(${item.tarjetaMarca})`
                                                    : ''
                                                }`
                                                : `${item.entidad || ''}`
                                        : item.nombre || 'Gasto Fijo'}
                                </Text>

                                {/* ================================
                                    TARJETA
                                   ================================ */}
                                {tipoVista === 'deudas' &&
                                    item.tipo === 'tarjeta' && (
                                        <>
                                            <Text style={styles.cardDetalle}>
                                                💳 Cupo total:{' '}
                                                <Text style={styles.textBold}>
                                                    $
                                                    {item.cupoTotal.toFixed(
                                                        2
                                                    )}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                💰 Consumido:{' '}
                                                <Text style={styles.textBold}>
                                                    $
                                                    {item.totalConsumido.toFixed(
                                                        2
                                                    )}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                💵 Pagado:{' '}
                                                <Text
                                                    style={{
                                                        color: '#4ADE80'
                                                    }}
                                                >
                                                    $
                                                    {item.totalPagado.toFixed(
                                                        2
                                                    )}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                🔴 Deuda pendiente:{' '}
                                                <Text
                                                    style={styles.textBold}
                                                >
                                                    $
                                                    {item.montoRestante.toFixed(
                                                        2
                                                    )}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                🟢 Cupo disponible:{' '}
                                                <Text
                                                    style={{
                                                        color: '#4ADE80',
                                                        fontWeight: '700'
                                                    }}
                                                >
                                                    $
                                                    {item.cupoDisponible.toFixed(
                                                        2
                                                    )}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                📅 Caducidad:{' '}
                                                {item.fechaCaducidad ||
                                                    'N/A'}
                                            </Text>
                                        </>
                                    )}

                                {/* ================================
                                    CONSUMO DE TARJETA
                                   ================================ */}
                                {tipoVista === 'deudas' &&
                                    item.tipo === 'consumoTarjeta' && (
                                        <>
                                            <Text style={styles.cardDetalle}>
                                                🛒 Consumo:{' '}
                                                <Text
                                                    style={styles.textBold}
                                                >
                                                    $
                                                    {Number(
                                                        item.monto || 0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>

                                            {item.descripcion &&
                                                item.descripcion !==
                                                'N/A' && (
                                                    <Text
                                                        style={
                                                            styles.cardDetalle
                                                        }
                                                    >
                                                        Descripción:{' '}
                                                        {
                                                            item.descripcion
                                                        }
                                                    </Text>
                                                )}

                                            <Text style={styles.cardDetalle}>
                                                Total Pagado:{' '}
                                                <Text
                                                    style={{
                                                        color: '#4ADE80'
                                                    }}
                                                >
                                                    $
                                                    {Number(
                                                        item.totalPagado || 0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                Deuda pendiente:{' '}
                                                <Text
                                                    style={
                                                        styles.textBold
                                                    }
                                                >
                                                    $
                                                    {Number(
                                                        item.montoRestante ||
                                                        0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>

                                            {item.diferido && (
                                                <Text
                                                    style={
                                                        styles.cardDetalle
                                                    }
                                                >
                                                    📆 Diferido a{' '}
                                                    {item.numeroCuotas ||
                                                        1}{' '}
                                                    cuotas
                                                </Text>
                                            )}

                                            <Text style={styles.cardDetalle}>
                                                Pago máx:{' '}
                                                {item.fechaMaxPago ||
                                                    'N/A'}
                                            </Text>
                                        </>
                                    )}

                                {/* ================================
                                    DEUDA NORMAL
                                   ================================ */}
                                {tipoVista === 'deudas' &&
                                    item.tipo !== 'tarjeta' &&
                                    item.tipo !== 'consumoTarjeta' && (
                                        <>
                                            <Text style={styles.cardDetalle}>
                                                Monto Inicial:{' '}
                                                $
                                                {Number(
                                                    item.monto || 0
                                                ).toFixed(2)}
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                Total Pagado:{' '}
                                                <Text
                                                    style={{
                                                        color: '#4ADE80'
                                                    }}
                                                >
                                                    $
                                                    {Number(
                                                        item.totalPagado ||
                                                        0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>

                                            <Text style={styles.cardDetalle}>
                                                Saldo Pendiente:{' '}
                                                <Text
                                                    style={
                                                        styles.textBold
                                                    }
                                                >
                                                    $
                                                    {Number(
                                                        item.montoRestante ||
                                                        0
                                                    ).toFixed(2)}
                                                </Text>
                                            </Text>

                                            {item.cuotaPagar > 0 && (
                                                <Text
                                                    style={
                                                        styles.cardDetalle
                                                    }
                                                >
                                                    Cuota mensual: $
                                                    {Number(
                                                        item.cuotaPagar
                                                    ).toFixed(2)}
                                                </Text>
                                            )}

                                            <Text style={styles.cardDetalle}>
                                                Pago máx:{' '}
                                                {item.fechaMaxPago ||
                                                    'N/A'}
                                            </Text>
                                        </>
                                    )}

                                {/* ================================
                                    GASTO FIJO
                                   ================================ */}
                                {tipoVista === 'fijos' && (
                                    <>
                                        <Text style={styles.cardDetalle}>
                                            Monto Asignado: $
                                            {Number(
                                                item.monto || 0
                                            ).toFixed(2)}
                                        </Text>

                                        <Text style={styles.cardDetalle}>
                                            Total Pagado:{' '}
                                            <Text
                                                style={{
                                                    color: '#4ADE80'
                                                }}
                                            >
                                                $
                                                {Number(
                                                    item.totalPagado ||
                                                    0
                                                ).toFixed(2)}
                                            </Text>
                                        </Text>

                                        <Text style={styles.cardDetalle}>
                                            Saldo Pendiente:{' '}
                                            <Text
                                                style={
                                                    styles.textBold
                                                }
                                            >
                                                $
                                                {Number(
                                                    item.montoRestante ||
                                                    0
                                                ).toFixed(2)}
                                            </Text>
                                        </Text>
                                    </>
                                )}

                                <Text style={styles.cardAuthor}>
                                    Registrado por:{' '}
                                    {item.autor || 'Usuario'}
                                </Text>
                            </View>

                            {/* BOTONES */}
                            <View style={styles.actionContainer}>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={() =>
                                        abrirEdicion(item)
                                    }
                                >
                                    <Text style={styles.actionIcon}>
                                        ✏️
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() =>
                                        eliminarItem(
                                            item.id,
                                            item.entidad ||
                                            item.tarjetaBanco ||
                                            item.nombre ||
                                            'Registro'
                                        )
                                    }
                                >
                                    <Text style={styles.actionIcon}>
                                        🗑️
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {/* MODAL */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() =>
                        setModalVisible(false)
                    }
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {itemSeleccionado?.tipo ===
                                    'tarjeta'
                                    ? 'Editar Tarjeta'
                                    : itemSeleccionado?.tipo ===
                                        'consumoTarjeta'
                                        ? 'Editar Consumo'
                                        : tipoVista === 'deudas'
                                            ? 'Editar Deuda'
                                            : 'Editar Gasto Fijo'}
                            </Text>

                            <Text style={styles.modalSubtitle}>
                                {itemSeleccionado?.categoria} -{' '}
                                {itemSeleccionado?.entidad ||
                                    itemSeleccionado?.tarjetaBanco ||
                                    itemSeleccionado?.nombre ||
                                    ''}
                            </Text>

                            {tipoVista === 'fijos' && (
                                <>
                                    <Text style={styles.labelModal}>
                                        Nombre del Gasto Fijo
                                    </Text>

                                    <TextInput
                                        style={styles.inputModal}
                                        value={nuevoNombre}
                                        onChangeText={
                                            setNuevoNombre
                                        }
                                        placeholderTextColor="#64748B"
                                    />
                                </>
                            )}

                            <Text style={styles.labelModal}>
                                {itemSeleccionado?.tipo ===
                                    'tarjeta'
                                    ? 'Cupo Total ($)'
                                    : itemSeleccionado?.tipo ===
                                        'consumoTarjeta'
                                        ? 'Monto del Consumo ($)'
                                        : 'Monto ($)'}
                            </Text>

                            <TextInput
                                style={styles.inputModal}
                                keyboardType="numeric"
                                value={nuevoMonto}
                                onChangeText={
                                    setNuevoMonto
                                }
                                placeholderTextColor="#64748B"
                            />

                            {tipoVista === 'deudas' &&
                                itemSeleccionado?.tipo !==
                                'tarjeta' &&
                                itemSeleccionado?.tipo !==
                                'consumoTarjeta' && (
                                    <>
                                        <Text style={styles.labelModal}>
                                            Cuota a pagar ($)
                                        </Text>

                                        <TextInput
                                            style={styles.inputModal}
                                            keyboardType="numeric"
                                            value={nuevaCuota}
                                            onChangeText={
                                                setNuevaCuota
                                            }
                                            placeholderTextColor="#64748B"
                                        />
                                    </>
                                )}

                            {tipoVista === 'deudas' &&
                                itemSeleccionado?.tipo !==
                                'tarjeta' && (
                                    <>
                                        <Text style={styles.labelModal}>
                                            Fecha máxima de pago
                                        </Text>

                                        <TextInput
                                            style={styles.inputModal}
                                            value={
                                                nuevaFechaPago
                                            }
                                            onChangeText={
                                                setNuevaFechaPago
                                            }
                                            placeholderTextColor="#64748B"
                                        />
                                    </>
                                )}

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity
                                    style={styles.modalCancelBtn}
                                    onPress={() =>
                                        setModalVisible(false)
                                    }
                                >
                                    <Text
                                        style={
                                            styles.modalCancelText
                                        }
                                    >
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.modalSaveBtn}
                                    onPress={
                                        guardarEdicion
                                    }
                                >
                                    <Text
                                        style={
                                            styles.modalSaveText
                                        }
                                    >
                                        Guardar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
}

/*
 * ================================================================
 * ESTILOS
 * ================================================================
 */

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        ...Platform.select({
            web: {
                height: '100vh' as any,
                overflow: 'hidden' as any
            },
            default: {}
        })
    },

    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A'
    },

    container: {
        flexGrow: 1,
        paddingHorizontal: 25,
        paddingTop: 40,
        paddingBottom: 100
    },

    titulo: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#38BDF8',
        marginBottom: 6
    },

    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 16
    },

    tipoVistaContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155'
    },

    tipoVistaBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8
    },

    tipoVistaBtnActive: {
        backgroundColor: '#38BDF8'
    },

    tipoVistaText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 13
    },

    tipoVistaTextActive: {
        color: '#0F172A',
        fontWeight: 'bold'
    },

    filterScroll: {
        flexDirection: 'row',
        marginBottom: 20
    },

    filterChip: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 10,
        height: 40
    },

    filterChipSelected: {
        backgroundColor: '#1D4ED8',
        borderColor: '#60A5FA'
    },

    filterText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600'
    },

    filterTextSelected: {
        color: '#FFFFFF'
    },

    resumenCard: {
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 20
    },

    resumenTitle: {
        color: '#94A3B8',
        fontSize: 13,
        marginBottom: 4,
        textAlign: 'center'
    },

    resumenAmount: {
        color: '#EA580C',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2
    },

    resumenSub: {
        color: '#64748B',
        fontSize: 11
    },

    emptyText: {
        color: '#64748B',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14
    },

    cardDeuda: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155'
    },

    cardCategoria: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2
    },

    cardEntidad: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6
    },

    cardDetalle: {
        color: '#94A3B8',
        fontSize: 13,
        marginBottom: 2
    },

    textBold: {
        color: '#F8FAFC',
        fontWeight: '600'
    },

    cardAuthor: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 6
    },

    actionContainer: {
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
        paddingLeft: 10
    },

    editButton: {
        backgroundColor: '#1E3A8A',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8
    },

    deleteButton: {
        backgroundColor: '#7F1D1D',
        padding: 8,
        borderRadius: 8
    },

    actionIcon: {
        fontSize: 14
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
    },

    modalContent: {
        backgroundColor: '#1E293B',
        width: '85%',
        borderRadius: 16,
        padding: 22,
        borderWidth: 1,
        borderColor: '#334155'
    },

    modalTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4
    },

    modalSubtitle: {
        color: '#38BDF8',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20
    },

    labelModal: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6
    },

    inputModal: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        padding: 12,
        color: '#F8FAFC',
        fontSize: 15,
        marginBottom: 14
    },

    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10
    },

    modalCancelBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#64748B',
        borderRadius: 10,
        paddingVertical: 12,
        flex: 1,
        marginRight: 8,
        alignItems: 'center'
    },

    modalCancelText: {
        color: '#94A3B8',
        fontWeight: '600'
    },

    modalSaveBtn: {
        backgroundColor: '#1D4ED8',
        borderRadius: 10,
        paddingVertical: 12,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center'
    },

    modalSaveText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});