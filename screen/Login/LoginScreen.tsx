import { StyleSheet, Text, TextInput, View, Alert, Image, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, get, child } from 'firebase/database';

export default function LoginScreen({ navigation }: any) {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // Función inteligente que verifica si ya tiene pareja antes de entrar
    const verificarYRedirigir = (user: any) => {
        const dbRef = ref(db);
        get(child(dbRef, `usuarios/${user.uid}`))
            .then((snapshot) => {
                if (snapshot.exists() && snapshot.val().idPareja) {
                    // Ya tiene pareja configurada, va al dashboard
                    navigation.replace('tabs');
                } else {
                    // No tiene pareja, lo mandamos a configurarla
                    navigation.replace('configurarPareja');
                }
            })
            .catch(() => {
                navigation.replace('configurarPareja');
            });
    };

    function ingresar() {
        if (!correo || !contrasena) {
            Alert.alert("Atención", "Por favor ingresa tu correo y contraseña");
            return;
        }

        signInWithEmailAndPassword(auth, correo.trim(), contrasena)
            .then((userCredential) => {
                verificarYRedirigir(userCredential.user);
            })
            .catch((error) => {
                console.log("Error en login:", error.code, error.message);
                Alert.alert("Error", "Correo o contraseña incorrectos");
            });
    }

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../../assets/img/logov2.png')} 
                    style={styles.logo} 
                    resizeMode="contain" 
                />
            </View>

            <Text style={styles.titulo}>Bienvenido</Text>

            <TextInput
                placeholder='Correo electrónico' 
                placeholderTextColor="#94A3B8" 
                onChangeText={setCorreo} 
                style={styles.input} 
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                placeholder='Ingrese su contraseña' 
                placeholderTextColor="#94A3B8" 
                secureTextEntry 
                onChangeText={setContrasena} 
                style={styles.input} 
            />

            <TouchableOpacity style={styles.primaryButton} onPress={ingresar}>
                <Text style={styles.primaryButtonText}>Ingresar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('registro')}>
                <Text style={styles.secondaryButtonText}>Regístrate aquí</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 300,
        height: 310,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 20,
    },
    input: {
        marginTop: 15,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        padding: 14,
        color: '#F8FAFC',
        fontSize: 15,
    },
    primaryButton: {
        backgroundColor: '#1D4ED8',
        marginTop: 25,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#1D4ED8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: '#EA580C',
        marginTop: 15,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#EA580C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    }
})