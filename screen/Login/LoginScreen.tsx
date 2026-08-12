import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert,
    Image,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, get, child } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }: any) {
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // ============================================================
    // VERIFICAR SI EL USUARIO YA TIENE PAREJA
    // ============================================================

    const verificarYRedirigir = (user: any) => {
        const dbRef = ref(db);

        get(child(dbRef, `usuarios/${user.uid}`))
            .then((snapshot) => {
                if (
                    snapshot.exists() &&
                    snapshot.val().idPareja
                ) {
                    navigation.replace('tabs');
                } else {
                    navigation.replace('configurarPareja');
                }
            })
            .catch(() => {
                navigation.replace('configurarPareja');
            });
    };

    // ============================================================
    // INGRESAR
    // ============================================================

    function ingresar() {
        if (!correo.trim() || !contrasena) {
            Alert.alert(
                'Atención',
                'Por favor ingresa tu correo y contraseña'
            );
            return;
        }

        setCargando(true);

        signInWithEmailAndPassword(
            auth,
            correo.trim(),
            contrasena
        )
            .then((userCredential) => {
                verificarYRedirigir(userCredential.user);
            })
            .catch((error) => {
                console.log(
                    'Error en login:',
                    error.code,
                    error.message
                );

                Alert.alert(
                    'No se pudo ingresar',
                    'Correo o contraseña incorrectos'
                );

                setCargando(false);
            });
    }

    return (
        <KeyboardAvoidingView
            style={styles.keyboardContainer}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>

                    {/* DECORACIÓN SUPERIOR */}

                    <View style={styles.glowTop} />

                    {/* LOGO */}

                    <View style={styles.logoContainer}>
                        <View style={styles.logoBackground}>
                            <Image
                                source={require('../../assets/img/logov2.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* TÍTULO */}

                    <View style={styles.titleContainer}>
                        <Text style={styles.titulo}>
                            Bienvenido
                        </Text>

                        <Text style={styles.subtitulo}>
                            Administra tus finanzas en pareja
                        </Text>
                    </View>

                    {/* FORMULARIO */}

                    <View style={styles.formCard}>

                        {/* CORREO */}

                        <Text style={styles.inputLabel}>
                            Correo electrónico
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color="#38BDF8"
                                style={styles.inputIcon}
                            />

                            <TextInput
                                placeholder="Ingresa tu correo"
                                placeholderTextColor="#64748B"
                                value={correo}
                                onChangeText={setCorreo}
                                style={styles.input}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                            />
                        </View>

                        {/* CONTRASEÑA */}

                        <Text style={styles.inputLabel}>
                            Contraseña
                        </Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color="#38BDF8"
                                style={styles.inputIcon}
                            />

                            <TextInput
                                placeholder="Ingresa tu contraseña"
                                placeholderTextColor="#64748B"
                                secureTextEntry={
                                    !mostrarContrasena
                                }
                                value={contrasena}
                                onChangeText={setContrasena}
                                style={styles.input}
                                autoCapitalize="none"
                            />

                            <TouchableOpacity
                                onPress={() =>
                                    setMostrarContrasena(
                                        !mostrarContrasena
                                    )
                                }
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={
                                        mostrarContrasena
                                            ? 'eye-off-outline'
                                            : 'eye-outline'
                                    }
                                    size={21}
                                    color="#94A3B8"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* BOTÓN INGRESAR */}

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                cargando &&
                                    styles.buttonDisabled,
                            ]}
                            onPress={ingresar}
                            disabled={cargando}
                            activeOpacity={0.8}
                        >
                            {cargando ? (
                                <Text
                                    style={
                                        styles.primaryButtonText
                                    }
                                >
                                    Ingresando...
                                </Text>
                            ) : (
                                <>
                                    <Text
                                        style={
                                            styles.primaryButtonText
                                        }
                                    >
                                        Ingresar
                                    </Text>

                                    <Ionicons
                                        name="arrow-forward"
                                        size={20}
                                        color="#FFFFFF"
                                    />
                                </>
                            )}
                        </TouchableOpacity>

                    </View>

                    {/* SEPARADOR */}

                    <View style={styles.separatorContainer}>
                        <View style={styles.separatorLine} />

                        <Text style={styles.separatorText}>
                            ¿Aún no tienes una cuenta?
                        </Text>

                        <View style={styles.separatorLine} />
                    </View>

                    {/* REGISTRO */}

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() =>
                            navigation.navigate('registro')
                        }
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="person-add-outline"
                            size={20}
                            color="#FFFFFF"
                        />

                        <Text
                            style={
                                styles.secondaryButtonText
                            }
                        >
                            Crear una cuenta
                        </Text>
                    </TouchableOpacity>

                    {/* TEXTO INFERIOR */}

                    <Text style={styles.footerText}>
                        Tus finanzas, organizadas juntos.
                    </Text>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({

    // ============================================================
    // CONTENEDOR
    // ============================================================

    keyboardContainer: {
        flex: 1,
        backgroundColor: '#0B1120',
    },

    scrollContent: {
        flexGrow: 1,
    },

    container: {
        flex: 1,
        backgroundColor: '#0B1120',
        paddingHorizontal: 25,
        paddingTop: 35,
        paddingBottom: 35,
        justifyContent: 'center',
        overflow: 'hidden',
    },

    // ============================================================
    // DECORACIÓN
    // ============================================================

    glowTop: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: '#0C4A6E',
        opacity: 0.16,
        top: -130,
        right: -90,
    },

    // ============================================================
    // LOGO
    // ============================================================

    logoContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },

    logoBackground: {
        width: 145,
        height: 145,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111C31',
        borderWidth: 1,
        borderColor: '#1E3A5F',
        shadowColor: '#38BDF8',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.18,
        shadowRadius: 15,
        elevation: 8,
    },

    logo: {
        width: 125,
        height: 125,
    },

    // ============================================================
    // TÍTULO
    // ============================================================

    titleContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },

    titulo: {
        fontSize: 30,
        fontWeight: '800',
        color: '#F8FAFC',
        letterSpacing: 0.3,
    },

    subtitulo: {
        marginTop: 6,
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
    },

    // ============================================================
    // CARD FORMULARIO
    // ============================================================

    formCard: {
        backgroundColor: '#111C31',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E293B',
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 8,
    },

    // ============================================================
    // INPUTS
    // ============================================================

    inputLabel: {
        color: '#CBD5E1',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 7,
        marginLeft: 3,
    },

    inputContainer: {
        height: 54,
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#263449',
        borderRadius: 13,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 17,
    },

    inputIcon: {
        marginLeft: 15,
        marginRight: 10,
    },

    input: {
        flex: 1,
        height: '100%',
        color: '#F8FAFC',
        fontSize: 14,
        paddingVertical: 0,
    },

    eyeButton: {
        paddingHorizontal: 14,
        height: '100%',
        justifyContent: 'center',
    },

    // ============================================================
    // BOTÓN PRINCIPAL
    // ============================================================

    primaryButton: {
        height: 54,
        marginTop: 5,
        borderRadius: 13,
        backgroundColor: '#2563EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,

        shadowColor: '#2563EB',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },

    // ============================================================
    // SEPARADOR
    // ============================================================

    separatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },

    separatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#1E293B',
    },

    separatorText: {
        color: '#64748B',
        fontSize: 11,
        marginHorizontal: 10,
    },

    // ============================================================
    // BOTÓN REGISTRO
    // ============================================================

    secondaryButton: {
        height: 52,
        borderRadius: 13,
        backgroundColor: '#EA580C',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,

        shadowColor: '#EA580C',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },

    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },

    // ============================================================
    // FOOTER
    // ============================================================

    footerText: {
        color: '#475569',
        textAlign: 'center',
        fontSize: 11,
        marginTop: 22,
    },
});