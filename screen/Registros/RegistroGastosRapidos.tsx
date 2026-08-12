import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, TextInput } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, push, set, get } from 'firebase/database';

export default function RegistroGastosRapidos({ navigation }: any) {
    const [monto, setMonto] = useState('');
    const [motivo, setMotivo] = useState('');
    const [categoria, setCategoria] = useState('Tienda');

    const categorias = ['Tienda', 'Farmacia', 'Comida', 'Transporte'];

    function guardarGasto() {
        if (!monto || parseFloat(monto) <= 0) {
            Alert.alert("Error", "Por favor ingresa o selecciona un monto válido.");
            return;
        }

        const usuarioActual = auth.currentUser;
        if (!usuarioActual) return;

        const usuarioRef = ref(db, `usuarios/${usuarioActual.uid}`);
        get(usuarioRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const gastosRef = ref(db, `parejas/${userData.idPareja}/movimientos`);
                const nuevoGastoRef = push(gastosRef);

                // Si escribió motivo lo añadimos, si no, se queda solo con la categoría
                const descripcionFinal = motivo.trim() 
                    ? `${categoria} - ${motivo.trim()}` 
                    : `Gasto rápido: ${categoria}`;

                set(nuevoGastoRef, {
                    tipo: 'gasto',
                    monto: parseFloat(monto),
                    descripcion: descripcionFinal,
                    fecha: new Date().toISOString(),
                    autor: userData.nombre
                }).then(() => {
                    Alert.alert("¡Éxito!", "Gasto registrado correctamente.");
                    navigation.goBack();
                });
            }
        });
    }

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>⚡ Gasto Rápido</Text>

            {/* Selector de Categoría */}
            <Text style={styles.label}>Categoría:</Text>
            <View style={styles.row}>
                {categorias.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.catBtn, categoria === cat && styles.catActive]} onPress={() => setCategoria(cat)}>
                        <Text style={categoria === cat ? styles.catTextActive : styles.catText}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Selector de Monto */}
            <Text style={styles.label}>Monto ($):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                    <TouchableOpacity 
                        key={val} 
                        style={[styles.montoBtn, monto === val.toString() && styles.montoActive]} 
                        onPress={() => setMonto(val.toString())}
                    >
                        <Text style={[styles.montoText, monto === val.toString() && styles.montoTextActive]}>${val}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            
            <TextInput 
                style={styles.input} 
                placeholder="O escribe otro valor..." 
                placeholderTextColor="#64748B" 
                keyboardType="numeric" 
                value={monto} 
                onChangeText={setMonto} 
            />

            {/* Motivo OPCIONAL */}
            <Text style={styles.label}>Motivo / Descripción (Opcional):</Text>
            <TextInput 
                style={styles.input} 
                placeholder="Ej: Pan y leche (opcional)" 
                placeholderTextColor="#64748B" 
                value={motivo} 
                onChangeText={setMotivo} 
            />

            {/* Botón Guardar */}
            <TouchableOpacity style={styles.btnGuardar} onPress={guardarGasto}>
                <Text style={styles.btnGuardarText}>Registrar Gasto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnVolver} onPress={() => navigation.goBack()}>
                <Text style={styles.btnVolverText}>Cancelar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: '#0F172A' },
    container: { padding: 25 },
    titulo: { fontSize: 24, fontWeight: 'bold', color: '#EF4444', textAlign: 'center', marginBottom: 20 },
    label: { color: '#94A3B8', fontSize: 14, marginBottom: 8, marginTop: 10 },
    row: { flexDirection: 'row', marginBottom: 10 },
    catBtn: { padding: 10, borderRadius: 8, backgroundColor: '#1E293B', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
    catActive: { backgroundColor: '#38BDF8' },
    catText: { color: '#F8FAFC' },
    catTextActive: { color: '#0F172A', fontWeight: 'bold' },
    montoBtn: { padding: 15, borderRadius: 8, backgroundColor: '#1E293B', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
    montoActive: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
    montoText: { color: '#38BDF8', fontWeight: 'bold' },
    montoTextActive: { color: '#FFFFFF' },
    input: { backgroundColor: '#1E293B', borderRadius: 8, padding: 12, color: '#F8FAFC', marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    btnGuardar: { backgroundColor: '#EA580C', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    btnGuardarText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    btnVolver: { padding: 16, alignItems: 'center', marginTop: 10 },
    btnVolverText: { color: '#94A3B8' }
});