import { StyleSheet, Text, TextInput, View, Alert, Image, TouchableOpacity, ScrollView, Switch } from 'react-native'
import React, { useState, useEffect } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, set } from 'firebase/database';

export default function RegistroScreen({ navigation }: any) {
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [genero, setGenero] = useState('')
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    
    // Estados para el manejo del código de pareja en el registro
    const [tieneCodigoPareja, setTieneCodigoPareja] = useState(false);
    const [codigoIngresado, setCodigoIngresado] = useState('');

    useEffect(() => { navigation.setOptions({ headerShown: false }); }, [navigation]);

    function registrarse() {
        if (!nombre || !apellido || !genero || !correo || !contrasena) {
            Alert.alert("Error", "Por favor completa todos los campos y selecciona tu género");
            return;
        }

        if (tieneCodigoPareja && !codigoIngresado.trim()) {
            Alert.alert("Atención", "Has indicado que tienes un código de pareja. Por favor ingrésalo o desactiva la opción.");
            return;
        }

        createUserWithEmailAndPassword(auth, correo.trim(), contrasena)
            .then((userCredential) => {
                const user = userCredential.user;
                // Si marcó que tiene código, usa ese. Si no, genera uno propio con su UID.
                const idParejaFinal = tieneCodigoPareja ? codigoIngresado.trim().toUpperCase() : user.uid.substring(0, 6).toUpperCase();

                return set(ref(db, `usuarios/${user.uid}`), {
                    nombre: nombre,
                    apellido: apellido,
                    genero: genero,
                    correo: correo.trim(),
                    idPareja: idParejaFinal,
                    fechaRegistro: new Date().toISOString()
                });
            })
            .then(() => {
                Alert.alert("Éxito", "Cuenta creada correctamente. Ahora inicia sesión.");
                navigation.navigate('login');
            })
            .catch((error) => Alert.alert("Error", error.message));
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.logoContainer}>
                <Image source={require('../../assets/img/logov2.png')} style={styles.logo} />
            </View>
            <Text style={styles.titulo}>Crear Cuenta</Text>

            <TextInput placeholder='Nombre' placeholderTextColor="#94A3B8" onChangeText={setNombre} style={styles.input} />
            <TextInput placeholder='Apellido' placeholderTextColor="#94A3B8" onChangeText={setApellido} style={styles.input} />

            <Text style={styles.label}>Selecciona tu género:</Text>
            <View style={styles.generoContainer}>
                <TouchableOpacity
                    style={[styles.genBtn, genero === 'Masculino' && styles.genBtnActive]}
                    onPress={() => setGenero('Masculino')}
                >
                    <Text style={styles.genText}>Masculino</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.genBtn, genero === 'Femenino' && styles.genBtnActive]}
                    onPress={() => setGenero('Femenino')}
                >
                    <Text style={styles.genText}>Femenino</Text>
                </TouchableOpacity>
            </View>

            <TextInput placeholder='Correo electrónico' placeholderTextColor="#94A3B8" onChangeText={setCorreo} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
            <TextInput placeholder='Contraseña' placeholderTextColor="#94A3B8" secureTextEntry onChangeText={setContrasena} style={styles.input} />

            {/* SECCIÓN OPCIONAL: ¿TIENES CÓDIGO DE PAREJA? */}
            <View style={styles.switchRow}>
                <Text style={styles.labelSwitch}>¿Tienes un código de pareja?</Text>
                <Switch 
                    value={tieneCodigoPareja} 
                    onValueChange={setTieneCodigoPareja}
                    trackColor={{ false: '#334155', true: '#EA580C' }}
                    thumbColor={tieneCodigoPareja ? '#F8FAFC' : '#94A3B8'}
                />
            </View>

            {tieneCodigoPareja && (
                <TextInput 
                    placeholder='Pega aquí el código de tu pareja' 
                    placeholderTextColor="#94A3B8" 
                    value={codigoIngresado}
                    onChangeText={setCodigoIngresado} 
                    style={styles.input} 
                    autoCapitalize="characters"
                />
            )}

            <TouchableOpacity style={styles.primaryButton} onPress={registrarse}>
                <Text style={styles.primaryButtonText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('login')}>
                <Text style={styles.secondaryButtonText}>Volver al Login</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#0F172A',
        padding: 30,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 120,
        height: 120,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 20,
    },
    input: {
        marginTop: 12,
        backgroundColor: '#1E293B',
        borderRadius: 10,
        padding: 15,
        color: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#334155',
    },
    label: {
        color: '#94A3B8',
        marginTop: 15,
        marginLeft: 5,
        fontSize: 13,
    },
    switchRow: {
        flexDirection: 'row',
        
        alignItems: 'center',
        marginTop: 18,
        backgroundColor: '#1E293B',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },
    labelSwitch: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },
    generoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    genBtn: {
        flex: 0.48,
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#1E293B',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    genBtnActive: {
        borderColor: '#EA580C',
        backgroundColor: '#431407',
    },
    genText: {
        color: '#F8FAFC',
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#EA580C',
        marginTop: 25,
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        marginTop: 15,
        alignItems: 'center',
        backgroundColor: '#0823d1',
        borderRadius: 10,
        paddingVertical: 16,
    },
    secondaryButtonText: {
        color: '#f2eeeb',
        fontSize: 14,
        fontWeight: '600',
    },
})