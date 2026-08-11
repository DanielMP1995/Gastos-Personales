import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { db, auth } from '../firebase/FirebaseConfig'
import { ref, update } from 'firebase/database'

export default function ConfigurarParejaScreen({ navigation }: any) {
    const [codigo, setCodigo] = useState('')

    const guardarCodigo = () => {
        if (!codigo) return Alert.alert("Error", "Ingresa un código de pareja");
        const uid = auth.currentUser?.uid;
        update(ref(db, `usuarios/${uid}`), { idPareja: codigo })
            .then(() => navigation.replace('Tabs'))
            .catch(e => Alert.alert("Error", e.message));
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Configura tu Pareja</Text>
            <Text style={styles.desc}>Ingresa el código compartido para unirte o crea uno nuevo:</Text>
            <TextInput style={styles.input} placeholder="Ej: PAREJA-123" value={codigo} onChangeText={setCodigo} />
            <TouchableOpacity style={styles.btn} onPress={guardarCodigo}>
                <Text style={styles.btnText}>Continuar</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 30 },
    title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    desc: { color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
    input: { backgroundColor: '#1E293B', color: '#FFF', padding: 15, borderRadius: 10, marginBottom: 20 },
    btn: { backgroundColor: '#1D4ED8', padding: 15, borderRadius: 10, alignItems: 'center' },
    btnText: { color: '#FFF', fontWeight: 'bold' }
})