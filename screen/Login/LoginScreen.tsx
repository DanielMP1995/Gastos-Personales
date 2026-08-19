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
                    : 'height'
            }
            keyboardVerticalOffset={0}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                    Platform.OS === 'ios'
                        ? 'interactive'
                        : 'on-drag'
                }
                showsVerticalScrollIndicator={false}
                automaticallyAdjustKeyboardInsets={
                    Platform.OS === 'ios'
                }
                contentInsetAdjustmentBehavior="automatic"
            >

                {/* ================================================= */}
                {/* ENCABEZADO */}
                {/* ================================================= */}

                <View style={styles.headerBlock}>

                    <View style={styles.logoContainer}>

                        <Image
                            source={require('../../assets/img/logov3.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />

                    </View>

                    <Text style={styles.titulo}>
                        Bienvenido
                    </Text>

                    <Text style={styles.subtitulo}>
                        Administra tus finanzas en pareja
                    </Text>

                </View>

                {/* ================================================= */}
                {/* CONTENIDO */}
                {/* ================================================= */}

                <View style={styles.container}>

                    {/* ================================================= */}
                    {/* FORMULARIO */}
                    {/* ================================================= */}

                    <View style={styles.formCard}>

                        {/* CORREO */}

                        <Text style={styles.inputLabel}>
                            Correo electrónico
                        </Text>

                        <View style={styles.inputContainer}>

                            <View style={styles.inputIconBox}>
                                <Ionicons
                                    name="mail-outline"
                                    size={18}
                                    color={COLOR_PRINCIPAL}
                                />
                            </View>

                            <TextInput
                                placeholder="Ingresa tu correo"
                                placeholderTextColor="#9CA3AF"
                                value={correo}
                                onChangeText={setCorreo}
                                style={styles.input}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                autoCorrect={false}
                                returnKeyType="next"
                                blurOnSubmit={false}
                            />

                        </View>

                        {/* CONTRASEÑA */}

                        <Text style={styles.inputLabel}>
                            Contraseña
                        </Text>

                        <View style={styles.inputContainer}>

                            <View style={styles.inputIconBox}>
                                <Ionicons
                                    name="lock-closed-outline"
                                    size={18}
                                    color={COLOR_PRINCIPAL}
                                />
                            </View>

                            <TextInput
                                placeholder="Ingresa tu contraseña"
                                placeholderTextColor="#9CA3AF"
                                secureTextEntry={
                                    !mostrarContrasena
                                }
                                value={contrasena}
                                onChangeText={setContrasena}
                                style={styles.input}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={ingresar}
                            />

                            <TouchableOpacity
                                onPress={() =>
                                    setMostrarContrasena(
                                        !mostrarContrasena
                                    )
                                }
                                style={styles.eyeButton}
                                activeOpacity={0.7}
                            >

                                <Ionicons
                                    name={
                                        mostrarContrasena
                                            ? 'eye-off-outline'
                                            : 'eye-outline'
                                    }
                                    size={20}
                                    color="#8A908E"
                                />

                            </TouchableOpacity>

                        </View>

                        {/* ================================================= */}
                        {/* BOTÓN INGRESAR */}
                        {/* ================================================= */}

                        <TouchableOpacity
                            style={[
                                styles.primaryButton,
                                cargando &&
                                    styles.buttonDisabled,
                            ]}
                            onPress={ingresar}
                            disabled={cargando}
                            activeOpacity={0.85}
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
                                        size={19}
                                        color="#FFFFFF"
                                    />
                                </>

                            )}

                        </TouchableOpacity>

                    </View>

                    {/* ================================================= */}
                    {/* SEPARADOR */}
                    {/* ================================================= */}

                    <View style={styles.separatorContainer}>

                        <View
                            style={styles.separatorLine}
                        />

                        <Text
                            style={styles.separatorText}
                        >
                            ¿Aún no tienes una cuenta?
                        </Text>

                        <View
                            style={styles.separatorLine}
                        />

                    </View>

                    {/* ================================================= */}
                    {/* CREAR CUENTA */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() =>
                            navigation.navigate('registro')
                        }
                        activeOpacity={0.85}
                    >

                        <Ionicons
                            name="person-add-outline"
                            size={19}
                            color={COLOR_PRINCIPAL}
                        />

                        <Text
                            style={
                                styles.secondaryButtonText
                            }
                        >
                            Crear una cuenta
                        </Text>

                    </TouchableOpacity>

                    {/* ================================================= */}
                    {/* FOOTER */}
                    {/* ================================================= */}

                    <View style={styles.footerContainer}>

                        <Ionicons
                            name="heart-outline"
                            size={14}
                            color={COLOR_PRINCIPAL}
                        />

                        <Text style={styles.footerText}>
                            Tus finanzas, organizadas juntos.
                        </Text>

                    </View>

                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// ============================================================
// PALETA
// ============================================================

const COLOR_PRINCIPAL = '#176B63';
const COLOR_OSCURO = '#124C47';
const COLOR_SUAVE = '#DCEAE7';
const COLOR_MUY_SUAVE = '#F3F7F6';

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

    // ============================================================
    // CONTENEDOR GENERAL
    // ============================================================

    keyboardContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    scrollContent: {
        flexGrow: 1,
        paddingBottom: 160,
    },

    container: {
        paddingHorizontal: 25,
        paddingTop: 28,
        paddingBottom: 60,
    },

    // ============================================================
    // ENCABEZADO
    // ============================================================

    headerBlock: {
        backgroundColor: COLOR_PRINCIPAL,

        paddingTop:
            Platform.OS === 'ios'
                ? 70
                : 55,

        paddingBottom: 36,

        paddingHorizontal: 25,

        alignItems: 'center',

        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },

    logoContainer: {
        width: 160,
        height: 155,

        borderRadius: 20,

        backgroundColor:
            'rgba(255,255,255,0.14)',

        alignItems: 'center',
        justifyContent: 'center',

        marginBottom: 16,
    },

    logo: {
        width: 135,
        height: 115,
    },

    titulo: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    subtitulo: {
        marginTop: 6,
        color: '#CDE6E1',
        fontSize: 13,
        textAlign: 'center',
    },

    // ============================================================
    // FORMULARIO
    // ============================================================

    formCard: {
        backgroundColor: '#FFFFFF',

        borderRadius: 18,

        padding: 20,

        marginTop: -24,

        borderWidth: 1,
        borderColor: '#EAEEED',
    },

    // ============================================================
    // LABELS
    // ============================================================

    inputLabel: {
        color: '#222725',

        fontSize: 12,

        fontWeight: '700',

        marginBottom: 8,

        marginLeft: 2,
    },

    // ============================================================
    // INPUT
    // ============================================================

    inputContainer: {
        height: 54,

        backgroundColor: COLOR_MUY_SUAVE,

        borderWidth: 1,

        borderColor: '#E4E7E6',

        borderRadius: 12,

        flexDirection: 'row',

        alignItems: 'center',

        marginBottom: 16,

        paddingRight: 6,
    },

    inputIconBox: {
        width: 38,
        height: 38,

        borderRadius: 10,

        backgroundColor: COLOR_SUAVE,

        alignItems: 'center',
        justifyContent: 'center',

        marginLeft: 8,
        marginRight: 10,
    },

    input: {
        flex: 1,

        color: '#171A19',

        fontSize: 14,

        paddingVertical:
            Platform.OS === 'android'
                ? 8
                : 0,

        includeFontPadding: false,

        textAlignVertical: 'center',

        minWidth: 0,
    },

    eyeButton: {
        paddingHorizontal: 10,

        height: '100%',

        justifyContent: 'center',
        alignItems: 'center',
    },

    // ============================================================
    // BOTÓN INGRESAR
    // ============================================================

    primaryButton: {
        height: 54,

        marginTop: 6,

        borderRadius: 12,

        backgroundColor: COLOR_PRINCIPAL,

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 9,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    primaryButtonText: {
        color: '#FFFFFF',

        fontSize: 15,

        fontWeight: '700',
    },

    // ============================================================
    // SEPARADOR
    // ============================================================

    separatorContainer: {
        flexDirection: 'row',

        alignItems: 'center',

        marginVertical: 22,
    },

    separatorLine: {
        flex: 1,

        height: 1,

        backgroundColor: '#E4E7E6',
    },

    separatorText: {
        color: '#8A908E',

        fontSize: 11,

        marginHorizontal: 10,

        textAlign: 'center',
    },

    // ============================================================
    // CREAR CUENTA
    // ============================================================

    secondaryButton: {
        height: 52,

        borderRadius: 12,

        backgroundColor: COLOR_MUY_SUAVE,

        borderWidth: 1,

        borderColor: '#E4E7E6',

        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        gap: 9,
    },

    secondaryButtonText: {
        color: COLOR_OSCURO,

        fontSize: 14,

        fontWeight: '700',
    },

    // ============================================================
    // FOOTER
    // ============================================================

    footerContainer: {
        flexDirection: 'row',

        alignItems: 'center',

        justifyContent: 'center',

        marginTop: 24,

        gap: 5,
    },

    footerText: {
        color: '#8A908E',

        textAlign: 'center',

        fontSize: 11,
    },
});