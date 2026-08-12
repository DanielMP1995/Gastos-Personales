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
    Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, set } from 'firebase/database';

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

                /*
                Si tiene código de pareja:
                utiliza el código ingresado.

                Si no tiene:
                genera uno automáticamente
                utilizando parte del UID.
                */

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
                        correo: correo
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
        <View style={styles.rootContainer}>
            {/* DECORACIÓN DE FONDO */}

            <View
                pointerEvents="none"
                style={styles.backgroundDecoration}
            >
                <View
                    style={
                        styles.glowBlue
                    }
                />

                <View
                    style={
                        styles.glowOrange
                    }
                />

                <View
                    style={
                        styles.glowPurple
                    }
                />
            </View>

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
                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

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
                            styles.welcomeSmall
                        }
                    >
                        Finanzas en Pareja
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
                        Comienza a organizar tus
                        finanzas de forma sencilla
                    </Text>
                </View>

                {/* ================================================= */}
                {/* FORMULARIO */}
                {/* ================================================= */}

                <View style={styles.formCard}>
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
                            <Text
                                style={
                                    styles.sectionIconText
                                }
                            >
                                👤
                            </Text>
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
                                Completa tus datos
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
                        <Text
                            style={
                                styles.inputIcon
                            }
                        >
                            👤
                        </Text>

                        <TextInput
                            placeholder="Ej. Daniel"
                            placeholderTextColor="#64748B"
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
                        <Text
                            style={
                                styles.inputIcon
                            }
                        >
                            🪪
                        </Text>

                        <TextInput
                            placeholder="Ej. Mera"
                            placeholderTextColor="#64748B"
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
                                marginBottom: 10,
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
                            activeOpacity={
                                0.8
                            }
                            style={[
                                styles.genBtn,
                                genero ===
                                    'Masculino' &&
                                    styles.genBtnActiveBlue,
                            ]}
                            onPress={() =>
                                setGenero(
                                    'Masculino'
                                )
                            }
                        >
                            <Text
                                style={
                                    styles.genEmoji
                                }
                            >
                                👨
                            </Text>

                            <Text
                                style={
                                    styles.genText
                                }
                            >
                                Masculino
                            </Text>

                            {genero ===
                                'Masculino' && (
                                <View
                                    style={
                                        styles.checkCircle
                                    }
                                >
                                    <Text
                                        style={
                                            styles.checkText
                                        }
                                    >
                                        ✓
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={
                                0.8
                            }
                            style={[
                                styles.genBtn,
                                genero ===
                                    'Femenino' &&
                                    styles.genBtnActiveOrange,
                            ]}
                            onPress={() =>
                                setGenero(
                                    'Femenino'
                                )
                            }
                        >
                            <Text
                                style={
                                    styles.genEmoji
                                }
                            >
                                👩
                            </Text>

                            <Text
                                style={
                                    styles.genText
                                }
                            >
                                Femenino
                            </Text>

                            {genero ===
                                'Femenino' && (
                                <View
                                    style={
                                        styles.checkCircleOrange
                                    }
                                >
                                    <Text
                                        style={
                                            styles.checkText
                                        }
                                    >
                                        ✓
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* ================================================= */}
                    {/* ACCESO */}
                    {/* ================================================= */}

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
                                styles.sectionIconBlue
                            }
                        >
                            <Text
                                style={
                                    styles.sectionIconText
                                }
                            >
                                🔐
                            </Text>
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
                                Protege tu cuenta
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
                        <Text
                            style={
                                styles.inputIcon
                            }
                        >
                            ✉️
                        </Text>

                        <TextInput
                            placeholder="correo@ejemplo.com"
                            placeholderTextColor="#64748B"
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
                        <Text
                            style={
                                styles.inputIcon
                            }
                        >
                            🔒
                        </Text>

                        <TextInput
                            placeholder="Crea una contraseña segura"
                            placeholderTextColor="#64748B"
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

                    <Text
                        style={
                            styles.passwordHint
                        }
                    >
                        💡 Usa una contraseña
                        segura para proteger tu
                        información.
                    </Text>

                    {/* ================================================= */}
                    {/* CÓDIGO DE PAREJA */}
                    {/* ================================================= */}

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
                                <Text
                                    style={
                                        styles.partnerIconText
                                    }
                                >
                                    💑
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.partnerInfo
                                }
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
                                    ¿Tu pareja ya tiene
                                    una cuenta?
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
                                    false: '#334155',
                                    true: '#2563EB',
                                }}
                                thumbColor={
                                    tieneCodigoPareja
                                        ? '#FFFFFF'
                                        : '#94A3B8'
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
                                    Ingresa el código
                                    de tu pareja
                                </Text>

                                <View
                                    style={
                                        styles.inputWrapper
                                    }
                                >
                                    <Text
                                        style={
                                            styles.inputIcon
                                        }
                                    >
                                        🔗
                                    </Text>

                                    <TextInput
                                        placeholder="Ej. A1B2C3"
                                        placeholderTextColor="#64748B"
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

                                <View
                                    style={
                                        styles.codeInfo
                                    }
                                >
                                    <Text
                                        style={
                                            styles.codeInfoIcon
                                        }
                                    >
                                        ℹ️
                                    </Text>

                                    <Text
                                        style={
                                            styles.codeInfoText
                                        }
                                    >
                                        Este código
                                        permite
                                        compartir
                                        tus finanzas
                                        con tu pareja.
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ================================================= */}
                    {/* BOTÓN REGISTRARSE */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        activeOpacity={0.85}
                        style={
                            styles.primaryButton
                        }
                        onPress={
                            registrarse
                        }
                    >
                        <Text
                            style={
                                styles.primaryButtonIcon
                            }
                        >
                            ✨
                        </Text>

                        <Text
                            style={
                                styles.primaryButtonText
                            }
                        >
                            Crear mi cuenta
                        </Text>
                    </TouchableOpacity>

                    {/* ================================================= */}
                    {/* LOGIN */}
                    {/* ================================================= */}

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
                            ¿Ya tienes una cuenta?
                        </Text>

                        <Text
                            style={
                                styles.loginText
                            }
                        >
                            Iniciar sesión
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* FOOTER */}

                <Text
                    style={
                        styles.footerText
                    }
                >
                    Tus finanzas, organizadas en
                    un solo lugar.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // ============================================================
    // CONTENEDOR
    // ============================================================

    rootContainer: {
        flex: 1,
        backgroundColor: '#07111F',
    },

    scrollView: {
        flex: 1,
    },

    container: {
        flexGrow: 1,
        paddingHorizontal: 22,
        paddingTop: 35,
        paddingBottom: 50,
    },

    // ============================================================
    // FONDO DECORATIVO
    // ============================================================

    backgroundDecoration: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },

    glowBlue: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: '#0C4A6E',
        opacity: 0.18,
        top: -100,
        right: -80,
    },

    glowOrange: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: '#9A3412',
        opacity: 0.12,
        top: 350,
        left: -120,
    },

    glowPurple: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: '#6D28D9',
        opacity: 0.08,
        bottom: 50,
        right: -70,
    },

    // ============================================================
    // HEADER
    // ============================================================

    header: {
        alignItems: 'center',
        marginBottom: 22,
    },

    logoWrapper: {
        width: 92,
        height: 92,
        borderRadius: 28,
        backgroundColor: '#111D30',
        borderWidth: 1,
        borderColor: '#243B53',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,

        shadowColor: '#38BDF8',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 6,
    },

    logo: {
        width: 72,
        height: 72,
    },

    welcomeSmall: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 5,
    },

    titulo: {
        color: '#F8FAFC',
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 6,
    },

    subtitulo: {
        color: '#94A3B8',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 19,
        maxWidth: 310,
    },

    // ============================================================
    // FORM CARD
    // ============================================================

    formCard: {
        backgroundColor: '#111D30',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#243B53',

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
    // SECTION
    // ============================================================

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    sectionIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#172554',
        borderWidth: 1,
        borderColor: '#1D4ED8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    sectionIconBlue: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#082F49',
        borderWidth: 1,
        borderColor: '#0284C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 11,
    },

    sectionIconText: {
        fontSize: 20,
    },

    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '700',
    },

    sectionSubtitle: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },

    // ============================================================
    // LABELS
    // ============================================================

    label: {
        color: '#CBD5E1',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
    },

    // ============================================================
    // INPUTS
    // ============================================================

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B1627',
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#263A52',
        minHeight: 51,
    },

    inputIcon: {
        width: 40,
        textAlign: 'center',
        fontSize: 16,
    },

    input: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 14,
        paddingVertical: 13,
        paddingRight: 12,
        minHeight: 49,
    },

    passwordHint: {
        color: '#64748B',
        fontSize: 10,
        marginTop: 5,
        marginLeft: 3,
    },

    // ============================================================
    // DIVISOR
    // ============================================================

    divider: {
        height: 1,
        backgroundColor: '#243B53',
        marginVertical: 20,
    },

    // ============================================================
    // GÉNERO
    // ============================================================

    generoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    genBtn: {
        width: '48%',
        minHeight: 80,
        borderRadius: 14,
        backgroundColor: '#0B1627',
        borderWidth: 1,
        borderColor: '#263A52',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },

    genBtnActiveBlue: {
        backgroundColor: '#082F49',
        borderColor: '#0EA5E9',
    },

    genBtnActiveOrange: {
        backgroundColor: '#431407',
        borderColor: '#F97316',
    },

    genEmoji: {
        fontSize: 25,
        marginBottom: 5,
    },

    genText: {
        color: '#F8FAFC',
        fontSize: 12,
        fontWeight: '700',
    },

    checkCircle: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0EA5E9',
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkCircleOrange: {
        position: 'absolute',
        top: 7,
        right: 7,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F97316',
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },

    // ============================================================
    // PAREJA
    // ============================================================

    partnerCard: {
        backgroundColor: '#0B1627',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#263A52',
        padding: 13,
    },

    partnerTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    partnerIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#431407',
        borderWidth: 1,
        borderColor: '#C2410C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    partnerIconText: {
        fontSize: 20,
    },

    partnerInfo: {
        flex: 1,
    },

    partnerTitle: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '700',
    },

    partnerDescription: {
        color: '#64748B',
        fontSize: 10,
        marginTop: 2,
    },

    codeContainer: {
        marginTop: 14,
        paddingTop: 13,
        borderTopWidth: 1,
        borderTopColor: '#263A52',
    },

    codeLabel: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6,
    },

    codeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 5,
    },

    codeInfoIcon: {
        fontSize: 12,
        marginRight: 5,
    },

    codeInfoText: {
        flex: 1,
        color: '#64748B',
        fontSize: 10,
        lineHeight: 15,
    },

    // ============================================================
    // BOTÓN PRINCIPAL
    // ============================================================

    primaryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        marginTop: 22,
        borderRadius: 12,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: '#3B82F6',

        shadowColor: '#2563EB',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    primaryButtonIcon: {
        fontSize: 17,
        marginRight: 8,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    // ============================================================
    // BOTÓN LOGIN
    // ============================================================

    secondaryButton: {
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 10,
    },

    secondaryButtonText: {
        color: '#64748B',
        fontSize: 11,
        marginBottom: 3,
    },

    loginText: {
        color: '#38BDF8',
        fontSize: 13,
        fontWeight: '800',
    },

    // ============================================================
    // FOOTER
    // ============================================================

    footerText: {
        color: '#475569',
        textAlign: 'center',
        fontSize: 10,
        marginTop: 20,
    },
});