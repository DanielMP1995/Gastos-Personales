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
    Platform,
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

    // Se usa para "romper" el caché del componente Image cada
    // vez que se sube una foto nueva, así siempre se ve la
    // última versión y no una versión vieja guardada en caché.
    const [fotoCacheKey, setFotoCacheKey] = useState(Date.now());


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
                Alert.alert('Error', 'No hay un usuario autenticado.');
                return;
            }

            const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permiso.granted) {
                Alert.alert('Permiso necesario', 'Necesitamos permiso para acceder a tus fotos.');
                return;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (resultado.canceled) {
                return;
            }

            const imagen = resultado.assets[0];
            if (!imagen?.uri) {
                return;
            }

            setSubiendoFoto(true);

            // Corrección para Android nativo: Manejo directo de la URI o conversión segura por XMLHttpRequest si es necesario
            const uriLimpia = decodeURI(imagen.uri);

            const uploadUri = Platform.OS === 'ios' ? uriLimpia.replace('file://', '') : uriLimpia;

            // Usamos XMLHttpRequest que es mucho más estable en APKs nativas de Android para Storage
            const blob: any = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response);
                };
                xhr.onerror = function (e) {
                    console.log(e);
                    reject(new TypeError('Fallo en la red al procesar la imagen.'));
                };
                xhr.responseType = 'blob';
                xhr.open('GET', uploadUri, true);
                xhr.send(null);
            });

            const rutaFoto = `usuarios/${usuarioActual.uid}/fotoPerfil.jpg`;
            const fotoRef = storageRef(storage, rutaFoto);

            await uploadBytes(fotoRef, blob, {
                contentType: imagen.mimeType || 'image/jpeg',
            });

            // Cerrar el blob de forma segura
            blob.close();

            const urlFoto = await getDownloadURL(fotoRef);

            await update(ref(db, `usuarios/${usuarioActual.uid}`), {
                fotoPerfil: urlFoto,
            });

            setData((prev) => ({
                ...prev,
                fotoPerfil: urlFoto,
            }));

            setFotoCacheKey(Date.now());

            Alert.alert('¡Foto actualizada!', 'Tu foto de perfil se guardó correctamente.');

        } catch (error: any) {
            console.log('Error subiendo foto:', error);
            Alert.alert(
                'Error',
                'No se pudo subir la foto. Detalle: ' + (error.message || 'Error desconocido')
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


    const parejaEncontrada =
        !nombreParejaVinculada.includes('Aún') &&
        !nombreParejaVinculada.includes('Buscando');


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

                <Text style={styles.headerSmall}>
                    CUENTA PERSONAL
                </Text>

                <Text style={styles.titulo}>
                    Perfil y pareja
                </Text>

            </View>


            {/* =================================
                PERFIL CON FOTO
            ================================= */}

            <View style={styles.profileCard}>

                <View style={styles.avatarContainer}>

                    {data.fotoPerfil ? (

                        <Image
                            source={{
                                uri: `${data.fotoPerfil}${data.fotoPerfil.includes('?')
                                        ? '&'
                                        : '?'
                                    }cache=${fotoCacheKey}`,
                            }}
                            style={styles.avatarImage}
                            onError={(e) =>
                                console.log(
                                    'Error cargando foto de perfil:',
                                    e.nativeEvent?.error
                                )
                            }
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
                                size={17}
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
                CÓDIGO DE PAREJA
            ================================= */}

            <View style={styles.sectionHeader}>

                <Ionicons
                    name="key-outline"
                    size={18}
                    color={COLOR_PRINCIPAL}
                />

                <Text style={styles.sectionTitle}>
                    Código de pareja
                </Text>

            </View>


            <View style={styles.codeCard}>

                <Text style={styles.codeLabel}>
                    TU CÓDIGO ÚNICO
                </Text>


                <Text style={styles.roleName}>
                    {data.idPareja || '------'}
                </Text>


                <Text style={styles.codeDescription}>
                    Comparte este código con tu pareja
                    para sincronizar sus finanzas.
                </Text>


                <TouchableOpacity
                    style={styles.copiarBtn}
                    onPress={copiarCodigo}
                    activeOpacity={0.85}
                >

                    <Ionicons
                        name="copy-outline"
                        size={17}
                        color="#FFFFFF"
                    />

                    <Text style={styles.copiarText}>
                        Copiar código
                    </Text>

                </TouchableOpacity>

            </View>


            {/* =================================
                PAREJA VINCULADA
            ================================= */}

            <View style={styles.partnerCard}>

                <View style={styles.partnerIcon}>

                    <Ionicons
                        name="heart"
                        size={18}
                        color={COLOR_PRINCIPAL}
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
                        parejaEncontrada
                            ? 'checkmark-circle'
                            : 'ellipse-outline'
                    }
                    size={20}
                    color={
                        parejaEncontrada
                            ? COLOR_VERDE
                            : '#B7BDBB'
                    }
                />

            </View>


            {/* =================================
                VINCULAR PAREJA
            ================================= */}

            <View style={styles.vincularCard}>

                <View style={styles.vincularHeader}>

                    <View style={styles.vincularIcon}>

                        <Ionicons
                            name="link-outline"
                            size={19}
                            color={COLOR_PRINCIPAL}
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
                    Ingresa el código de conexión de tu
                    pareja para sincronizar la
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

                    <View style={styles.vincularBox}>

                        <TextInput
                            style={styles.inputVinculo}
                            placeholder="Ej. ABC123"
                            placeholderTextColor="#9AA1A0"
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

                                    setCodigoNuevo('');

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

            <View style={styles.sectionHeader}>

                <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLOR_PRINCIPAL}
                />

                <Text style={styles.sectionTitle}>
                    Datos personales
                </Text>

            </View>


            <View style={styles.infoBox}>

                <View style={styles.infoIcon}>

                    <Ionicons
                        name="person-outline"
                        size={17}
                        color={COLOR_PRINCIPAL}
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
                        size={17}
                        color={COLOR_PRINCIPAL}
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
                        size={17}
                        color={COLOR_PRINCIPAL}
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
                activeOpacity={0.85}
            >

                <View style={styles.logoutIcon}>

                    <Ionicons
                        name="log-out-outline"
                        size={18}
                        color={COLOR_ROJO}
                    />

                </View>


                <Text style={styles.logoutText}>
                    Cerrar sesión
                </Text>


                <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLOR_ROJO}
                />

            </TouchableOpacity>


            <Text style={styles.footerText}>
                Finanzas en Pareja
            </Text>

        </ScrollView>
    );
}


/* =====================================================
   PALETA
===================================================== */

const COLOR_PRINCIPAL = '#176B63';
const COLOR_OSCURO = '#124C47';
const COLOR_VERDE = '#2E7D6E';
const COLOR_SUAVE = '#DCEAE7';
const COLOR_MUY_SUAVE = '#F3F7F6';

const COLOR_ROJO = '#B85C5C';

const COLOR_BORDE = '#E4E7E6';
const COLOR_TEXTO_SUAVE = '#7A817F';


/* =====================================================
   ESTILOS
===================================================== */

const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    container: {
        paddingHorizontal: 20,
        paddingTop: 45,
        paddingBottom: 45,
    },

    header: {
        marginBottom: 20,
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
    },

    profileCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 24,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginBottom: 22,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
    },

    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
    },

    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        backgroundColor: COLOR_PRINCIPAL,
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
        backgroundColor: COLOR_PRINCIPAL,
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
        color: '#171A19',
        fontSize: 19,
        fontWeight: '800',
        marginBottom: 3,
    },

    profileEmail: {
        color: COLOR_TEXTO_SUAVE,
        fontSize: 13,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 3,
        gap: 8,
    },

    sectionTitle: {
        color: '#171A19',
        fontSize: 15,
        fontWeight: '700',
    },

    codeCard: {
        backgroundColor: COLOR_PRINCIPAL,
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
        backgroundColor: 'rgba(255,255,255,0.16)',
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

    partnerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        flexDirection: 'row',
        alignItems: 'center',
    },

    partnerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLOR_MUY_SUAVE,
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
        color: '#171A19',
        fontSize: 14,
        fontWeight: '700',
    },

    vincularCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: COLOR_BORDE,
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
        backgroundColor: COLOR_MUY_SUAVE,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    vincularCardTitulo: {
        color: '#171A19',
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
        backgroundColor: COLOR_PRINCIPAL,
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
        backgroundColor: COLOR_PRINCIPAL,
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

    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: COLOR_BORDE,
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
    },

    infoIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: COLOR_MUY_SUAVE,
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
        color: '#171A19',
        fontSize: 14,
        fontWeight: '700',
    },

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

});