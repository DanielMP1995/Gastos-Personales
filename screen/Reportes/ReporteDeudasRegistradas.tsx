import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { db, auth } from '../../firebase/FirebaseConfig'
import { ref, onValue, remove, update } from 'firebase/database'

export default function ReporteDeudasRegistradas({ navigation }: any) {
    const [deudas, setDeudas] = useState<any[]>([]);
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
    const [loading, setLoading] = useState(true);
    const [idPareja, setIdPareja] = useState<string | null>(null);

    // Estados para el Modal de Edición
    const [modalVisible, setModalVisible] = useState(false);
    const [deudaSeleccionada, setDeudaSeleccionada] = useState<any>(null);
    const [nuevoMonto, setNuevoMonto] = useState('');
    const [nuevaCuota, setNuevaCuota] = useState('');
    const [nuevaFechaPago, setNuevaFechaPago] = useState('');

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

    useEffect(() => {
        if (!idPareja) return;

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const unsubscribe = onValue(deudasRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const listaDeudas = Object.keys(data).map((key) => ({
                    id: key,
                    ...data[key]
                }));
                // Ordenar de más reciente a más antigua
                listaDeudas.sort((a, b) => new Date(b.fechaRegistro || 0).getTime() - new Date(a.fechaRegistro || 0).getTime());
                setDeudas(listaDeudas);
            } else {
                setDeudas([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error al cargar deudas:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [idPareja]);

    // Filtrar deudas según la categoría seleccionada
    const deudasFiltradas = categoriaFiltro === 'Todas' 
        ? deudas 
        : deudas.filter(item => item.categoria === categoriaFiltro);

    // Calcular el total de la vista actual filtrada
    const totalFiltrado = deudasFiltradas.reduce((acc, item) => acc + (Number(item.monto) || 0), 0);

    // Función para eliminar deuda
    const eliminarDeuda = (id: string, entidad: string) => {
        if (!idPareja) return;
        Alert.alert(
            "Eliminar Deuda",
            `¿Estás seguro de eliminar el registro de ${entidad}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: () => {
                        remove(ref(db, `parejas/${idPareja}/deudas/${id}`))
                            .then(() => Alert.alert("Éxito", "Deuda eliminada correctamente."))
                            .catch((error) => Alert.alert("Error", error.message));
                    } 
                }
            ]
        );
    };

    // Abrir modal de edición
    const abrirEdicion = (item: any) => {
        setDeudaSeleccionada(item);
        setNuevoMonto(item.monto.toString());
        setNuevaCuota(item.cuotaPagar ? item.cuotaPagar.toString() : '');
        setNuevaFechaPago(item.fechaMaxPago || '');
        setModalVisible(true);
    };

    // Guardar cambios de edición
    const guardarEdicion = () => {
        if (!idPareja || !deudaSeleccionada) return;
        if (!nuevoMonto) {
            Alert.alert("Atención", "El monto no puede estar vacío.");
            return;
        }

        const deudaRef = ref(db, `parejas/${idPareja}/deudas/${deudaSeleccionada.id}`);
        update(deudaRef, {
            monto: parseFloat(nuevoMonto),
            cuotaPagar: parseFloat(nuevaCuota) || 0,
            fechaMaxPago: nuevaFechaPago || 'N/A'
        })
        .then(() => {
            Alert.alert("¡Éxito!", "Deuda actualizada correctamente.");
            setModalVisible(false);
        })
        .catch((error) => {
            Alert.alert("Error", error.message);
        });
    };

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>Reporte de Deudas</Text>
            <Text style={styles.subtitulo}>Consulta, edita o administra tus compromisos</Text>

            {/* FILTROS POR CATEGORÍA */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {['Todas', 'Tarjeta de Crédito', 'Préstamo Bancario', 'Casa Comercial', 'Operadora Celular', 'Deuda Familiar'].map((cat) => (
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
                <Text style={styles.resumenTitle}>Total en {categoriaFiltro}</Text>
                <Text style={styles.resumenAmount}>${totalFiltrado.toFixed(2)}</Text>
                <Text style={styles.resumenSub}>{deudasFiltradas.length} {deudasFiltradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}</Text>
            </View>

            {/* LISTA DE DEUDAS */}
            {loading ? (
                <Text style={styles.emptyText}>Cargando deudas...</Text>
            ) : deudasFiltradas.length === 0 ? (
                <Text style={styles.emptyText}>No hay deudas registradas en esta categoría.</Text>
            ) : (
                deudasFiltradas.map((item) => (
                    <View key={item.id} style={styles.cardDeuda}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardCategoria}>{item.categoria}</Text>
                            <Text style={styles.cardEntidad}>{item.entidad} {item.marcaTarjeta && item.marcaTarjeta !== 'N/A' ? `(${item.marcaTarjeta})` : ''}</Text>
                            <Text style={styles.cardDetalle}>Monto Total: <Text style={styles.textBold}>${Number(item.monto).toFixed(2)}</Text></Text>
                            {item.cuotaPagar > 0 && (
                                <Text style={styles.cardDetalle}>Cuota mensual: ${Number(item.cuotaPagar).toFixed(2)}</Text>
                            )}
                            <Text style={styles.cardDetalle}>Pago máx: {item.fechaMaxPago}</Text>
                            <Text style={styles.cardAuthor}>Registrado por: {item.autor || 'Usuario'}</Text>
                        </View>

                        {/* BOTONES DE ACCIÓN (EDITAR / BORRAR) */}
                        <View style={styles.actionContainer}>
                            <TouchableOpacity style={styles.editButton} onPress={() => abrirEdicion(item)}>
                                <Text style={styles.actionIcon}>✏️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarDeuda(item.id, item.entidad)}>
                                <Text style={styles.actionIcon}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}

            {/* MODAL PARA EDITAR DEUDA */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Deuda</Text>
                        <Text style={styles.modalSubtitle}>{deudaSeleccionada?.categoria} - {deudaSeleccionada?.entidad}</Text>

                        <Text style={styles.labelModal}>Monto Total ($)</Text>
                        <TextInput 
                            style={styles.inputModal}
                            keyboardType="numeric"
                            value={nuevoMonto}
                            onChangeText={setNuevoMonto}
                            placeholderTextColor="#64748B"
                        />

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
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    container: {
        paddingHorizontal: 25,
        paddingTop: 40,
        paddingBottom: 40,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 6,
    },
    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 20,
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