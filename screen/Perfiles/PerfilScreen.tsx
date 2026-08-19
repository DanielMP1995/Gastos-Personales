import React, { useState, useEffect } from 'react';

import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    Clipboard,
    Image,
    Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    onValue,
    update,
} from 'firebase/database';

import { useTheme } from '../../context/ThemeContext';


// =====================================================
// AVATARES DISPONIBLES
// =====================================================

const AVATARS = [
    require('../../assets/AVATARES/AVATAR1.png'),
    require('../../assets/AVATARES/AVATAR2.png'),
    require('../../assets/AVATARES/AVATAR3.png'),
    require('../../assets/AVATARES/AVATAR4.png'),
    require('../../assets/AVATARES/AVATAR5.png'),
    require('../../assets/AVATARES/avatar1Dani.png'),
    require('../../assets/AVATARES/avatar2Dani.png'),
];


// =====================================================
// PANTALLA PERFIL
// =====================================================

export default function PerfilScreen({ navigation }: any) {

    // =====================================================
    // TEMA
    // =====================================================

    const { colors } = useTheme();

    const usuarioActual = auth.currentUser;


    // =====================================================
    // DATOS
    // =====================================================

    const [data, setData] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        genero: '',
        idPareja: '',
        fotoPerfil: '',
    });


    const [
        nombreParejaVinculada,
        setNombreParejaVinculada,
    ] = useState(
        'Buscando pareja vinculada...'
    );


    const [codigoNuevo, setCodigoNuevo] =
        useState('');

    const [modoVincular, setModoVincular] =
        useState(false);

    const [
        modalAvatarVisible,
        setModalAvatarVisible,
    ] = useState(false);


    // =====================================================
    // HEADER
    // =====================================================

    useEffect(() => {

        navigation.setOptions({
            headerShown: false,
        });

    }, [navigation]);


    // =====================================================
    // CARGAR DATOS DEL USUARIO
    // =====================================================

    useEffect(() => {

        if (!usuarioActual) return;


        const perfilRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );


        const unsubscribePerfil = onValue(
            perfilRef,
            (snapshot) => {

                const val = snapshot.val();


                if (val) {

                    setData({
                        nombre: val.nombre || '',
                        apellido: val.apellido || '',
                        correo: val.correo || '',
                        genero: val.genero || '',
                        idPareja: val.idPareja || '',
                        fotoPerfil: val.fotoPerfil || '',
                    });


                    // =================================================
                    // BUSCAR PAREJA
                    // =================================================

                    const usuariosRef = ref(
                        db,
                        'usuarios'
                    );


                    onValue(
                        usuariosRef,
                        (snapUsuarios) => {

                            const allUsers =
                                snapUsuarios.val();


                            if (allUsers) {

                                let encontrado = false;


                                Object.keys(
                                    allUsers
                                ).forEach(
                                    (uidKey) => {

                                        const usuarioItem =
                                            allUsers[uidKey];


                                        if (
                                            uidKey !==
                                            usuarioActual.uid &&
                                            usuarioItem.idPareja ===
                                            val.idPareja
                                        ) {

                                            setNombreParejaVinculada(
                                                `${usuarioItem.nombre} ${usuarioItem.apellido}`
                                            );

                                            encontrado =
                                                true;

                                        }

                                    }
                                );


                                if (!encontrado) {

                                    setNombreParejaVinculada(
                                        'Aún nadie se ha unido con este código'
                                    );

                                }

                            }

                        }
                    );

                }

            }
        );


        return () =>
            unsubscribePerfil();

    }, [usuarioActual]);


    // =====================================================
    // SELECCIONAR AVATAR
    // =====================================================

    function abrirSelectorAvatar() {

        setModalAvatarVisible(true);

    }


    function seleccionarAvatar(
        numero: number
    ) {

        if (!usuarioActual) return;


        const idAvatar =
            `AVATAR${numero}`;


        update(
            ref(
                db,
                `usuarios/${usuarioActual.uid}`
            ),
            {
                fotoPerfil: idAvatar,
            }
        )
            .then(() => {

                setData((prev) => ({
                    ...prev,
                    fotoPerfil: idAvatar,
                }));


                setModalAvatarVisible(
                    false
                );

            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    error.message
                );

            });

    }


    function getAvatarSource(
        idAvatar: string
    ) {

        const index =
            parseInt(
                idAvatar.replace(
                    'AVATAR',
                    ''
                ),
                10
            ) - 1;


        return (
            AVATARS[index] ||
            AVATARS[0]
        );

    }


    // =====================================================
    // COPIAR CÓDIGO
    // =====================================================

    function copiarCodigo() {

        if (!data.idPareja) {

            Alert.alert(
                'Atención',
                'Todavía no tienes un código de pareja.'
            );

            return;

        }


        Clipboard.setString(
            data.idPareja
        );


        Alert.alert(
            'Código copiado',
            'Tu código ha sido copiado al portapapeles.'
        );

    }


    // =====================================================
    // VINCULAR PAREJA
    // =====================================================

    function guardarNuevoCodigoPareja() {

        if (!codigoNuevo.trim()) {

            Alert.alert(
                'Error',
                'Por favor ingresa un código válido.'
            );

            return;

        }


        if (usuarioActual) {

            const codigoLimpio =
                codigoNuevo
                    .trim()
                    .toUpperCase();


            update(
                ref(
                    db,
                    `usuarios/${usuarioActual.uid}`
                ),
                {
                    idPareja:
                        codigoLimpio,
                }
            )
                .then(() => {

                    Alert.alert(
                        '¡Vinculación exitosa!',
                        'Te has vinculado correctamente con el código de tu pareja.'
                    );


                    setModoVincular(
                        false
                    );

                    setCodigoNuevo('');

                })
                .catch((error) => {

                    Alert.alert(
                        'Error',
                        error.message
                    );

                });

        }

    }


    // =====================================================
    // CERRAR SESIÓN
    // =====================================================

    function cerrarSesion() {

        auth.signOut()
            .then(() => {

                navigation.replace(
                    'login'
                );

            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    'No se pudo cerrar sesión: ' +
                    error.message
                );

            });

    }


    // =====================================================
    // PAREJA ENCONTRADA
    // =====================================================

    const parejaEncontrada =
        !nombreParejaVinculada.includes(
            'Aún'
        ) &&
        !nombreParejaVinculada.includes(
            'Buscando'
        );


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <>

            <ScrollView
                style={[
                    styles.scrollView,
                    {
                        backgroundColor:
                            colors.veryLight,
                    },
                ]}
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={
                    false
                }
            >


                {/* =================================
                    HEADER
                ================================= */}

                <View
                    style={[
                        styles.header,
                        {
                            borderBottomColor:
                                colors.light,
                        },
                    ]}
                >

                    <TouchableOpacity
                        style={[
                            styles.backButton,
                            {
                                backgroundColor:
                                    colors.light,
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="arrow-back"
                            size={21}
                            color={
                                colors.primary
                            }
                        />

                    </TouchableOpacity>


                    <View
                        style={
                            styles.headerTextContainer
                        }
                    >

                        <Text
                            style={[
                                styles.headerSmall,
                                {
                                    color:
                                        colors.primary,
                                },
                            ]}
                        >
                            CUENTA PERSONAL
                        </Text>


                        <Text
                            style={[
                                styles.titulo,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Perfil y pareja
                        </Text>

                    </View>

                </View>


                {/* =================================
                    PERFIL
                ================================= */}

                <View
                    style={[
                        styles.profileCard,
                        {
                            backgroundColor:
                                '#FFFFFF',
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={
                            styles.avatarContainer
                        }
                    >

                        {data.fotoPerfil ? (

                            <Image
                                source={
                                    getAvatarSource(
                                        data.fotoPerfil
                                    )
                                }
                                style={
                                    styles.avatarImage
                                }
                            />

                        ) : (

                            <View
                                style={[
                                    styles.avatar,
                                    {
                                        backgroundColor:
                                            colors.primary,
                                    },
                                ]}
                            >

                                <Text
                                    style={
                                        styles.avatarText
                                    }
                                >

                                    {data.nombre
                                        ? data.nombre
                                            .charAt(0)
                                            .toUpperCase()
                                        : 'U'}

                                </Text>

                            </View>

                        )}


                        {/* CÁMARA */}

                        <TouchableOpacity
                            style={[
                                styles.cameraButton,
                                {
                                    backgroundColor:
                                        colors.primary,
                                },
                            ]}
                            onPress={
                                abrirSelectorAvatar
                            }
                            activeOpacity={0.8}
                        >

                            <Ionicons
                                name="camera"
                                size={17}
                                color="#FFFFFF"
                            />

                        </TouchableOpacity>

                    </View>


                    <Text
                        style={
                            styles.changePhotoText
                        }
                    >
                        Toca la cámara para elegir un avatar
                    </Text>


                    <Text
                        style={[
                            styles.profileName,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        {data.nombre ||
                            'Usuario'}{' '}
                        {data.apellido || ''}
                    </Text>


                    <Text
                        style={
                            styles.profileEmail
                        }
                    >
                        {data.correo ||
                            'Sin correo'}
                    </Text>

                </View>


                {/* =================================
                    PERSONALIZAR APLICACIÓN
                ================================= */}

                <TouchableOpacity
                    style={[
                        styles.opcion,
                        {
                            borderColor:
                                colors.light,
                            backgroundColor:
                                '#FFFFFF',
                        },
                    ]}
                    onPress={() =>
                        navigation.navigate(
                            'seleccionarTema'
                        )
                    }
                    activeOpacity={0.8}
                >

                    <View
                        style={[
                            styles.opcionIcon,
                            {
                                backgroundColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="color-palette-outline"
                            size={24}
                            color={
                                colors.primary
                            }
                        />

                    </View>


                    <View
                        style={{
                            flex: 1,
                            marginLeft: 12,
                        }}
                    >

                        <Text
                            style={[
                                styles.opcionTitulo,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Personalizar aplicación
                        </Text>


                        <Text
                            style={[
                                styles.opcionDescripcion,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Cambia el color de la aplicación
                        </Text>

                    </View>


                    <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#94A3B8"
                    />

                </TouchableOpacity>


                {/* =================================
                    CÓDIGO DE PAREJA
                ================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <Ionicons
                        name="key-outline"
                        size={18}
                        color={
                            colors.primary
                        }
                    />

                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Código de pareja
                    </Text>

                </View>


                <View
                    style={[
                        styles.codeCard,
                        {
                            backgroundColor:
                                colors.primary,
                        },
                    ]}
                >

                    <Text
                        style={
                            styles.codeLabel
                        }
                    >
                        TU CÓDIGO ÚNICO
                    </Text>


                    <Text
                        style={
                            styles.roleName
                        }
                    >
                        {data.idPareja ||
                            '------'}
                    </Text>


                    <Text
                        style={
                            styles.codeDescription
                        }
                    >
                        Comparte este código con tu pareja
                        para sincronizar sus finanzas.
                    </Text>


                    <TouchableOpacity
                        style={
                            styles.copiarBtn
                        }
                        onPress={
                            copiarCodigo
                        }
                        activeOpacity={0.85}
                    >

                        <Ionicons
                            name="copy-outline"
                            size={17}
                            color="#FFFFFF"
                        />

                        <Text
                            style={
                                styles.copiarText
                            }
                        >
                            Copiar código
                        </Text>

                    </TouchableOpacity>

                </View>


                {/* =================================
                    PAREJA VINCULADA
                ================================= */}

                <View
                    style={[
                        styles.partnerCard,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.partnerIcon,
                            {
                                backgroundColor:
                                    colors.veryLight,
                            },
                        ]}
                    >

                        <Ionicons
                            name="heart"
                            size={18}
                            color={
                                colors.primary
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
                                styles.labelVinculo
                            }
                        >
                            PAREJA VINCULADA
                        </Text>


                        <Text
                            style={[
                                styles.valueVinculo,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {nombreParejaVinculada}
                        </Text>

                    </View>


                    <Ionicons
                        name={
                            parejaEncontrada
                                ? 'checkmark-circle'
                                : 'ellipse-outline'
                        }
                        size={20}
                        color={
                            parejaEncontrada
                                ? colors.primary
                                : '#B7BDBB'
                        }
                    />

                </View>


                {/* =================================
                    VINCULAR PAREJA
                ================================= */}

                <View
                    style={[
                        styles.vincularCard,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={
                            styles.vincularHeader
                        }
                    >

                        <View
                            style={[
                                styles.vincularIcon,
                                {
                                    backgroundColor:
                                        colors.veryLight,
                                },
                            ]}
                        >

                            <Ionicons
                                name="link-outline"
                                size={19}
                                color={
                                    colors.primary
                                }
                            />

                        </View>


                        <View
                            style={{
                                flex: 1,
                            }}
                        >

                            <Text
                                style={[
                                    styles.vincularCardTitulo,
                                    {
                                        color:
                                            colors.dark,
                                    },
                                ]}
                            >
                                Vincular pareja
                            </Text>


                            <Text
                                style={
                                    styles.vincularCardSub
                                }
                            >
                                ¿Tu pareja ya tiene un código?
                            </Text>

                        </View>

                    </View>


                    <Text
                        style={
                            styles.vincularDescription
                        }
                    >
                        Ingresa el código de conexión de tu
                        pareja para sincronizar la
                        información financiera.
                    </Text>


                    {!modoVincular ? (

                        <TouchableOpacity
                            style={[
                                styles.btnAbrirVincular,
                                {
                                    backgroundColor:
                                        colors.primary,
                                },
                            ]}
                            onPress={() =>
                                setModoVincular(
                                    true
                                )
                            }
                            activeOpacity={0.85}
                        >

                            <Ionicons
                                name="link"
                                size={17}
                                color="#FFFFFF"
                            />

                            <Text
                                style={
                                    styles.btnAbrirVincularText
                                }
                            >
                                Registrar código de pareja
                            </Text>

                        </TouchableOpacity>

                    ) : (

                        <View
                            style={
                                styles.vincularBox
                            }
                        >

                            <TextInput
                                style={
                                    styles.inputVinculo
                                }
                                placeholder="Ej. ABC123"
                                placeholderTextColor="#9AA1A0"
                                value={
                                    codigoNuevo
                                }
                                onChangeText={
                                    setCodigoNuevo
                                }
                                autoCapitalize="characters"
                                maxLength={20}
                            />


                            <View
                                style={
                                    styles.rowBotonesVinculo
                                }
                            >

                                <TouchableOpacity
                                    style={[
                                        styles.btnGuardarVinculo,
                                        {
                                            backgroundColor:
                                                colors.primary,
                                        },
                                    ]}
                                    onPress={
                                        guardarNuevoCodigoPareja
                                    }
                                    activeOpacity={0.85}
                                >

                                    <Ionicons
                                        name="checkmark"
                                        size={17}
                                        color="#FFFFFF"
                                    />

                                    <Text
                                        style={
                                            styles.btnGuardarVinculoText
                                        }
                                    >
                                        Guardar
                                    </Text>

                                </TouchableOpacity>


                                <TouchableOpacity
                                    style={
                                        styles.btnCancelarVinculo
                                    }
                                    onPress={() => {

                                        setModoVincular(
                                            false
                                        );

                                        setCodigoNuevo(
                                            ''
                                        );

                                    }}
                                    activeOpacity={0.85}
                                >

                                    <Ionicons
                                        name="close"
                                        size={17}
                                        color="#5A615E"
                                    />

                                    <Text
                                        style={
                                            styles.btnCancelarVinculoText
                                        }
                                    >
                                        Cancelar
                                    </Text>

                                </TouchableOpacity>

                            </View>

                        </View>

                    )}

                </View>


                {/* =================================
                    DATOS PERSONALES
                ================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <Ionicons
                        name="person-outline"
                        size={18}
                        color={
                            colors.primary
                        }
                    />

                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Datos personales
                    </Text>

                </View>


                <View
                    style={[
                        styles.infoBox,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.infoIcon,
                            {
                                backgroundColor:
                                    colors.veryLight,
                            },
                        ]}
                    >

                        <Ionicons
                            name="person-outline"
                            size={17}
                            color={
                                colors.primary
                            }
                        />

                    </View>


                    <View
                        style={
                            styles.infoContent
                        }
                    >

                        <Text
                            style={
                                styles.label
                            }
                        >
                            Nombre completo
                        </Text>


                        <Text
                            style={[
                                styles.value,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            {data.nombre}{' '}
                            {data.apellido}
                        </Text>

                    </View>

                </View>


                <View
                    style={[
                        styles.infoBox,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.infoIcon,
                            {
                                backgroundColor:
                                    colors.veryLight,
                            },
                        ]}
                    >

                        <Ionicons
                            name="male-female-outline"
                            size={17}
                            color={
                                colors.primary
                            }
                        />

                    </View>


                    <View
                        style={
                            styles.infoContent
                        }
                    >

                        <Text
                            style={
                                styles.label
                            }
                        >
                            Género
                        </Text>


                        <Text
                            style={[
                                styles.value,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            {data.genero ||
                                'No especificado'}
                        </Text>

                    </View>

                </View>


                <View
                    style={[
                        styles.infoBox,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.infoIcon,
                            {
                                backgroundColor:
                                    colors.veryLight,
                            },
                        ]}
                    >

                        <Ionicons
                            name="mail-outline"
                            size={17}
                            color={
                                colors.primary
                            }
                        />

                    </View>


                    <View
                        style={
                            styles.infoContent
                        }
                    >

                        <Text
                            style={
                                styles.label
                            }
                        >
                            Correo electrónico
                        </Text>


                        <Text
                            style={[
                                styles.value,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                            numberOfLines={1}
                        >
                            {data.correo}
                        </Text>

                    </View>

                </View>


                {/* =================================
                    CERRAR SESIÓN
                ================================= */}

                <TouchableOpacity
                    style={
                        styles.logoutButton
                    }
                    onPress={
                        cerrarSesion
                    }
                    activeOpacity={0.85}
                >

                    <View
                        style={
                            styles.logoutIcon
                        }
                    >

                        <Ionicons
                            name="log-out-outline"
                            size={18}
                            color={
                                COLOR_ROJO
                            }
                        />

                    </View>


                    <Text
                        style={
                            styles.logoutText
                        }
                    >
                        Cerrar sesión
                    </Text>


                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={
                            COLOR_ROJO
                        }
                    />

                </TouchableOpacity>


                <Text
                    style={
                        styles.footerText
                    }
                >
                    Finanzas en Pareja
                </Text>


            </ScrollView>


            {/* =================================
                MODAL AVATAR
            ================================= */}

            <Modal
                visible={
                    modalAvatarVisible
                }
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setModalAvatarVisible(
                        false
                    )
                }
            >

                <View
                    style={
                        styles.modalOverlay
                    }
                >

                    <View
                        style={[
                            styles.modalBox,
                            {
                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Text
                            style={[
                                styles.modalTitulo,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Elige tu avatar
                        </Text>


                        <View
                            style={
                                styles.avatarGrid
                            }
                        >

                            {AVATARS.map(
                                (src, i) => (

                                    <TouchableOpacity
                                        key={i}
                                        onPress={() =>
                                            seleccionarAvatar(
                                                i + 1
                                            )
                                        }
                                        activeOpacity={0.8}
                                    >

                                        <Image
                                            source={
                                                src
                                            }
                                            style={
                                                styles.avatarOpcion
                                            }
                                        />

                                    </TouchableOpacity>

                                )
                            )}

                        </View>


                        <TouchableOpacity
                            style={
                                styles.btnCerrarModal
                            }
                            onPress={() =>
                                setModalAvatarVisible(
                                    false
                                )
                            }
                        >

                            <Text
                                style={[
                                    styles.btnCerrarModalText,
                                    {
                                        color:
                                            colors.primary,
                                    },
                                ]}
                            >
                                Cancelar
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </Modal>

        </>

    );

}


// =====================================================
// PALETA FIJA
// =====================================================

const COLOR_ROJO = '#B85C5C';

const COLOR_BORDE = '#E4E7E6';

const COLOR_TEXTO_SUAVE = '#7A817F';

const COLOR_MUY_SUAVE = '#F3F7F6';


// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
    },


    container: {
        paddingHorizontal: 20,
        paddingTop: 45,
        paddingBottom: 45,
    },


    // =================================================
    // HEADER
    // =================================================

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 15,
        marginBottom: 20,
        borderBottomWidth: 1,
    },


    backButton: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },


    headerTextContainer: {
        flex: 1,
    },


    headerSmall: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.3,
        marginBottom: 4,
    },


    titulo: {
        fontSize: 24,
        fontWeight: '800',
    },


    // =================================================
    // PERFIL
    // =================================================

    profileCard: {
        borderRadius: 18,
        paddingVertical: 24,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
    },


    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },


    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },


    avatarImage: {
        width: 92,
        height: 92,
        borderRadius: 46,
    },


    avatarText: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '800',
    },


    cameraButton: {
        position: 'absolute',
        right: -2,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },


    changePhotoText: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 10,
        marginBottom: 10,
    },


    profileName: {
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 3,
    },


    profileEmail: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 13,
    },


    // =================================================
    // PERSONALIZAR
    // =================================================

    opcion: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        marginBottom: 22,
    },


    opcionIcon: {
        width: 44,
        height: 44,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },


    opcionTitulo: {
        fontSize: 15,
        fontWeight: '800',
    },


    opcionDescripcion: {
        fontSize: 11,
        marginTop: 3,
    },


    // =================================================
    // SECCIONES
    // =================================================

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 3,
        gap: 8,
    },


    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },


    // =================================================
    // CÓDIGO
    // =================================================

    codeCard: {
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
    },


    codeLabel: {
        color: '#CDE6E1',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },


    roleName: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: 3,
        marginVertical: 8,
    },


    codeDescription: {
        color: '#CDE6E1',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
        marginBottom: 15,
    },


    copiarBtn: {
        backgroundColor:
            'rgba(255,255,255,0.16)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 12,
    },


    copiarText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 7,
    },


    // =================================================
    // PAREJA
    // =================================================

    partnerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },


    partnerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },


    labelVinculo: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 3,
    },


    valueVinculo: {
        fontSize: 14,
        fontWeight: '700',
    },


    // =================================================
    // VINCULAR
    // =================================================

    vincularCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 25,
        borderWidth: 1,
    },


    vincularHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },


    vincularIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },


    vincularCardTitulo: {
        fontSize: 15,
        fontWeight: '800',
    },


    vincularCardSub: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 11,
        marginTop: 2,
    },


    vincularDescription: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 15,
    },


    btnAbrirVincular: {
        width: '100%',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },


    btnAbrirVincularText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 7,
    },


    vincularBox: {
        width: '100%',
    },


    inputVinculo: {
        backgroundColor: COLOR_MUY_SUAVE,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        borderRadius: 12,
        padding: 13,
        color: '#171A19',
        marginBottom: 10,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 2,
    },


    rowBotonesVinculo: {
        flexDirection: 'row',
        gap: 10,
    },


    btnGuardarVinculo: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },


    btnGuardarVinculoText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 5,
    },


    btnCancelarVinculo: {
        flex: 1,
        backgroundColor: COLOR_MUY_SUAVE,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },


    btnCancelarVinculoText: {
        color: '#5A615E',
        fontWeight: '700',
        fontSize: 12,
        marginLeft: 5,
    },


    // =================================================
    // DATOS
    // =================================================

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },


    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },


    infoContent: {
        flex: 1,
    },


    label: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
    },


    value: {
        fontSize: 14,
        fontWeight: '700',
    },


    // =================================================
    // LOGOUT
    // =================================================

    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FCF3F3',
        borderWidth: 1,
        borderColor: '#F5D6D6',
        borderRadius: 14,
        padding: 16,
        marginTop: 10,
        marginBottom: 20,
    },


    logoutIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FADBD8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },


    logoutText: {
        flex: 1,
        color: COLOR_ROJO,
        fontSize: 14,
        fontWeight: '700',
    },


    footerText: {
        textAlign: 'center',
        color: COLOR_TEXTO_SUAVE,
        fontSize: 11,
        marginTop: 10,
    },


    // =================================================
    // MODAL
    // =================================================

    modalOverlay: {
        flex: 1,
        backgroundColor:
            'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },


    modalBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 22,
        width: '85%',
        alignItems: 'center',
        borderWidth: 1,
    },


    modalTitulo: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 15,
    },


    avatarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 15,
    },


    avatarOpcion: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: COLOR_BORDE,
    },


    btnCerrarModal: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },


    btnCerrarModalText: {
        fontWeight: '700',
    },

});