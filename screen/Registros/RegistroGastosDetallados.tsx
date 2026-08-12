import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, onValue, push, set, get } from 'firebase/database';

export default function RegistroGastosDetallados({ navigation }: any) {
    const [tipoGasto, setTipoGasto] = useState<'deuda' | 'fijo'>('deuda');
    const [subCategoria, setSubCategoria] = useState('Tarjeta de Crédito');
    
    const subCategoriasDeuda = ['Tarjeta de Crédito', 'Préstamo Bancario', 'Casa Comercial', 'Deuda Familiar'];
    const subCategoriasFijo = ['Luz', 'Agua', 'Internet / Teléfono', 'Alquiler', 'Otro'];

    const [deudasFirebase, setDeudasFirebase] = useState<any[]>([]);
    const [movimientosFirebase, setMovimientosFirebase] = useState<any[]>([]);
    const [gastosFijosFirebase, setGastosFijosFirebase] = useState<any[]>([]);
    
    const [deudaSeleccionada, setDeudaSeleccionada] = useState<any>(null);
    const [gastoFijoSeleccionado, setGastoFijoSeleccionado] = useState<any>(null);

    const [montoPagar, setMontoPagar] = useState('');
    const [descripcionDetalle, setDescripcionDetalle] = useState('');

    const usuarioActual = auth.currentUser;

    useEffect(() => {
        if (usuarioActual) {
            const usuarioRef = ref(db, `usuarios/${usuarioActual.uid}`);
            get(usuarioRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const idPareja = userData.idPareja;
                    if (idPareja) {
                        onValue(ref(db, `parejas/${idPareja}/deudas`), (snap) => {
                            const data = snap.val();
                            setDeudasFirebase(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
                        });
                        onValue(ref(db, `parejas/${idPareja}/movimientos`), (snap) => {
                            const data = snap.val();
                            setMovimientosFirebase(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
                        });
                        onValue(ref(db, `parejas/${idPareja}/gastosFijos`), (snap) => {
                            const data = snap.val();
                            setGastosFijosFirebase(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
                        });
                    }
                }
            });
        }
    }, [usuarioActual]);

    // Calcular saldo pendiente real de cada deuda restando sus movimientos/pagos asociados
    const deudasConSaldo = deudasFirebase.map(deuda => {
        const pagosAsociados = movimientosFirebase.filter(mov => {
            if (mov.deudaId && mov.deudaId === deuda.id) return true;

            const desc = (mov.descripcion || '').toLowerCase();
            const ent = (deuda.entidad || '').toLowerCase();
            const cat = (deuda.categoria || '').toLowerCase();
            
            return (ent && desc.includes(ent)) || (cat && desc.includes(cat) && mov.tipo === 'gasto');
        });

        const totalPagado = pagosAsociados.reduce((sum, mov) => sum + (Number(mov.monto) || 0), 0);
        const montoOriginal = Number(deuda.monto) || 0;
        const saldoRestante = Math.max(0, montoOriginal - totalPagado);

        return {
            ...deuda,
            saldoRestante
        };
    });

    const deudasFiltradas = deudasConSaldo.filter(deuda => {
        const catBD = (deuda.categoria || '').trim().toLowerCase();
        const catActual = subCategoria.trim().toLowerCase();
        return catBD === catActual;
    });

    const fijosFiltrados = gastosFijosFirebase.filter(gasto => {
        const catBD = (gasto.categoria || '').trim().toLowerCase();
        const catActual = subCategoria.trim().toLowerCase();
        
        if (catActual.includes('internet')) {
            return catBD.includes('internet') || catBD.includes('teléfono') || catBD.includes('telefono');
        }
        return catBD === catActual;
    });

    function guardarPagoDetallado() {
        const montoNum = parseFloat(montoPagar);
        if (isNaN(montoNum) || montoNum <= 0) {
            Alert.alert("Error", "Ingresa un monto válido a pagar.");
            return;
        }

        if (tipoGasto === 'deuda' && !deudaSeleccionada) {
            Alert.alert("Atención", "Por favor selecciona una deuda de la lista.");
            return;
        }

        if (!usuarioActual) return;

        const usuarioRef = ref(db, `usuarios/${usuarioActual.uid}`);
        get(usuarioRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const idPareja = userData.idPareja;

                if (!idPareja) {
                    Alert.alert("Error", "No tienes una pareja vinculada.");
                    return;
                }

                const movimientosRef = ref(db, `parejas/${idPareja}/movimientos`);
                const nuevoMovimientoRef = push(movimientosRef);

                let nombreConcepto = '';
                let datosMovimiento: any = {
                    tipo: 'gasto',
                    monto: montoNum,
                    fecha: new Date().toISOString(),
                    autor: userData.nombre || 'Usuario',
                    categoria: subCategoria
                };

                if (tipoGasto === 'deuda') {
                    const nombreEntidad = deudaSeleccionada ? (deudaSeleccionada.entidad || deudaSeleccionada.nombre || 'Deuda') : '';
                    nombreConcepto = `Pago Deuda (${subCategoria})${nombreEntidad ? ' - ' + nombreEntidad : ''}`;
                    datosMovimiento.deudaId = deudaSeleccionada.id;
                    datosMovimiento.entidadDeuda = nombreEntidad;
                } else {
                    const nombreFijo = gastoFijoSeleccionado ? (gastoFijoSeleccionado.nombre || 'Servicio') : subCategoria;
                    nombreConcepto = `Gasto Fijo (${subCategoria}) - ${nombreFijo}`;
                }

                datosMovimiento.descripcion = descripcionDetalle.trim() 
                    ? `${nombreConcepto}: ${descripcionDetalle.trim()}`
                    : nombreConcepto;

                set(nuevoMovimientoRef, datosMovimiento)
                    .then(() => {
                        Alert.alert("¡Éxito!", `Se registró el pago de $${montoNum} y se descontó del balance.`);
                        navigation.goBack();
                    })
                    .catch((error) => Alert.alert("Error", error.message));
            }
        });
    }

    return (
        <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={true}
        >
            <Text style={styles.titulo}>📋 Gasto Detallado</Text>
            <Text style={styles.subtitulo}>Registra pagos a deudas o servicios fijos descontando de tu balance.</Text>

            <View style={styles.tipoContainer}>
                <TouchableOpacity 
                    style={[styles.tipoBtn, tipoGasto === 'deuda' && styles.tipoBtnActive]} 
                    onPress={() => { setTipoGasto('deuda'); setSubCategoria('Tarjeta de Crédito'); setDeudaSeleccionada(null); setGastoFijoSeleccionado(null); setMontoPagar(''); }}
                >
                    <Ionicons name="card-outline" size={18} color={tipoGasto === 'deuda' ? '#0F172A' : '#38BDF8'} style={{marginRight: 6}}/>
                    <Text style={[styles.tipoBtnText, tipoGasto === 'deuda' && styles.tipoBtnTextActive]}>Pagar Deuda</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.tipoBtn, tipoGasto === 'fijo' && styles.tipoBtnActive]} 
                    onPress={() => { setTipoGasto('fijo'); setSubCategoria('Luz'); setDeudaSeleccionada(null); setGastoFijoSeleccionado(null); setMontoPagar(''); }}
                >
                    <Ionicons name="flash-outline" size={18} color={tipoGasto === 'fijo' ? '#0F172A' : '#38BDF8'} style={{marginRight: 6}}/>
                    <Text style={[styles.tipoBtnText, tipoGasto === 'fijo' && styles.tipoBtnTextActive]}>Servicios / Fijos</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Selecciona el tipo de {tipoGasto === 'deuda' ? 'deuda' : 'servicio'}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowSub}>
                {(tipoGasto === 'deuda' ? subCategoriasDeuda : subCategoriasFijo).map(item => (
                    <TouchableOpacity 
                        key={item} 
                        style={[styles.subBtn, subCategoria === item && styles.subBtnActive]} 
                        onPress={() => { setSubCategoria(item); setDeudaSeleccionada(null); setGastoFijoSeleccionado(null); setMontoPagar(''); }}
                    >
                        <Text style={subCategoria === item ? styles.subTextActive : styles.subText}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* LISTA DE DEUDAS */}
            {tipoGasto === 'deuda' && (
                <View style={styles.seccionDeudasBox}>
                    <Text style={styles.labelBox}>Deudas de tipo "{subCategoria}":</Text>
                    {deudasFiltradas.length === 0 ? (
                        <Text style={styles.avisoTexto}>No hay deudas registradas bajo esta categoría exacta.</Text>
                    ) : (
                        deudasFiltradas.map(deuda => {
                            const nombreEntidad = deuda.entidad || deuda.nombre || 'Deuda sin nombre';
                            const valorCuota = deuda.cuotaPagar || 0;
                            const totalCuotas = deuda.numeroCuotas || 1;
                            const saldoTotalRestante = deuda.saldoRestante;

                            return (
                                <TouchableOpacity 
                                    key={deuda.id} 
                                    style={[styles.deudaItemCard, deudaSeleccionada?.id === deuda.id && styles.deudaCardActive]}
                                    onPress={() => {
                                        setDeudaSeleccionada(deuda);
                                        if(valorCuota) setMontoPagar(valorCuota.toString());
                                    }}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.deudaNombre}>{nombreEntidad}</Text>
                                        <Text style={styles.deudaMonto}>Cuota: ${valorCuota} ({totalCuotas} cuotas)</Text>
                                        <Text style={styles.deudaTotalRestante}>Deuda Total a deber: ${saldoTotalRestante.toFixed(2)}</Text>
                                    </View>
                                    {deudaSeleccionada?.id === deuda.id && (
                                        <Ionicons name="checkmark-circle" size={22} color="#38BDF8" />
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            )}

            {/* LISTA DE GASTOS FIJOS CONFIGURADOS */}
            {tipoGasto === 'fijo' && (
                <View style={styles.seccionDeudasBox}>
                    <Text style={styles.labelBox}>Servicios fijos registrados en "{subCategoria}":</Text>
                    {fijosFiltrados.length === 0 ? (
                        <Text style={styles.avisoTexto}>No hay servicios fijos configurados en esta categoría.</Text>
                    ) : (
                        fijosFiltrados.map(gasto => (
                            <TouchableOpacity 
                                key={gasto.id} 
                                style={[styles.deudaItemCard, gastoFijoSeleccionado?.id === gasto.id && styles.deudaCardActive]}
                                onPress={() => {
                                    setGastoFijoSeleccionado(gasto);
                                    const montoVal = gasto.monto || gasto.montoEstimado || 0;
                                    if(montoVal) setMontoPagar(montoVal.toString());
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.deudaNombre}>{gasto.nombre || 'Servicio sin nombre'}</Text>
                                    <Text style={styles.deudaMonto}>Monto: ${gasto.monto || gasto.montoEstimado || 0}</Text>
                                </View>
                                {gastoFijoSeleccionado?.id === gasto.id && (
                                    <Ionicons name="checkmark-circle" size={22} color="#38BDF8" />
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}

            <Text style={styles.label}>Monto a pagar / abonar ($):</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Ej. 45.00" 
                placeholderTextColor="#64748B" 
                keyboardType="numeric"
                value={montoPagar} 
                onChangeText={setMontoPagar} 
            />

            <Text style={styles.label}>Descripción o Nota adicional (Opcional):</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Ej. Pago del mes" 
                placeholderTextColor="#64748B" 
                value={descripcionDetalle} 
                onChangeText={setDescripcionDetalle} 
            />

            <TouchableOpacity style={styles.btnGuardar} onPress={guardarPagoDetallado}>
                <Ionicons name="save-outline" size={18} color="white" style={{marginRight: 6}} />
                <Text style={styles.btnGuardarText}>Registrar Pago y Descontar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
                <Text style={styles.btnVolverText}>Cancelar / Volver</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: { 
        flex: 1, 
        backgroundColor: '#0F172A' 
    },
    container: { 
        padding: 25, 
        paddingTop: 30,
        paddingBottom: 60 
    },
    titulo: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#38BDF8', 
        textAlign: 'center', 
        marginBottom: 6 
    },
    subtitulo: { 
        fontSize: 13, 
        color: '#94A3B8', 
        textAlign: 'center', 
        marginBottom: 20 
    },
    tipoContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 15, 
        backgroundColor: '#1E293B', 
        padding: 4, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    tipoBtn: { 
        flex: 0.48, 
        paddingVertical: 10, 
        borderRadius: 8, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    tipoBtnActive: { 
        backgroundColor: '#38BDF8' 
    },
    tipoBtnText: { 
        color: '#38BDF8', 
        fontWeight: '600', 
        fontSize: 13 
    },
    tipoBtnTextActive: { 
        color: '#0F172A', 
        fontWeight: 'bold' 
    },
    label: { 
        color: '#F8FAFC', 
        fontSize: 14, 
        fontWeight: '600', 
        marginBottom: 8, 
        marginTop: 12 
    },
    labelBox: { 
        color: '#F8FAFC', 
        fontSize: 14, 
        fontWeight: '600', 
        marginBottom: 8 
    },
    rowSub: { 
        paddingVertical: 4, 
        marginBottom: 10 
    },
    subBtn: { 
        paddingVertical: 8, 
        paddingHorizontal: 14, 
        borderRadius: 8, 
        backgroundColor: '#1E293B', 
        marginRight: 8, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    subBtnActive: { 
        backgroundColor: '#EA580C', 
        borderColor: '#EA580C' 
    },
    subText: { 
        color: '#94A3B8', 
        fontSize: 13 
    },
    subTextActive: { 
        color: '#FFFFFF', 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    seccionDeudasBox: { 
        backgroundColor: '#1E293B', 
        padding: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#334155', 
        marginBottom: 10 
    },
    avisoTexto: { 
        color: '#94A3B8', 
        fontSize: 12, 
        fontStyle: 'italic' 
    },
    deudaItemCard: { 
        backgroundColor: '#0F172A', 
        padding: 12, 
        borderRadius: 8, 
        marginBottom: 8, 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    deudaCardActive: { 
        borderColor: '#38BDF8', 
        backgroundColor: '#1E3A8A' 
    },
    deudaNombre: { 
        color: '#F8FAFC', 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    deudaMonto: { 
        color: '#38BDF8', 
        fontSize: 12, 
        marginTop: 2 
    },
    deudaTotalRestante: {
        color: '#F97316',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 3
    },
    input: { 
        backgroundColor: '#1E293B', 
        borderRadius: 10, 
        padding: 12, 
        color: '#F8FAFC', 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: '#334155', 
        fontSize: 15 
    },
    btnGuardar: { 
        backgroundColor: '#EA580C', 
        padding: 15, 
        borderRadius: 10, 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: 15 
    },
    btnGuardarText: { 
        color: 'white', 
        fontWeight: 'bold', 
        fontSize: 15 
    },
    btnVolver: { 
        padding: 14, 
        alignItems: 'center', 
        marginTop: 10, 
        backgroundColor: '#1E293B', 
        borderRadius: 10, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    btnVolverText: { 
        color: '#94A3B8', 
        fontWeight: '600' 
    }
});