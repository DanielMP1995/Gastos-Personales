import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    push,
    set,
    onValue,
    get,
} from 'firebase/database';

export default function RegistroGastosFijosScreen({
    navigation,
}: any) {

    // ============================================================
    // ESTADOS
    // ============================================================

    const [nombreGasto, setNombreGasto] =
        useState('');

    const [montoFijo, setMontoFijo] =
        useState('');

    const [categoriaServicio, setCategoriaServicio] =
        useState('Luz');

    const [gastosFijosRegistrados, setGastosFijosRegistrados] =
        useState<any[]>([]);

    // ============================================================
    // CATEGORÍAS
    // ============================================================

    const categoriasServicios = [
        'Luz',
        'Agua',
        'Internet / Teléfono',
        'Alquiler',
        'Otro',
    ];

    // ============================================================
    // USUARIO ACTUAL
    // ============================================================

    const usuarioActual = auth.currentUser;

    // ============================================================
    // CARGAR GASTOS FIJOS
    // ============================================================

    useEffect(() => {

        if (!usuarioActual) {
            return;
        }

        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        const cargarGastosFijos = async () => {

            try {

                const snapshot =
                    await get(usuarioRef);

                if (!snapshot.exists()) {
                    return;
                }

                const userData =
                    snapshot.val();

                const idPareja =
                    userData.idPareja;

                if (!idPareja) {
                    return;
                }

                const fijosRef = ref(
                    db,
                    `parejas/${idPareja}/gastosFijos`
                );

                const unsubscribe =
                    onValue(
                        fijosRef,
                        (snap) => {

                            const data =
                                snap.val();

                            if (!data) {

                                setGastosFijosRegistrados(
                                    []
                                );

                                return;
                            }

                            const lista =
                                Object.keys(data).map(
                                    (key) => ({
                                        id: key,
                                        ...data[key],
                                    })
                                );

                            setGastosFijosRegistrados(
                                lista
                            );
                        }
                    );

                return unsubscribe;

            } catch (error) {

                console.log(
                    'Error cargando gastos fijos:',
                    error
                );
            }
        };

        cargarGastosFijos();

    }, [usuarioActual]);

    // ============================================================
    // GUARDAR GASTO FIJO
    // ============================================================

    function guardarGastoFijo() {

        const nombre =
            nombreGasto.trim();

        const montoNum =
            parseFloat(montoFijo);

        // --------------------------------------------------------
        // VALIDAR NOMBRE
        // --------------------------------------------------------

        if (!nombre) {

            Alert.alert(
                'Error',
                'Por favor ingresa un nombre o descripción para el gasto fijo.'
            );

            return;
        }

        // --------------------------------------------------------
        // VALIDAR MONTO
        // --------------------------------------------------------

        if (
            isNaN(montoNum) ||
            montoNum <= 0
        ) {

            Alert.alert(
                'Error',
                'Ingresa un monto mensual válido.'
            );

            return;
        }

        // --------------------------------------------------------
        // VALIDAR USUARIO
        // --------------------------------------------------------

        if (!usuarioActual) {

            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );

            return;
        }

        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        get(usuarioRef)
            .then((snapshot) => {

                if (!snapshot.exists()) {

                    Alert.alert(
                        'Error',
                        'No se encontró la información del usuario.'
                    );

                    return;
                }

                const userData =
                    snapshot.val();

                const idPareja =
                    userData.idPareja;

                if (!idPareja) {

                    Alert.alert(
                        'Error',
                        'No tienes una pareja vinculada.'
                    );

                    return;
                }

                // ------------------------------------------------
                // REFERENCIA
                // ------------------------------------------------

                const fijosRef = ref(
                    db,
                    `parejas/${idPareja}/gastosFijos`
                );

                const nuevoFijoRef =
                    push(fijosRef);

                // ------------------------------------------------
                // DATOS
                // ------------------------------------------------

                const datosFijo = {

                    tipo:
                        'gastoFijo',

                    nombre:
                        nombre,

                    categoria:
                        categoriaServicio,

                    monto:
                        Number(
                            montoNum.toFixed(2)
                        ),

                    activo:
                        true,

                    fechaRegistro:
                        new Date().toISOString(),

                    usuarioEmail:
                        usuarioActual.email,

                    autor:
                        userData.nombre ||
                        usuarioActual.email ||
                        'Usuario',
                };

                // ------------------------------------------------
                // GUARDAR
                // ------------------------------------------------

                set(
                    nuevoFijoRef,
                    datosFijo
                )
                    .then(() => {

                        Alert.alert(
                            '¡Éxito!',
                            'Gasto fijo configurado correctamente.'
                        );

                        // Limpiar formulario
                        setNombreGasto('');
                        setMontoFijo('');

                    })
                    .catch((error) => {

                        Alert.alert(
                            'Error',
                            error?.message ||
                                'No se pudo guardar el gasto fijo.'
                        );

                    });

            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    error?.message ||
                        'No se pudo obtener la información del usuario.'
                );

            });
    }

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={
                    styles.container
                }
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Cabecera superior minimalista */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>
                            ←
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.topHeaderTitle}>
                        Gastos Fijos
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIconContainer}>
                        <Text style={styles.heroEmoji}>
                            ⚡
                        </Text>
                    </View>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>
                            Servicios Recurrentes
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Establece y gestiona tus servicios mensuales fijos
                        </Text>
                    </View>
                </View>

                {/* Sección Paso 1: Categoría */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                            01
                        </Text>
                    </View>
                    <Text style={styles.sectionTitle}>
                        Tipo de Servicio
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rowCat}
                >
                    {categoriasServicios.map((cat) => {
                        const isSelected =
                            categoriaServicio === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.catBtn,
                                    isSelected &&
                                        styles.catBtnActive,
                                ]}
                                onPress={() =>
                                    setCategoriaServicio(
                                        cat
                                    )
                                }
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.catText,
                                        isSelected &&
                                            styles.catTextActive,
                                    ]}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Sección Paso 2: Formulario */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                            02
                        </Text>
                    </View>
                    <Text style={styles.sectionTitle}>
                        Detalles del Gasto
                    </Text>
                </View>

                <View style={styles.formCard}>
                    <Text style={styles.label}>
                        Nombre / Identificador
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Luz de casa / Plan de Claro"
                        placeholderTextColor="#94A3B8"
                        value={nombreGasto}
                        onChangeText={setNombreGasto}
                    />

                    <Text style={styles.label}>
                        Monto Estimado Mensual ($)
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 35.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={montoFijo}
                        onChangeText={setMontoFijo}
                    />

                    <TouchableOpacity
                        style={styles.btnGuardar}
                        onPress={guardarGastoFijo}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name="add-circle-outline"
                            size={18}
                            color="white"
                            style={{ marginRight: 6 }}
                        />
                        <Text style={styles.btnGuardarText}>
                            Guardar Gasto Fijo
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Sección Lista de Gastos */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                            03
                        </Text>
                    </View>
                    <Text style={styles.sectionTitle}>
                        Servicios Fijos Registrados
                    </Text>
                </View>

                {gastosFijosRegistrados.length === 0 ? (
                    <View style={styles.vacioCard}>
                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color="#059669"
                        />
                        <Text style={styles.vacioTexto}>
                            Aún no hay gastos fijos configurados.
                        </Text>
                    </View>
                ) : (
                    gastosFijosRegistrados.map((item) => (
                        <View
                            key={item.id}
                            style={styles.itemCard}
                        >
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemNombre}>
                                    {item.nombre ||
                                        'Servicio sin nombre'}
                                </Text>
                                <Text style={styles.itemCategoria}>
                                    Categoría:{' '}
                                    {item.categoria || 'Otro'}
                                </Text>
                                <Text style={styles.itemEstado}>
                                    {item.activo === false
                                        ? 'Inactivo'
                                        : 'Activo'}
                                </Text>
                            </View>

                            <Text style={styles.itemMonto}>
                                $
                                {Number(
                                    item.monto
                                ).toFixed(2)}
                            </Text>
                        </View>
                    ))
                )}


            </ScrollView>
        </View>
    );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    backButtonText: {
        color: '#1E293B',
        fontSize: 18,
        fontWeight: 'bold',
    },
    topHeaderTitle: {
        color: '#1E293B',
        fontSize: 16,
        fontWeight: '600',
    },
    heroCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    heroIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    heroEmoji: {
        fontSize: 24,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroTitle: {
        color: '#1E293B',
        fontSize: 17,
        fontWeight: 'bold',
        marginBottom: 3,
    },
    heroSubtitle: {
        color: '#64748B',
        fontSize: 12,
        lineHeight: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 10,
    },
    stepBadge: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#059669',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    stepBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#1E293B',
        fontSize: 15,
        fontWeight: '600',
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    label: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
        marginTop: 12,
    },
    rowCat: {
        paddingVertical: 4,
        paddingRight: 10,
        marginBottom: 6,
    },
    catBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catBtnActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#059669',
    },
    catText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '500',
    },
    catTextActive: {
        color: '#047857',
        fontWeight: 'bold',
        fontSize: 12,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#1E293B',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 13,
    },
    btnGuardar: {
        backgroundColor: '#059669',
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    btnGuardarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    vacioCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    vacioTexto: {
        color: '#64748B',
        fontSize: 12,
        fontStyle: 'italic',
        marginLeft: 10,
    },
    itemCard: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    itemInfo: {
        flex: 1,
        paddingRight: 10,
    },
    itemNombre: {
        color: '#1E293B',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 3,
    },
    itemCategoria: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },
    itemEstado: {
        color: '#059669',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
    },
    itemMonto: {
        color: '#047857',
        fontWeight: 'bold',
        fontSize: 16,
    },
    btnVolver: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    btnVolverText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13,
    },
}); //pagina /registros/gastos fijos