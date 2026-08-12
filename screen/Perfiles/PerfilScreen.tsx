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
    ActivityIndicator,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';

import { auth, db, storage } from '../../firebase/FirebaseConfig';

import {
    ref,
    onValue,
    update,
} from 'firebase/database';

import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
} from 'firebase/storage';


export default function PerfilScreen({ navigation }: any) {

    const usuarioActual = auth.currentUser;

    const [data, setData] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        genero: '',
        idPareja: '',
        fotoPerfil: '',
    });

    const [nombreParejaVinculada, setNombreParejaVinculada] =
        useState('Buscando pareja vinculada...');

    const [codigoNuevo, setCodigoNuevo] = useState('');
    const [modoVincular, setModoVincular] = useState(false);

    const [subiendoFoto, setSubiendoFoto] = useState(false);


    /* HEADER */

    useEffect(() => {

        navigation.setOptions({
            headerShown: false,
        });

    }, [navigation]);


    /* CARGAR DATOS DEL USUARIO */

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


                    /* BUSCAR PAREJA */

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

                                Object.keys(allUsers).forEach(
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

                                            encontrado = true;
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


        return () => unsubscribePerfil();

    }, [usuarioActual]);


    /* =========================================
       SELECCIONAR Y SUBIR FOTO DE PERFIL
    ========================================= */

    async function seleccionarFoto() {

        try {

            if (!usuarioActual) {
                Alert.alert(
                    'Error',
                    'No hay un usuario autenticado.'
                );
                return;
            }


            /* PERMISO PARA GALERÍA */

            const permiso =
                await ImagePicker.requestMediaLibraryPermissionsAsync();


            if (!permiso.granted) {

                Alert.alert(
                    'Permiso necesario',
                    'Necesitamos permiso para acceder a tus fotos.'
                );

                return;
            }


            /* ABRIR GALERÍA */

            const resultado =
                await ImagePicker.launchImageLibraryAsync({

                    mediaTypes: ['images'],

                    allowsEditing: true,

                    aspect: [1, 1],

                    quality: 0.8,

                });


            if (resultado.canceled) {
                return;
            }


            const imagen =
                resultado.assets[0];


            if (!imagen?.uri) {
                return;
            }


            setSubiendoFoto(true);


            /* CONVERTIR URI A BLOB */

            const response =
                await fetch(imagen.uri);

            const blob =
                await response.blob();


            /* RUTA ÚNICA EN FIREBASE STORAGE */

            const rutaFoto =
                `usuarios/${usuarioActual.uid}/fotoPerfil.jpg`;


            const fotoRef =
                storageRef(
                    storage,
                    rutaFoto
                );


            /* SUBIR IMAGEN */

            await uploadBytes(
                fotoRef,
                blob,
                {
                    contentType:
                        imagen.mimeType || 'image/jpeg',
                }
            );


            /* OBTENER URL */

            const urlFoto =
                await getDownloadURL(
                    fotoRef
                );


            /* GUARDAR SOLO EL CAMPO fotoPerfil */

            await update(
                ref(
                    db,
                    `usuarios/${usuarioActual.uid}`
                ),
                {
                    fotoPerfil: urlFoto,
                }
            );


            /* ACTUALIZAR PANTALLA */

            setData((prev) => ({
                ...prev,
                fotoPerfil: urlFoto,
            }));


            Alert.alert(
                '¡Foto actualizada!',
                'Tu foto de perfil se guardó correctamente.'
            );

        } catch (error: any) {

            console.log(
                'Error subiendo foto:',
                error
            );

            Alert.alert(
                'Error',
                'No se pudo subir la foto. Verifica tu conexión e inténtalo nuevamente.'
            );

        } finally {

            setSubiendoFoto(false);

        }

    }


    /* =========================================
       COPIAR CÓDIGO
    ========================================= */

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


    /* =========================================
       VINCULAR PAREJA
    ========================================= */

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
                codigoNuevo.trim().toUpperCase();


            update(
                ref(
                    db,
                    `usuarios/${usuarioActual.uid}`
                ),
                {
                    idPareja: codigoLimpio,
                }
            )
                .then(() => {

                    Alert.alert(
                        '¡Vinculación exitosa!',
                        'Te has vinculado correctamente con el código de tu pareja.'
                    );


                    setModoVincular(false);

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


    /* =========================================
       CERRAR SESIÓN
    ========================================= */

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


    return (

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >


            {/* =================================
                HEADER
            ================================= */}

            <View style={styles.header}>

                <View style={styles.headerIcon}>

                    <Ionicons
                        name="person"
                        size={28}
                        color="#FFFFFF"
                    />

                </View>


                <View style={styles.headerTextContainer}>

                    <Text style={styles.headerSmall}>
                        CUENTA PERSONAL
                    </Text>

                    <Text style={styles.titulo}>
                        Mi Perfil
                    </Text>

                </View>

            </View>


            {/* =================================
                PERFIL CON FOTO
            ================================= */}

            <View style={styles.profileCard}>

                <View style={styles.avatarContainer}>

                    {data.fotoPerfil ? (

                        <Image
                            source={{
                                uri: data.fotoPerfil
                            }}
                            style={styles.avatarImage}
                        />

                    ) : (

                        <View style={styles.avatar}>

                            <Text style={styles.avatarText}>

                                {data.nombre
                                    ? data.nombre
                                          .charAt(0)
                                          .toUpperCase()
                                    : 'U'}

                            </Text>

                        </View>

                    )}


                    {/* BOTÓN CÁMARA */}

                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={seleccionarFoto}
                        disabled={subiendoFoto}
                        activeOpacity={0.8}
                    >

                        {subiendoFoto ? (

                            <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                            />

                        ) : (

                            <Ionicons
                                name="camera"
                                size={19}
                                color="#FFFFFF"
                            />

                        )}

                    </TouchableOpacity>

                </View>


                <Text style={styles.changePhotoText}>
                    {subiendoFoto
                        ? 'Subiendo foto...'
                        : 'Toca la cámara para cambiar tu foto'}
                </Text>


                <Text style={styles.profileName}>
                    {data.nombre || 'Usuario'}{' '}
                    {data.apellido || ''}
                </Text>


                <Text style={styles.profileEmail}>
                    {data.correo || 'Sin correo'}
                </Text>

            </View>


            {/* =================================
                CONEXIÓN DE PAREJA
            ================================= */}

            <View style={styles.sectionHeader}>

                <Ionicons
                    name="people-outline"
                    size={20}
                    color="#38BDF8"
                />

                <Text style={styles.sectionTitle}>
                    Conexión de pareja
                </Text>

            </View>


            {/* CÓDIGO */}

            <View style={styles.codeCard}>

                <View style={styles.codeIcon}>

                    <Ionicons
                        name="key-outline"
                        size={24}
                        color="#38BDF8"
                    />

                </View>


                <Text style={styles.codeLabel}>
                    TU CÓDIGO DE CONEXIÓN
                </Text>


                <Text style={styles.roleName}>
                    {data.idPareja || '------'}
                </Text>


                <Text style={styles.codeDescription}>
                    Comparte este código con tu
                    pareja para sincronizar sus
                    finanzas.
                </Text>


                <TouchableOpacity
                    style={styles.copiarBtn}
                    onPress={copiarCodigo}
                    activeOpacity={0.8}
                >

                    <Ionicons
                        name="copy-outline"
                        size={18}
                        color="#0F172A"
                    />

                    <Text style={styles.copiarText}>
                        Copiar código
                    </Text>

                </TouchableOpacity>

            </View>


            {/* =================================
                VINCULAR PAREJA
            ================================= */}

            <View style={styles.vincularCard}>

                <View style={styles.vincularHeader}>

                    <View style={styles.vincularIcon}>

                        <Ionicons
                            name="link-outline"
                            size={22}
                            color="#FFFFFF"
                        />

                    </View>


                    <View style={{ flex: 1 }}>

                        <Text
                            style={
                                styles.vincularCardTitulo
                            }
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


                <Text style={styles.vincularDescription}>
                    Ingresa el código de conexión de
                    tu pareja para sincronizar la
                    información financiera.
                </Text>


                {!modoVincular ? (

                    <TouchableOpacity
                        style={
                            styles.btnAbrirVincular
                        }
                        onPress={() =>
                            setModoVincular(true)
                        }
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="link"
                            size={18}
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

                    <View style={styles.vincularBox}>

                        <TextInput
                            style={styles.inputVinculo}
                            placeholder="Ej. ABC123"
                            placeholderTextColor="#64748B"
                            value={codigoNuevo}
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
                                style={
                                    styles.btnGuardarVinculo
                                }
                                onPress={
                                    guardarNuevoCodigoPareja
                                }
                                activeOpacity={0.8}
                            >

                                <Ionicons
                                    name="checkmark"
                                    size={18}
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

                                    setCodigoNuevo('');

                                }}
                                activeOpacity={0.8}
                            >

                                <Ionicons
                                    name="close"
                                    size={18}
                                    color="#CBD5E1"
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
                PAREJA VINCULADA
            ================================= */}

            <View style={styles.partnerCard}>

                <View style={styles.partnerIcon}>

                    <Ionicons
                        name="heart"
                        size={20}
                        color="#FB7185"
                    />

                </View>


                <View style={{ flex: 1 }}>

                    <Text style={styles.labelVinculo}>
                        PAREJA VINCULADA
                    </Text>


                    <Text
                        style={styles.valueVinculo}
                        numberOfLines={1}
                    >
                        {nombreParejaVinculada}
                    </Text>

                </View>


                <Ionicons
                    name={
                        nombreParejaVinculada.includes(
                            'Aún'
                        )
                            ? 'ellipse-outline'
                            : 'checkmark-circle'
                    }
                    size={22}
                    color={
                        nombreParejaVinculada.includes(
                            'Aún'
                        )
                            ? '#64748B'
                            : '#10B981'
                    }
                />

            </View>


            {/* =================================
                DATOS PERSONALES
            ================================= */}

            <View style={styles.sectionHeader}>

                <Ionicons
                    name="person-outline"
                    size={20}
                    color="#38BDF8"
                />

                <Text style={styles.sectionTitle}>
                    Datos personales
                </Text>

            </View>


            <View style={styles.infoBox}>

                <View style={styles.infoIcon}>

                    <Ionicons
                        name="person-outline"
                        size={18}
                        color="#38BDF8"
                    />

                </View>


                <View style={styles.infoContent}>

                    <Text style={styles.label}>
                        Nombre completo
                    </Text>

                    <Text style={styles.value}>
                        {data.nombre} {data.apellido}
                    </Text>

                </View>

            </View>


            <View style={styles.infoBox}>

                <View style={styles.infoIcon}>

                    <Ionicons
                        name="male-female-outline"
                        size={18}
                        color="#A78BFA"
                    />

                </View>


                <View style={styles.infoContent}>

                    <Text style={styles.label}>
                        Género
                    </Text>

                    <Text style={styles.value}>
                        {data.genero || 'No especificado'}
                    </Text>

                </View>

            </View>


            <View style={styles.infoBox}>

                <View style={styles.infoIcon}>

                    <Ionicons
                        name="mail-outline"
                        size={18}
                        color="#34D399"
                    />

                </View>


                <View style={styles.infoContent}>

                    <Text style={styles.label}>
                        Correo electrónico
                    </Text>

                    <Text
                        style={styles.value}
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
                style={styles.logoutButton}
                onPress={cerrarSesion}
                activeOpacity={0.8}
            >

                <View style={styles.logoutIcon}>

                    <Ionicons
                        name="log-out-outline"
                        size={20}
                        color="#F87171"
                    />

                </View>


                <Text style={styles.logoutText}>
                    Cerrar sesión
                </Text>


                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#F87171"
                />

            </TouchableOpacity>


            <Text style={styles.footerText}>
                Finanzas en Pareja
            </Text>

        </ScrollView>
    );
}


/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
        backgroundColor: '#08111F',
    },

    container: {
        paddingHorizontal: 22,
        paddingTop: 35,
        paddingBottom: 45,
    },


    /* HEADER */

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 22,
    },

    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
    },

    headerTextContainer: {
        flex: 1,
    },

    headerSmall: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.3,
        marginBottom: 2,
    },

    titulo: {
        color: '#F8FAFC',
        fontSize: 26,
        fontWeight: '800',
    },


    /* PERFIL */

    profileCard: {
        backgroundColor: '#111C2E',
        borderRadius: 22,
        paddingVertical: 24,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#1E3350',
    },

    avatarContainer: {
        position: 'relative',
        marginBottom: 8,
    },

    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#172B4A',
    },

    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#172B4A',
    },

    avatarText: {
        color: '#FFFFFF',
        fontSize: 38,
        fontWeight: '800',
    },

    cameraButton: {
        position: 'absolute',
        right: -3,
        bottom: 2,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#111C2E',
    },

    changePhotoText: {
        color: '#64748B',
        fontSize: 10,
        marginBottom: 8,
    },

    profileName: {
        color: '#F8FAFC',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },

    profileEmail: {
        color: '#64748B',
        fontSize: 13,
    },


    /* SECCIONES */

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 3,
    },

    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 17,
        fontWeight: '700',
        marginLeft: 8,
    },


    /* CÓDIGO */

    codeCard: {
        backgroundColor: '#10233C',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1E4F7A',
    },

    codeIcon: {
        width: 48,
        height: 48,
        borderRadius: 15,
        backgroundColor: '#123A5D',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },

    codeLabel: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },

    roleName: {
        color: '#38BDF8',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 3,
        marginVertical: 8,
    },

    codeDescription: {
        color: '#94A3B8',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        maxWidth: 280,
        marginBottom: 15,
    },

    copiarBtn: {
        backgroundColor: '#38BDF8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 12,
    },

    copiarText: {
        color: '#07111F',
        fontWeight: '800',
        fontSize: 13,
        marginLeft: 7,
    },


    /* VINCULAR */

    vincularCard: {
        backgroundColor: '#151E38',
        borderRadius: 20,
        padding: 18,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#303D69',
    },

    vincularHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    vincularIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    vincularCardTitulo: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    vincularCardSub: {
        color: '#A5B4FC',
        fontSize: 11,
        marginTop: 2,
    },

    vincularDescription: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 15,
    },

    btnAbrirVincular: {
        backgroundColor: '#7C3AED',
        width: '100%',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    btnAbrirVincularText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
        marginLeft: 7,
    },

    vincularBox: {
        width: '100%',
    },

    inputVinculo: {
        backgroundColor: '#0A1322',
        borderWidth: 1,
        borderColor: '#6366F1',
        borderRadius: 12,
        padding: 13,
        color: '#F8FAFC',
        marginBottom: 10,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 2,
    },

    rowBotonesVinculo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    btnGuardarVinculo: {
        backgroundColor: '#10B981',
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    btnGuardarVinculoText: {
        color: '#FFFFFF',
        fontWeight: '800',
        fontSize: 13,
        marginLeft: 5,
    },

    btnCancelarVinculo: {
        backgroundColor: '#263449',
        flex: 0.48,
        paddingVertical: 12,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    btnCancelarVinculoText: {
        color: '#CBD5E1',
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 5,
    },


    /* PAREJA */

    partnerCard: {
        backgroundColor: '#111C2E',
        borderRadius: 16,
        padding: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#24344D',
        flexDirection: 'row',
        alignItems: 'center',
    },

    partnerIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: '#3B1D2B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    labelVinculo: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 3,
    },

    valueVinculo: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '700',
    },


    /* INFORMACIÓN */

    infoBox: {
        backgroundColor: '#111C2E',
        padding: 14,
        borderRadius: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#22334A',
        flexDirection: 'row',
        alignItems: 'center',
    },

    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#17263A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    infoContent: {
        flex: 1,
    },

    label: {
        color: '#64748B',
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 3,
    },

    value: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },


    /* LOGOUT */

    logoutButton: {
        marginTop: 25,
        backgroundColor: '#21161D',
        borderWidth: 1,
        borderColor: '#5B2632',
        borderRadius: 15,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },

    logoutIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#351B23',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    logoutText: {
        color: '#F87171',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },

    footerText: {
        color: '#334155',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 25,
    },

});