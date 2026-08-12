import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Platform } from 'react-native'
import React, { useEffect, useState } from 'react'
import { db, auth } from '../../firebase/FirebaseConfig'
import { ref, onValue, remove, update } from 'firebase/database'

export default function ReporteDeudasRegistradas({ navigation }: any) {
    const [tipoVista, setTipoVista] = useState<'deudas' | 'fijos'>('deudas'); // 'deudas' o 'fijos'
    const [deudas, setDeudas] = useState<any[]>([]);
    const [gastosFijos, setGastosFijos] = useState<any[]>([]);
    const [movimientos, setMovimientos] = useState<any[]>([]);
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [loading, setLoading] = useState(true);
    const [idPareja, setIdPareja] = useState<string | null>(null);

    // Estados para el Modal de Edición
    const [modalVisible, setModalVisible] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState<any>(null);
    const [nuevoMonto, setNuevoMonto] = useState('');
    const [nuevaCuota, setNuevaCuota] = useState('');
    const [nuevaFechaPago, setNuevaFechaPago] = useState('');
    const [nuevoNombre, setNuevoNombre] = useState('');

    useEffect(() => {
        navigation.setOptions({ headerShown: false });

        const usuarioActual = auth.currentUser;
        if (usuarioActual) {
            const userRef = ref(db, `usuarios/${usuarioActual.uid}`);
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.idPareja) {
                    setIdPareja(data.idPareja);
                } else {
                    setLoading(false);
                }
            }, { onlyOnce: true });
        }
    }, [navigation]);

    // Cargar Deudas, Gastos Fijos y Movimientos en tiempo real
    useEffect(() => {
        if (!idPareja) return;

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const fijosRef = ref(db, `parejas/${idPareja}/gastosFijos`);
        const movimientosRef = ref(db, `parejas/${idPareja}/movimientos`);

        const unsubDeudas = onValue(deudasRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const listaDeudas = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key]
                }));
                listaDeudas.sort((a, b) => new Date(b.fechaRegistro || 0).getTime() - new Date(a.fechaRegistro || 0).getTime());
                setDeudas(listaDeudas);
            } else {
                setDeudas([]);
            }
        });

        const unsubFijos = onValue(fijosRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const listaFijos = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key]
                }));
                listaFijos.sort((a, b) => new Date(b.fechaRegistro || 0).getTime() - new Date(a.fechaRegistro || 0).getTime());
                setGastosFijos(listaFijos);
            } else {
                setGastosFijos([]);
            }
        });

        const unsubMovimientos = onValue(movimientosRef, (snapshot) => {
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
        }, (error) => {
            console.error("Error al cargar datos:", error);
            setLoading(false);
        });

        return () => {
            unsubDeudas();
            unsubFijos();
            unsubMovimientos();
        };
    }, [idPareja]);

    // Procesar saldos de Deudas
    const deudasConSaldo = deudas.map((deuda) => {
        const pagosAsociados = movimientos.filter(mov => {
            if (mov.deudaId && mov.deudaId === deuda.id) return true;
            const desc = (mov.descripcion || mov.entidad || '').toLowerCase();
            const ent = (deuda.entidad || '').toLowerCase();
            return (ent && desc.includes(ent)) || (mov.categoria === deuda.categoria && mov.tipo?.includes('pago'));
        });

        const totalPagado = pagosAsociados.reduce((sum, mov) => sum + (Number(mov.monto) || 0), 0);
        const montoOriginal = Number(deuda.monto) || 0;
        const saldoPendiente = Math.max(0, montoOriginal - totalPagado);

        return {
            ...deuda,
            montoRestante: saldoPendiente,
            totalPagado
        };
    });

    // Procesar Gastos Fijos vinculando pagos realizados
    const fijosConSaldo = gastosFijos.map((gasto) => {
        const pagosAsociados = movimientos.filter(mov => {
            const desc = (mov.descripcion || '').toLowerCase();
            const nombreFijo = (gasto.nombre || '').toLowerCase();
            const catFijo = (gasto.categoria || '').toLowerCase();
            return (nombreFijo && desc.includes(nombreFijo)) || (catFijo && desc.includes(catFijo));
        });

        const totalPagado = pagosAsociados.reduce((sum, mov) => sum + (Number(mov.monto) || 0), 0);
        const montoEstimado = Number(gasto.monto || gasto.montoEstimado) || 0;
        const saldoPendiente = Math.max(0, montoEstimado - totalPagado);

        return {
            ...gasto,
            montoRestante: saldoPendiente,
            totalPagado,
            monto: montoEstimado
        };
    });

    const categoriasDeudas = ['Todas', 'Tarjeta de Crédito', 'Préstamo Bancario', 'Casa Comercial', 'Deuda Familiar'];
    const categoriasFijos = ['Todas', 'Luz', 'Agua', 'Internet / Teléfono', 'Alquiler', 'Otro'];

    const listaActual = tipoVista === 'deudas' ? deudasConSaldo : fijosConSaldo;
    const categoriasDisponibles = tipoVista === 'deudas' ? categoriasDeudas : categoriasFijos;

    const itemsFiltrados = categoriaFiltro === 'Todas' 
        ? listaActual 
        : listaActual.filter(item => {
            const catItem = (item.categoria || '').trim().toLowerCase();
            const catFiltro = categoriaFiltro.trim().toLowerCase();
            if (catFiltro.includes('internet')) {
                return catItem.includes('internet') || catItem.includes('teléfono') || catItem.includes('telefono');
            }
            return catItem === catFiltro;
        });

    const totalFiltrado = itemsFiltrados.reduce((acc, item) => acc + (item.montoRestante || 0), 0);

    // Función para eliminar registro
    const eliminarItem = (id: string, nombre: string) => {
        if (!idPareja) return;
        const rutaNodo = tipoVista === 'deudas' ? 'deudas' : 'gastosFijos';
        Alert.alert(
            "Eliminar Registro",
            `¿Estás seguro de eliminar el registro de ${nombre}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: () => {
                        remove(ref(db, `parejas/${idPareja}/${rutaNodo}/${id}`))
                            .then(() => Alert.alert("Éxito", "Registro eliminado correctamente."))
                            .catch((error) => Alert.alert("Error", error.message));
                    } 
                }
            ]
        );
    };

    // Abrir modal de edición
    const abrirEdicion = (item: any) => {
        setItemSeleccionado(item);
        setNuevoMonto(item.monto ? item.monto.toString() : '');
        setNuevaCuota(item.cuotaPagar ? item.cuotaPagar.toString() : '');
        setNuevaFechaPago(item.fechaMaxPago || '');
        setNuevoNombre(item.nombre || item.entidad || '');
        setModalVisible(true);
    };

    // Guardar cambios de edición
    const guardarEdicion = () => {
        if (!idPareja || !itemSeleccionado) return;
        if (!nuevoMonto) {
            Alert.alert("Atención", "El monto no puede estar vacío.");
            return;
        }

        const rutaNodo = tipoVista === 'deudas' ? 'deudas' : 'gastosFijos';
        const itemRef = ref(db, `parejas/${idPareja}/${rutaNodo}/${itemSeleccionado.id}`);
        
        let datosActualizados: any = {
            monto: parseFloat(nuevoMonto),
        };

        if (tipoVista === 'deudas') {
            datosActualizados.cuotaPagar = parseFloat(nuevaCuota) || 0;
            datosActualizados.fechaMaxPago = nuevaFechaPago || 'N/A';
        } else {
            datosActualizados.nombre = nuevoNombre || 'Gasto Fijo';
        }

        update(itemRef, datosActualizados)
        .then(() => {
            Alert.alert("¡Éxito!", "Actualizado correctamente.");
            setModalVisible(false);
        })
        .catch((error) => {
            Alert.alert("Error", error.message);
        });
    };

    return (
        <View style={styles.rootContainer}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={true}>
                <Text style={styles.titulo}>Reporte General</Text>
                <Text style={styles.subtitulo}>Consulta y administra tus compromisos financieros</Text>

                {/* SELECTOR DE TIPO DE VISTA (DEUDAS VS GASTOS FIJOS) */}
                <View style={styles.tipoVistaContainer}>
                    <TouchableOpacity 
                        style={[styles.tipoVistaBtn, tipoVista === 'deudas' && styles.tipoVistaBtnActive]}
                        onPress={() => { setTipoVista('deudas'); setCategoriaFiltro('Todas'); }}
                    >
                        <Text style={[styles.tipoVistaText, tipoVista === 'deudas' && styles.tipoVistaTextActive]}>💳 Deudas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tipoVistaBtn, tipoVista === 'fijos' && styles.tipoVistaBtnActive]}
                        onPress={() => { setTipoVista('fijos'); setCategoriaFiltro('Todas'); }}
                    >
                        <Text style={[styles.tipoVistaText, tipoVista === 'fijos' && styles.tipoVistaTextActive]}>⚡ Gastos Fijos</Text>
                    </TouchableOpacity>
                </View>

                {/* FILTROS POR CATEGORÍA */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {categoriasDisponibles.map((cat) => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[styles.filterChip, categoriaFiltro === cat && styles.filterChipSelected]}
                            onPress={() => setCategoriaFiltro(cat)}
                        >
                            <Text style={[styles.filterText, categoriaFiltro === cat && styles.filterTextSelected]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* RESUMEN DE LA VISTA */}
                <View style={styles.resumenCard}>
                    <Text style={styles.resumenTitle}>Total Pendiente en {categoriaFiltro} ({tipoVista === 'deudas' ? 'Deudas' : 'Gastos Fijos'})</Text>
                    <Text style={styles.resumenAmount}>${totalFiltrado.toFixed(2)}</Text>
                    <Text style={styles.resumenSub}>{itemsFiltrados.length} {itemsFiltrados.length === 1 ? 'registro encontrado' : 'registros encontrados'}</Text>
                </View>

                {/* LISTA DE ELEMENTOS */}
                {loading ? (
                    <Text style={styles.emptyText}>Cargando registros...</Text>
                ) : itemsFiltrados.length === 0 ? (
                    <Text style={styles.emptyText}>No hay registros en esta categoría.</Text>
                ) : (
                    itemsFiltrados.map((item) => (
                        <View key={item.id} style={styles.cardDeuda}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardCategoria}>{item.categoria}</Text>
                                <Text style={styles.cardEntidad}>
                                    {tipoVista === 'deudas' 
                                        ? `${item.entidad} ${item.marcaTarjeta && item.marcaTarjeta !== 'N/A' ? `(${item.marcaTarjeta})` : ''}`
                                        : (item.nombre || 'Gasto Fijo')}
                                </Text>
                                
                                {tipoVista === 'deudas' ? (
                                    <>
                                        <Text style={styles.cardDetalle}>Monto Inicial: ${Number(item.monto).toFixed(2)}</Text>
                                        <Text style={styles.cardDetalle}>Total Pagado: <Text style={{color: '#4ADE80'}}> ${item.totalPagado.toFixed(2)}</Text></Text>
                                        <Text style={styles.cardDetalle}>Saldo Pendiente: <Text style={styles.textBold}>${item.montoRestante.toFixed(2)}</Text></Text>
                                        {item.cuotaPagar > 0 && (
                                            <Text style={styles.cardDetalle}>Cuota mensual: ${Number(item.cuotaPagar).toFixed(2)}</Text>
                                        )}
                                        <Text style={styles.cardDetalle}>Pago máx: {item.fechaMaxPago}</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.cardDetalle}>Monto Asignado: ${Number(item.monto).toFixed(2)}</Text>
                                        <Text style={styles.cardDetalle}>Total Pagado: <Text style={{color: '#4ADE80'}}> ${item.totalPagado.toFixed(2)}</Text></Text>
                                        <Text style={styles.cardDetalle}>Saldo Pendiente: <Text style={styles.textBold}>${item.montoRestante.toFixed(2)}</Text></Text>
                                    </>
                                )}

                                <Text style={styles.cardAuthor}>Registrado por: {item.autor || 'Usuario'}</Text>
                            </View>

                            {/* BOTONES DE ACCIÓN (EDITAR / BORRAR) */}
                            <View style={styles.actionContainer}>
                                <TouchableOpacity style={styles.editButton} onPress={() => abrirEdicion(item)}>
                                    <Text style={styles.actionIcon}>✏️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarItem(item.id, item.entidad || item.nombre)}>
                                    <Text style={styles.actionIcon}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {/* MODAL PARA EDITAR */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Editar {tipoVista === 'deudas' ? 'Deuda' : 'Gasto Fijo'}</Text>
                            <Text style={styles.modalSubtitle}>{itemSeleccionado?.categoria} - {itemSeleccionado?.entidad || itemSeleccionado?.nombre}</Text>

                            {tipoVista === 'fijos' && (
                                <>
                                    <Text style={styles.labelModal}>Nombre del Gasto Fijo</Text>
                                    <TextInput 
                                        style={styles.inputModal}
                                        value={nuevoNombre}
                                        onChangeText={setNuevoNombre}
                                        placeholderTextColor="#64748B"
                                    />
                                </>
                            )}

                            <Text style={styles.labelModal}>Monto ($)</Text>
                            <TextInput 
                                style={styles.inputModal}
                                keyboardType="numeric"
                                value={nuevoMonto}
                                onChangeText={setNuevoMonto}
                                placeholderTextColor="#64748B"
                            />

                            {tipoVista === 'deudas' && (
                                <>
                                    <Text style={styles.labelModal}>Cuota a pagar ($)</Text>
                                    <TextInput 
                                        style={styles.inputModal}
                                        keyboardType="numeric"
                                        value={nuevaCuota}
                                        onChangeText={setNuevaCuota}
                                        placeholderTextColor="#64748B"
                                    />

                                    <Text style={styles.labelModal}>Fecha máxima de pago</Text>
                                    <TextInput 
                                        style={styles.inputModal}
                                        value={nuevaFechaPago}
                                        onChangeText={setNuevaFechaPago}
                                        placeholderTextColor="#64748B"
                                    />
                                </>
                            )}

                            <View style={styles.modalButtonsRow}>
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalSaveBtn} onPress={guardarEdicion}>
                                    <Text style={styles.modalSaveText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        ...Platform.select({
            web: { height: '100vh' as any, overflow: 'hidden' as any },
            default: {},
        }),
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 25,
        paddingTop: 40,
        paddingBottom: 100,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#38BDF8',
        marginBottom: 6,
    },
    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 16,
    },
    tipoVistaContainer: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    tipoVistaBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    tipoVistaBtnActive: {
        backgroundColor: '#38BDF8',
    },
    tipoVistaText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 13,
    },
    tipoVistaTextActive: {
        color: '#0F172A',
        fontWeight: 'bold',
    },
    filterScroll: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    filterChip: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 10,
        height: 40,
    },
    filterChipSelected: {
        backgroundColor: '#1D4ED8',
        borderColor: '#60A5FA',
    },
    filterText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
    filterTextSelected: {
        color: '#FFFFFF',
    },
    resumenCard: {
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 20,
    },
    resumenTitle: {
        color: '#94A3B8',
        fontSize: 13,
        marginBottom: 4,
    },
    resumenAmount: {
        color: '#EA580C',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    resumenSub: {
        color: '#64748B',
        fontSize: 11,
    },
    emptyText: {
        color: '#64748B',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
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
        borderColor: '#334155',
    },
    cardCategoria: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    cardEntidad: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
    },
    cardDetalle: {
        color: '#94A3B8',
        fontSize: 13,
        marginBottom: 2,
    },
    textBold: {
        color: '#F8FAFC',
        fontWeight: '600',
    },
    cardAuthor: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 6,
    },
    actionContainer: {
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '100%',
        paddingLeft: 10,
    },
    editButton: {
        backgroundColor: '#1E3A8A',
        padding: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    deleteButton: {
        backgroundColor: '#7F1D1D',
        padding: 8,
        borderRadius: 8,
    },
    actionIcon: {
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        backgroundColor: '#1E293B',
        width: '85%',
        borderRadius: 16,
        padding: 22,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalTitle: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        color: '#38BDF8',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
    },
    labelModal: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    inputModal: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        padding: 12,
        color: '#F8FAFC',
        fontSize: 15,
        marginBottom: 14,
    },
    modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    modalCancelBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#64748B',
        borderRadius: 10,
        paddingVertical: 12,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    modalCancelText: {
        color: '#94A3B8',
        fontWeight: '600',
    },
    modalSaveBtn: {
        backgroundColor: '#1D4ED8',
        borderRadius: 10,
        paddingVertical: 12,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#FFFFFF',
        fontWeight: '700',
    }
})