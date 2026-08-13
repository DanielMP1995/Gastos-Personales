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
import { ref, onValue, remove, update } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

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

        const tarjetasProcesadas = tarjetas.map((tarjeta) => {
            const cupoTotal = Number(tarjeta.cupoTotal) || 0;

            const consumos = consumosTarjeta.filter(
                (consumo) => consumo.tarjetaId === tarjeta.id
            );

            const totalConsumido = consumos.reduce(
                (sum, consumo) =>
                    sum + (Number(consumo.monto) || 0),
                0
            );

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

    const abrirEdicion = (item: any) => {
        setItemSeleccionado(item);

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

        if (
            tipoVista === 'deudas' &&
            itemSeleccionado.tipo === 'tarjeta'
        ) {
            datosActualizados = {
                cupoTotal: parseFloat(nuevoMonto)
            };
        } else if (
            tipoVista === 'deudas' &&
            itemSeleccionado.tipo === 'consumoTarjeta'
        ) {
            datosActualizados = {
                monto: parseFloat(nuevoMonto),
                fechaMaxPago:
                    nuevaFechaPago || 'N/A'
            };
        } else if (tipoVista === 'deudas') {
            datosActualizados = {
                monto: parseFloat(nuevoMonto),
                cuotaPagar:
                    parseFloat(nuevaCuota) || 0,
                fechaMaxPago:
                    nuevaFechaPago || 'N/A'
            };
        } else {
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

    const renderItem = ({ item }: { item: any }) => {
        const nombreEntidad =
            tipoVista === 'deudas'
                ? item.tipo === 'tarjeta'
                    ? `${item.entidad || 'Banco'} ${item.marcaTarjeta ? `(${item.marcaTarjeta})` : ''}`
                    : item.tipo === 'consumoTarjeta'
                        ? `${item.tarjetaBanco || 'Tarjeta'} ${item.tarjetaMarca ? `(${item.tarjetaMarca})` : ''}`
                        : `${item.entidad || 'Deuda'}`
                : item.nombre || 'Gasto Fijo';

        return (
            <View style={styles.cardDeuda}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.badgeCategoria}>
                        <Text style={styles.badgeText}>{item.categoria || 'General'}</Text>
                    </View>
                    <View style={styles.cardActions}>
                        <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => abrirEdicion(item)}
                        >
                            <Ionicons name="pencil" size={13} color="#059669" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}
                            onPress={() => eliminarItem(item.id, nombreEntidad)}
                        >
                            <Ionicons name="trash-outline" size={13} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.cardEntidad}>{nombreEntidad}</Text>

                {tipoVista === 'deudas' && item.tipo === 'tarjeta' ? (
                    <View style={styles.gridInfo}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Cupo Total</Text>
                            <Text style={styles.infoValue}>${(item.cupoTotal || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Consumido</Text>
                            <Text style={styles.infoValue}>${(item.totalConsumido || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Pagado</Text>
                            <Text style={[styles.infoValue, { color: '#059669' }]}>${(item.totalPagado || 0).toFixed(2)}</Text>
                        </View>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Disponible</Text>
                            <Text style={[styles.infoValue, { color: '#059669' }]}>${(item.cupoDisponible || 0).toFixed(2)}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.gridInfoSimple}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Monto / Pendiente</Text>
                            <Text style={[styles.infoValue, { color: '#EF4444' }]}>
                                ${(item.montoRestante !== undefined ? item.montoRestante : item.monto || 0).toFixed(2)}
                            </Text>
                        </View>
                        {item.cuotaPagar ? (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>Cuota</Text>
                                <Text style={styles.infoValue}>${item.cuotaPagar.toFixed(2)}</Text>
                            </View>
                        ) : null}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Vencimiento</Text>
                            <Text style={[styles.infoValue, { fontSize: 11 }]}>{item.fechaMaxPago || item.fechaCaducidad || 'N/A'}</Text>
                        </View>
                    </View>
                )}

                {item.autor && (
                    <Text style={styles.cardAutor}>Registrado por: {item.autor}</Text>
                )}
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            <Text style={styles.titulo}>Reporte General</Text>
            <Text style={styles.subtitulo}>Consulta y administra tus compromisos financieros</Text>

            {/* SELECTOR DE VISTA */}
            <View style={styles.tipoVistaContainer}>
                <TouchableOpacity
                    style={[
                        styles.tipoVistaBtn,
                        tipoVista === 'deudas' && styles.tipoVistaBtnActive
                    ]}
                    onPress={() => {
                        setTipoVista('deudas');
                        setCategoriaFiltro('Todas');
                    }}
                >
                    <Ionicons name="card-outline" size={15} color={tipoVista === 'deudas' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tipoVistaText, tipoVista === 'deudas' && styles.tipoVistaTextActive]}>
                        Deudas
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tipoVistaBtn,
                        tipoVista === 'fijos' && styles.tipoVistaBtnActive
                    ]}
                    onPress={() => {
                        setTipoVista('fijos');
                        setCategoriaFiltro('Todas');
                    }}
                >
                    <Ionicons name="flash-outline" size={15} color={tipoVista === 'fijos' ? '#FFFFFF' : '#64748B'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tipoVistaText, tipoVista === 'fijos' && styles.tipoVistaTextActive]}>
                        Gastos Fijos
                    </Text>
                </TouchableOpacity>
            </View>

            {/* FILTROS CHIPS */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categoriasDisponibles}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filterScroll}
                renderItem={({ item: cat }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            categoriaFiltro === cat && styles.filterChipSelected
                        ]}
                        onPress={() => setCategoriaFiltro(cat)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                categoriaFiltro === cat && styles.filterTextSelected
                            ]}
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* RESUMEN */}
            <View style={styles.resumenCard}>
                <Text style={styles.resumenTitle}>
                    Total Pendiente: {categoriaFiltro}
                </Text>
                <Text style={styles.resumenAmount}>
                    ${totalFiltrado.toFixed(2)}
                </Text>
                <Text style={styles.resumenSub}>
                    {itemsFiltrados.length} {itemsFiltrados.length === 1 ? 'registro encontrado' : 'registros encontrados'}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.rootContainer}>
            <FlatList
                data={itemsFiltrados}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    loading ? (
                        <Text style={styles.emptyText}>Cargando registros...</Text>
                    ) : (
                        <Text style={styles.emptyText}>No hay registros en esta categoría.</Text>
                    )
                }
            />

            {/* MODAL DE EDICIÓN */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Registro</Text>

                        {tipoVista === 'fijos' && (
                            <>
                                <Text style={styles.modalLabel}>Nombre del Gasto</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={nuevoNombre}
                                    onChangeText={setNuevoNombre}
                                    placeholderTextColor="#94A3B8"
                                />
                            </>
                        )}

                        <Text style={styles.modalLabel}>
                            {tipoVista === 'deudas' && itemSeleccionado?.tipo === 'tarjeta' ? 'Cupo Total' : 'Monto / Saldo'}
                        </Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            value={nuevoMonto}
                            onChangeText={setNuevoMonto}
                            placeholder="0.00"
                            placeholderTextColor="#94A3B8"
                        />

                        {tipoVista === 'deudas' && itemSeleccionado?.tipo !== 'tarjeta' && (
                            <>
                                <Text style={styles.modalLabel}>Cuota a Pagar</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    keyboardType="numeric"
                                    value={nuevaCuota}
                                    onChangeText={setNuevaCuota}
                                    placeholder="0.00"
                                    placeholderTextColor="#94A3B8"
                                />
                                <Text style={styles.modalLabel}>Fecha de Vencimiento</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={nuevaFechaPago}
                                    onChangeText={setNuevaFechaPago}
                                    placeholder="DD/MM/YYYY"
                                    placeholderTextColor="#94A3B8"
                                />
                            </>
                        )}

                        <View style={styles.modalButtonsRow}>
                            <TouchableOpacity
                                style={styles.modalBtnCancel}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalBtnSave}
                                onPress={guardarEdicion}
                            >
                                <Text style={styles.modalBtnSaveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 20,
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
    tipoVistaContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
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
        fontSize: 12,
        fontWeight: '600',
    },
    tipoVistaTextActive: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
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
    resumenCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
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
    cardDeuda: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
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
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 6,
    },
    infoBox: {
        width: '23%',
        alignItems: 'flex-start',
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