import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Alert,
    Image,
    TouchableOpacity,
    ScrollView,
    Switch,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { createUserWithEmailAndPassword } from 'firebase/auth';

import { auth, db } from '../../firebase/FirebaseConfig';

import { ref, set } from 'firebase/database';

import { Ionicons } from '@expo/vector-icons';

export default function RegistroScreen({ navigation }: any) {

    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [genero, setGenero] = useState('');
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');

    // ============================================================
    // CÓDIGO DE PAREJA
    // ============================================================

    const [tieneCodigoPareja, setTieneCodigoPareja] =
        useState(false);

    const [codigoIngresado, setCodigoIngresado] =
        useState('');

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    // ============================================================
    // REGISTRARSE
    // ============================================================

    function registrarse() {

        if (
            !nombre ||
            !apellido ||
            !genero ||
            !correo ||
            !contrasena
        ) {
            Alert.alert(
                'Campos incompletos',
                'Por favor completa todos los campos y selecciona tu género.'
            );
            return;
        }

        if (
            tieneCodigoPareja &&
            !codigoIngresado.trim()
        ) {
            Alert.alert(
                'Código requerido',
                'Has indicado que tienes un código de pareja. Por favor ingrésalo o desactiva la opción.'
            );
            return;
        }

        createUserWithEmailAndPassword(
            auth,
            correo.trim(),
            contrasena
        )
            .then((userCredential) => {

                const user = userCredential.user;

                const idParejaFinal =
                    tieneCodigoPareja
                        ? codigoIngresado
                            .trim()
                            .toUpperCase()
                        : user.uid
                            .substring(0, 6)
                            .toUpperCase();

                return set(
                    ref(
                        db,
                        `usuarios/${user.uid}`
                    ),
                    {
                        nombre: nombre.trim(),

                        apellido:
                            apellido.trim(),

                        genero: genero,

                        correo:
                            correo
                                .trim()
                                .toLowerCase(),

                        idPareja:
                            idParejaFinal,

                        fechaRegistro:
                            new Date().toISOString(),
                    }
                );
            })

            .then(() => {

                Alert.alert(
                    '¡Cuenta creada!',
                    'Tu cuenta fue creada correctamente. Ahora puedes iniciar sesión.',
                    [
                        {
                            text: 'Continuar',
                            onPress: () =>
                                navigation.navigate(
                                    'login'
                                ),
                        },
                    ]
                );
            })

            .catch((error) => {

                let mensaje =
                    error.message;

                if (
                    error.code ===
                    'auth/email-already-in-use'
                ) {
                    mensaje =
                        'Este correo electrónico ya está registrado.';
                }

                if (
                    error.code ===
                    'auth/invalid-email'
                ) {
                    mensaje =
                        'El correo electrónico no es válido.';
                }

                if (
                    error.code ===
                    'auth/weak-password'
                ) {
                    mensaje =
                        'La contraseña es demasiado débil. Usa una contraseña más segura.';
                }

                Alert.alert(
                    'No se pudo crear la cuenta',
                    mensaje
                );
            });
    }

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={
                styles.container
            }
            showsVerticalScrollIndicator={
                false
            }
            keyboardShouldPersistTaps="handled"
        >

            {/* HEADER */}

            <View style={styles.header}>

                <View
                    style={
                        styles.logoWrapper
                    }
                >

                    <Image
                        source={require('../../assets/img/logov2.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                </View>

                <Text
                    style={
                        styles.headerSmall
                    }
                >
                    FINANZAS EN PAREJA
                </Text>

                <Text
                    style={
                        styles.titulo
                    }
                >
                    Crear una cuenta
                </Text>

                <Text
                    style={
                        styles.subtitulo
                    }
                >
                    Comienza a organizar tus finanzas de forma sencilla y en equipo
                </Text>

            </View>

            {/* FORMULARIO */}

            <View style={styles.formCard}>

                {/* INFORMACIÓN PERSONAL */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={
                            styles.sectionIcon
                        }
                    >

                        <Ionicons
                            name="person-outline"
                            size={18}
                            color={
                                COLOR_PRINCIPAL
                            }
                        />

                    </View>

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Información personal
                        </Text>

                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Completa tus datos básicos
                        </Text>

                    </View>

                </View>

                {/* NOMBRE */}

                <Text
                    style={styles.label}
                >
                    Nombre
                </Text>

                <View
                    style={
                        styles.inputWrapper
                    }
                >

                    <Ionicons
                        name="person-outline"
                        size={18}
                        color={
                            COLOR_TEXTO_SUAVE
                        }
                        style={
                            styles.inputIconStyle
                        }
                    />

                    <TextInput
                        placeholder="Ej. Daniel"
                        placeholderTextColor="#9AA1A0"
                        value={nombre}
                        onChangeText={
                            setNombre
                        }
                        style={
                            styles.input
                        }
                    />

                </View>

                {/* APELLIDO */}

                <Text
                    style={styles.label}
                >
                    Apellido
                </Text>

                <View
                    style={
                        styles.inputWrapper
                    }
                >

                    <Ionicons
                        name="id-card-outline"
                        size={18}
                        color={
                            COLOR_TEXTO_SUAVE
                        }
                        style={
                            styles.inputIconStyle
                        }
                    />

                    <TextInput
                        placeholder="Ej. Mera"
                        placeholderTextColor="#9AA1A0"
                        value={
                            apellido
                        }
                        onChangeText={
                            setApellido
                        }
                        style={
                            styles.input
                        }
                    />

                </View>

                {/* GÉNERO */}

                <Text
                    style={[
                        styles.label,
                        {
                            marginBottom: 8,
                        },
                    ]}
                >
                    Selecciona tu género
                </Text>

                <View
                    style={
                        styles.generoContainer
                    }
                >

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.genBtn,
                            genero ===
                                'Masculino' &&
                                styles.genBtnActive,
                        ]}
                        onPress={() =>
                            setGenero(
                                'Masculino'
                            )
                        }
                    >

                        <Ionicons
                            name="male"
                            size={18}
                            color={
                                genero ===
                                'Masculino'
                                    ? '#FFFFFF'
                                    : COLOR_PRINCIPAL
                            }
                        />

                        <Text
                            style={[
                                styles.genText,
                                genero ===
                                    'Masculino' &&
                                    styles.genTextActive,
                            ]}
                        >
                            Masculino
                        </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                            styles.genBtn,
                            genero ===
                                'Femenino' &&
                                styles.genBtnActive,
                        ]}
                        onPress={() =>
                            setGenero(
                                'Femenino'
                            )
                        }
                    >

                        <Ionicons
                            name="female"
                            size={18}
                            color={
                                genero ===
                                'Femenino'
                                    ? '#FFFFFF'
                                    : COLOR_PRINCIPAL
                            }
                        />

                        <Text
                            style={[
                                styles.genText,
                                genero ===
                                    'Femenino' &&
                                    styles.genTextActive,
                            ]}
                        >
                            Femenino
                        </Text>

                    </TouchableOpacity>

                </View>

                {/* ACCESO */}

                <View
                    style={
                        styles.divider
                    }
                />

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={
                            styles.sectionIcon
                        }
                    >

                        <Ionicons
                            name="lock-closed-outline"
                            size={18}
                            color={
                                COLOR_PRINCIPAL
                            }
                        />

                    </View>

                    <View>

                        <Text
                            style={
                                styles.sectionTitle
                            }
                        >
                            Datos de acceso
                        </Text>

                        <Text
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Protege tu cuenta con credenciales seguras
                        </Text>

                    </View>

                </View>

                {/* CORREO */}

                <Text
                    style={styles.label}
                >
                    Correo electrónico
                </Text>

                <View
                    style={
                        styles.inputWrapper
                    }
                >

                    <Ionicons
                        name="mail-outline"
                        size={18}
                        color={
                            COLOR_TEXTO_SUAVE
                        }
                        style={
                            styles.inputIconStyle
                        }
                    />

                    <TextInput
                        placeholder="correo@ejemplo.com"
                        placeholderTextColor="#9AA1A0"
                        value={correo}
                        onChangeText={
                            setCorreo
                        }
                        style={
                            styles.input
                        }
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                </View>

                {/* CONTRASEÑA */}

                <Text
                    style={styles.label}
                >
                    Contraseña
                </Text>

                <View
                    style={
                        styles.inputWrapper
                    }
                >

                    <Ionicons
                        name="key-outline"
                        size={18}
                        color={
                            COLOR_TEXTO_SUAVE
                        }
                        style={
                            styles.inputIconStyle
                        }
                    />

                    <TextInput
                        placeholder="Crea una contraseña segura"
                        placeholderTextColor="#9AA1A0"
                        value={
                            contrasena
                        }
                        secureTextEntry
                        onChangeText={
                            setContrasena
                        }
                        style={
                            styles.input
                        }
                    />

                </View>

                {/* CÓDIGO DE PAREJA */}

                <View
                    style={
                        styles.divider
                    }
                />

                <View
                    style={
                        styles.partnerCard
                    }
                >

                    <View
                        style={
                            styles.partnerTop
                        }
                    >

                        <View
                            style={
                                styles.partnerIcon
                            }
                        >

                            <Ionicons
                                name="heart-outline"
                                size={18}
                                color={
                                    COLOR_PRINCIPAL
                                }
                            />

                        </View>

                        <View
                            style={{
                                flex: 1,
                            }}
                        >

                            <Text
                                style={
                                    styles.partnerTitle
                                }
                            >
                                Código de pareja
                            </Text>

                            <Text
                                style={
                                    styles.partnerDescription
                                }
                            >
                                ¿Tu pareja ya tiene una cuenta?
                            </Text>

                        </View>

                        <Switch
                            value={
                                tieneCodigoPareja
                            }
                            onValueChange={
                                setTieneCodigoPareja
                            }
                            trackColor={{
                                false:
                                    COLOR_BORDE,
                                true:
                                    COLOR_SUAVE,
                            }}
                            thumbColor={
                                tieneCodigoPareja
                                    ? COLOR_PRINCIPAL
                                    : '#9AA1A0'
                            }
                        />

                    </View>

                    {tieneCodigoPareja && (

                        <View
                            style={
                                styles.codeContainer
                            }
                        >

                            <Text
                                style={
                                    styles.codeLabel
                                }
                            >
                                INGRESA EL CÓDIGO DE TU PAREJA
                            </Text>

                            <View
                                style={
                                    styles.inputWrapper
                                }
                            >

                                <Ionicons
                                    name="link-outline"
                                    size={18}
                                    color={
                                        COLOR_TEXTO_SUAVE
                                    }
                                    style={
                                        styles.inputIconStyle
                                    }
                                />

                                <TextInput
                                    placeholder="Ej. ABC123"
                                    placeholderTextColor="#9AA1A0"
                                    value={
                                        codigoIngresado
                                    }
                                    onChangeText={
                                        setCodigoIngresado
                                    }
                                    style={
                                        styles.input
                                    }
                                    autoCapitalize="characters"
                                />

                            </View>

                        </View>

                    )}

                </View>

                {/* BOTÓN REGISTRARSE */}

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={
                        styles.primaryButton
                    }
                    onPress={
                        registrarse
                    }
                >

                    <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color="#FFFFFF"
                    />

                    <Text
                        style={
                            styles.primaryButtonText
                        }
                    >
                        Crear mi cuenta
                    </Text>

                </TouchableOpacity>

                {/* LOGIN */}

                <TouchableOpacity
                    activeOpacity={0.8}
                    style={
                        styles.secondaryButton
                    }
                    onPress={() =>
                        navigation.navigate(
                            'login'
                        )
                    }
                >

                    <Text
                        style={
                            styles.secondaryButtonText
                        }
                    >
                        ¿Ya tienes una cuenta?{' '}

                        <Text
                            style={
                                styles.loginText
                            }
                        >
                            Iniciar sesión
                        </Text>

                    </Text>

                </TouchableOpacity>

            </View>

            {/* FOOTER */}

            <Text
                style={
                    styles.footerText
                }
            >
                Finanzas en Pareja
            </Text>

        </ScrollView>
    );
}

/* ============================================================
   PALETA DE COLORES
============================================================ */

const COLOR_PRINCIPAL = '#176B63';
const COLOR_OSCURO = '#124C47';
const COLOR_VERDE = '#2E7D6E';
const COLOR_SUAVE = '#DCEAE7';
const COLOR_MUY_SUAVE = '#F3F7F6';

const COLOR_BORDE = '#E4E7E6';
const COLOR_TEXTO_SUAVE = '#7A817F';

/* ============================================================
   ESTILOS
============================================================ */

const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 45,
        paddingBottom: 45,
    },

    // ============================================================
    // HEADER
    // ============================================================

    header: {
        alignItems: 'center',
        marginBottom: 24,
    },

    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor:
            COLOR_MUY_SUAVE,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    logo: {
        width: 50,
        height: 50,
    },

    headerSmall: {
        color: COLOR_PRINCIPAL,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.3,
        marginBottom: 4,
    },

    titulo: {
        color: '#171A19',
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 6,
    },

    subtitulo: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
    },

    // ============================================================
    // FORM CARD
    // ============================================================

    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
    },

    // ============================================================
    // SECCIÓN
    // ============================================================

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },

    sectionIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor:
            COLOR_MUY_SUAVE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    sectionTitle: {
        color: '#171A19',
        fontSize: 15,
        fontWeight: '700',
    },

    sectionSubtitle: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 11,
        marginTop: 1,
    },

    // ============================================================
    // LABELS & INPUTS
    // ============================================================

    label: {
        color: '#171A19',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
        marginTop: 10,
    },

    inputWrapper: {
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
    },

    inputIconStyle: {
        position: 'absolute',
        left: 14,
        zIndex: 1,
    },

    input: {
        flex: 1,
        backgroundColor:
            COLOR_MUY_SUAVE,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        borderRadius: 12,
        paddingVertical: 12,
        paddingLeft: 44,
        paddingRight: 14,
        color: '#171A19',
        fontSize: 14,
    },

    // ============================================================
    // GÉNERO
    // ============================================================

    generoContainer: {
        flexDirection: 'row',
    },

    genBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor:
            COLOR_MUY_SUAVE,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        marginHorizontal: 5,
    },

    genBtnActive: {
        backgroundColor:
            COLOR_PRINCIPAL,
        borderColor:
            COLOR_PRINCIPAL,
    },

    genText: {
        color: '#171A19',
        fontSize: 13,
        fontWeight: '700',
        marginLeft: 8,
    },

    genTextActive: {
        color: '#FFFFFF',
    },

    divider: {
        height: 1,
        backgroundColor:
            COLOR_BORDE,
        marginVertical: 18,
    },

    // ============================================================
    // PAREJA
    // ============================================================

    partnerCard: {
        marginBottom: 15,
    },

    partnerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    partnerIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor:
            COLOR_MUY_SUAVE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    partnerTitle: {
        color: '#171A19',
        fontSize: 13,
        fontWeight: '700',
    },

    partnerDescription: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 11,
        marginTop: 1,
    },

    codeContainer: {
        marginTop: 12,
    },

    codeLabel: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
    },

    // ============================================================
    // BOTONES
    // ============================================================

    primaryButton: {
        backgroundColor:
            COLOR_PRINCIPAL,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 15,
        marginBottom: 12,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 8,
    },

    secondaryButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },

    secondaryButtonText: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 13,
    },

    loginText: {
        color: COLOR_PRINCIPAL,
        fontWeight: '700',
    },

    footerText: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 11,
        textAlign: 'center',
        marginTop: 25,
        fontWeight: '600',
    },

});