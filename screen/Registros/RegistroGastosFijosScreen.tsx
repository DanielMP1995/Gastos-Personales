import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, push, set, onValue, get } from 'firebase/database';

export default function RegistroGastosFijosScreen({ navigation }: any) {
    const [nombreGasto, setNombreGasto] = useState('');
    const [montoFijo, setMontoFijo] = useState('');
    const [categoriaServicio, setCategoriaServicio] = useState('Luz');
    const [gastosFijosRegistrados, setGastosFijosRegistrados] = useState<any[]>([]);

    const categoriasServicios = ['Luz', 'Agua', 'Internet / Teléfono', 'Alquiler', 'Otro'];
    const usuarioActual = auth.currentUser;

    // Cargar los gastos fijos existentes de la pareja
    useEffect(() => {
        if (usuarioActual) {
            const usuarioRef = ref(db, `usuarios/${usuarioActual.uid}`);
            get(usuarioRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const idPareja = userData.idPareja;
                    if (idPareja) {
                        const fijosRef = ref(db, `parejas/${idPareja}/gastosFijos`);
                        onValue(fijosRef, (snap) => {
                            const data = snap.val();
                            if (data) {
                                const lista = Object.keys(data).map(key => ({
                                    id: key,
                                    ...data[key]
                                }));
                                setGastosFijosRegistrados(lista);
                            } else {
                                setGastosFijosRegistrados([]);
                            }
                        });
                    }
                }
            });
        }
    }, [usuarioActual]);

    function guardarGastoFijo() {
        const montoNum = parseFloat(montoFijo);
        if (!nombreGasto.trim()) {
            Alert.alert("Error", "Por favor ingresa un nombre o descripción para el gasto fijo.");
            return;
        }
        if (isNaN(montoNum) || montoNum <= 0) {
            Alert.alert("Error", "Ingresa un monto mensual válido.");
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

                const fijosRef = ref(db, `parejas/${idPareja}/gastosFijos`);
                const nuevoFijoRef = push(fijosRef);

                const datosFijo = {
                    nombre: nombreGasto.trim(),
                    categoria: categoriaServicio,
                    monto: montoNum,
                    fechaRegistro: new Date().toISOString(),
                    autor: userData.nombre
                };

                set(nuevoFijoRef, datosFijo)
                    .then(() => {
                        Alert.alert("¡Éxito!", "Gasto fijo configurado correctamente.");
                        setNombreGasto('');
                        setMontoFijo('');
                    })
                    .catch((error) => Alert.alert("Error", error.message));
            }
        });
    }

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>⚡ Configurar Gastos Fijos</Text>
            <Text style={styles.subtitulo}>Establece tus servicios recurrentes mensuales.</Text>

            {/* Formulario de Registro */}
            <View style={styles.formCard}>
                <Text style={styles.label}>Tipo de Servicio:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowCat}>
                    {categoriasServicios.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[styles.catBtn, categoriaServicio === cat && styles.catBtnActive]} 
                            onPress={() => setCategoriaServicio(cat)}
                        >
                            <Text style={categoriaServicio === cat ? styles.catTextActive : styles.catText}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.label}>Nombre / Identificador:</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Luz de casa / Plan de Claro" 
                    placeholderTextColor="#64748B" 
                    value={nombreGasto} 
                    onChangeText={setNombreGasto} 
                />

                <Text style={styles.label}>Monto Estimado Mensual ($):</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. 35.00" 
                    placeholderTextColor="#64748B" 
                    keyboardType="numeric" 
                    value={montoFijo} 
                    onChangeText={setMontoFijo} 
                />

                <TouchableOpacity style={styles.btnGuardar} onPress={guardarGastoFijo}>
                    <Ionicons name="add-circle-outline" size={18} color="white" style={{marginRight: 6}} />
                    <Text style={styles.btnGuardarText}>Guardar Gasto Fijo</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de Gastos Fijos ya Configurados */}
            <Text style={styles.sectionTitle}>Servicios Fijos Registrados</Text>
            {gastosFijosRegistrados.length === 0 ? (
                <Text style={styles.vacioTexto}>Aún no hay gastos fijos configurados.</Text>
            ) : (
                gastosFijosRegistrados.map(item => (
                    <View key={item.id} style={styles.itemCard}>
                        <View>
                            <Text style={styles.itemNombre}>{item.nombre}</Text>
                            <Text style={styles.itemCategoria}>Cat: {item.categoria}</Text>
                        </View>
                        <Text style={styles.itemMonto}>${item.monto}</Text>
                    </View>
                ))
            )}

            <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
                <Text style={styles.btnVolverText}>Regresar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: '#0F172A' },
    container: { padding: 25, paddingTop: 30 },
    titulo: { fontSize: 24, fontWeight: 'bold', color: '#38BDF8', textAlign: 'center', marginBottom: 4 },
    subtitulo: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
    formCard: { backgroundColor: '#1E293B', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#334155', marginBottom: 20 },
    label: { color: '#F8FAFC', fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 8 },
    rowCat: { paddingVertical: 4, marginBottom: 8 },
    catBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#0F172A', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
    catBtnActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
    catText: { color: '#94A3B8', fontSize: 12 },
    catTextActive: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
    input: { backgroundColor: '#0F172A', borderRadius: 10, padding: 12, color: '#F8FAFC', marginBottom: 10, borderWidth: 1, borderColor: '#334155', fontSize: 14 },
    btnGuardar: { backgroundColor: '#EA580C', padding: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    btnGuardarText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC', marginBottom: 10 },
    vacioTexto: { color: '#64748B', fontSize: 13, fontStyle: 'italic', marginBottom: 15 },
    itemCard: { backgroundColor: '#1E293B', padding: 14, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
    itemNombre: { color: '#F8FAFC', fontWeight: 'bold', fontSize: 14 },
    itemCategoria: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
    itemMonto: { color: '#38BDF8', fontWeight: 'bold', fontSize: 16 },
    btnVolver: { padding: 14, alignItems: 'center', marginTop: 10, backgroundColor: '#1E293B', borderRadius: 10, borderWidth: 1, borderColor: '#334155', marginBottom: 30 },
    btnVolverText: { color: '#94A3B8', fontWeight: '600' }
});