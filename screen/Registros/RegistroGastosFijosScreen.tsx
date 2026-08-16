import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
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
    update,
    remove,
} from 'firebase/database';


// ============================================================
// TIPO DE GASTO
// ============================================================

type TipoMonto = 'fijo' | 'variable';


// ============================================================
// TIPO GASTO REGISTRADO
// ============================================================

type GastoFijo = {
    id: string;
    tipo: string;
    nombre: string;
    categoria: string;
    monto: number;
    tipoMonto?: TipoMonto;
    activo?: boolean;
    fechaRegistro?: string;
    usuarioEmail?: string;
    autor?: string;
};


// ============================================================
// PANTALLA
// ============================================================

export default function RegistroGastosFijosScreen({
    navigation,
}: any) {

    // ========================================================
    // ESTADOS
    // ========================================================

    const [nombreGasto, setNombreGasto] = useState('');

    const [montoFijo, setMontoFijo] = useState('');

    const [categoriaServicio, setCategoriaServicio] =
        useState('Luz');

    const [tipoMonto, setTipoMonto] =
        useState<TipoMonto>('variable');

    const [gastosFijosRegistrados, setGastosFijosRegistrados] =
        useState<GastoFijo[]>([]);

    const [editandoId, setEditandoId] =
        useState<string | null>(null);


    // ========================================================
    // CATEGORÍAS
    // ========================================================

    const categoriasServicios = [
        'Luz',
        'Agua',
        'Internet / Teléfono',
        'Alquiler',
        'Otro',
    ];


    // ========================================================
    // USUARIO ACTUAL
    // ========================================================

    const usuarioActual = auth.currentUser;


    // ========================================================
    // CAMBIAR CATEGORÍA
    // ========================================================

    function seleccionarCategoria(categoria: string) {

        setCategoriaServicio(categoria);

        // Luz y agua normalmente son variables
        if (
            categoria === 'Luz' ||
            categoria === 'Agua'
        ) {
            setTipoMonto('variable');
        }

        // Internet y alquiler normalmente son fijos
        if (
            categoria === 'Internet / Teléfono' ||
            categoria === 'Alquiler'
        ) {
            setTipoMonto('fijo');
        }
    }


    // ========================================================
    // CARGAR GASTOS FIJOS
    // ========================================================

    useEffect(() => {

        if (!usuarioActual) {
            return;
        }

        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        let unsubscribeGastos: (() => void) | undefined;

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

                unsubscribeGastos = onValue(
                    fijosRef,
                    (snap) => {

                        const data =
                            snap.val();

                        if (!data) {

                            setGastosFijosRegistrados([]);

                            return;
                        }

                        const lista: GastoFijo[] =
                            Object.keys(data).map(
                                (key) => ({
                                    id: key,
                                    ...data[key],
                                    tipoMonto:
                                        data[key]?.tipoMonto ||
                                        (
                                            data[key]?.categoria === 'Luz' ||
                                            data[key]?.categoria === 'Agua'
                                                ? 'variable'
                                                : 'fijo'
                                        ),
                                })
                            );

                        setGastosFijosRegistrados(
                            lista
                        );
                    }
                );

            } catch (error) {

                console.log(
                    'Error cargando gastos fijos:',
                    error
                );
            }
        };

        cargarGastosFijos();

        return () => {

            if (unsubscribeGastos) {
                unsubscribeGastos();
            }

        };

    }, [usuarioActual]);


    // ========================================================
    // LIMPIAR FORMULARIO
    // ========================================================

    function limpiarFormulario() {

        setNombreGasto('');

        setMontoFijo('');

        setCategoriaServicio('Luz');

        setTipoMonto('variable');

        setEditandoId(null);
    }


    // ========================================================
    // GUARDAR / EDITAR GASTO
    // ========================================================

    async function guardarGastoFijo() {

        const nombre =
            nombreGasto.trim();

        const montoNum =
            montoFijo.trim()
                ? parseFloat(montoFijo)
                : 0;


        // ----------------------------------------------------
        // VALIDAR NOMBRE
        // ----------------------------------------------------

        if (!nombre) {

            Alert.alert(
                'Error',
                'Por favor ingresa un nombre o descripción para el gasto.'
            );

            return;
        }


        // ----------------------------------------------------
        // VALIDAR MONTO
        // ----------------------------------------------------
        // Para variables es opcional.
        // Para fijos es obligatorio.

        if (
            tipoMonto === 'fijo' &&
            (
                isNaN(montoNum) ||
                montoNum <= 0
            )
        ) {

            Alert.alert(
                'Error',
                'Ingresa un monto mensual válido para el gasto fijo.'
            );

            return;
        }


        // ----------------------------------------------------
        // SI ES VARIABLE Y NO HAY ESTIMADO
        // ----------------------------------------------------

        if (
            tipoMonto === 'variable' &&
            montoFijo.trim() &&
            (
                isNaN(montoNum) ||
                montoNum < 0
            )
        ) {

            Alert.alert(
                'Error',
                'Ingresa un monto estimado válido.'
            );

            return;
        }


        // ----------------------------------------------------
        // VALIDAR USUARIO
        // ----------------------------------------------------

        if (!usuarioActual) {

            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );

            return;
        }


        try {

            const usuarioRef = ref(
                db,
                `usuarios/${usuarioActual.uid}`
            );

            const snapshot =
                await get(usuarioRef);

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


            // =================================================
            // EDITAR
            // =================================================

            if (editandoId) {

                const gastoRef = ref(
                    db,
                    `parejas/${idPareja}/gastosFijos/${editandoId}`
                );

                await update(
                    gastoRef,
                    {
                        nombre,
                        categoria:
                            categoriaServicio,

                        monto:
                            Number(
                                montoNum.toFixed(2)
                            ),

                        tipoMonto,

                        activo: true,

                        fechaActualizacion:
                            new Date().toISOString(),

                        usuarioEmail:
                            usuarioActual.email,

                        autor:
                            userData.nombre ||
                            usuarioActual.email ||
                            'Usuario',
                    }
                );

                Alert.alert(
                    '¡Actualizado!',
                    'El gasto fue actualizado correctamente.'
                );

                limpiarFormulario();

                return;
            }


            // =================================================
            // NUEVO GASTO
            // =================================================

            const fijosRef = ref(
                db,
                `parejas/${idPareja}/gastosFijos`
            );

            const nuevoFijoRef =
                push(fijosRef);


            const datosFijo = {

                tipo:
                    'gastoFijo',

                nombre,

                categoria:
                    categoriaServicio,

                monto:
                    Number(
                        montoNum.toFixed(2)
                    ),

                tipoMonto,

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


            await set(
                nuevoFijoRef,
                datosFijo
            );


            Alert.alert(
                '¡Éxito!',
                tipoMonto === 'variable'
                    ? 'Gasto variable configurado correctamente.'
                    : 'Gasto fijo configurado correctamente.'
            );

            limpiarFormulario();

        } catch (error: any) {

            Alert.alert(
                'Error',
                error?.message ||
                'No se pudo guardar el gasto.'
            );
        }
    }


    // ========================================================
    // EDITAR
    // ========================================================

    function editarGasto(gasto: GastoFijo) {

        setEditandoId(gasto.id);

        setNombreGasto(
            gasto.nombre || ''
        );

        setMontoFijo(
            gasto.monto
                ? String(gasto.monto)
                : ''
        );

        setCategoriaServicio(
            gasto.categoria || 'Otro'
        );

        setTipoMonto(
            gasto.tipoMonto ||
            (
                gasto.categoria === 'Luz' ||
                gasto.categoria === 'Agua'
                    ? 'variable'
                    : 'fijo'
            )
        );

        // Subir nuevamente al formulario
        setTimeout(() => {

            Alert.alert(
                'Editar gasto',
                'Modifica los datos y presiona "Actualizar Gasto".'
            );

        }, 100);
    }


    // ========================================================
    // ELIMINAR
    // ========================================================

    function eliminarGasto(gasto: GastoFijo) {

        Alert.alert(
            'Eliminar gasto',
            `¿Deseas eliminar "${gasto.nombre}"?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',

                    onPress: async () => {

                        if (!usuarioActual) {
                            return;
                        }

                        try {

                            const usuarioRef =
                                ref(
                                    db,
                                    `usuarios/${usuarioActual.uid}`
                                );

                            const snapshot =
                                await get(usuarioRef);

                            if (!snapshot.exists()) {
                                return;
                            }

                            const idPareja =
                                snapshot.val()?.idPareja;

                            if (!idPareja) {
                                return;
                            }

                            const gastoRef =
                                ref(
                                    db,
                                    `parejas/${idPareja}/gastosFijos/${gasto.id}`
                                );

                            await remove(gastoRef);

                            if (
                                editandoId ===
                                gasto.id
                            ) {
                                limpiarFormulario();
                            }

                        } catch (error: any) {

                            Alert.alert(
                                'Error',
                                error?.message ||
                                'No se pudo eliminar el gasto.'
                            );
                        }
                    },
                },
            ]
        );
    }


    // ========================================================
    // CANCELAR EDICIÓN
    // ========================================================

    function cancelarEdicion() {

        limpiarFormulario();
    }


    // ========================================================
    // INTERFAZ
    // ========================================================

    return (

        <KeyboardAvoidingView
            style={styles.rootContainer}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : 'height'
            }
        >

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* ================================================= */}
                {/* CABECERA */}
                {/* ================================================= */}

                <View style={styles.topHeader}>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() =>
                            navigation.goBack()
                        }
                    >

                        <Text
                            style={styles.backButtonText}
                        >
                            ←
                        </Text>

                    </TouchableOpacity>


                    <Text
                        style={styles.topHeaderTitle}
                    >
                        Gastos Recurrentes
                    </Text>


                    <View
                        style={{ width: 40 }}
                    />

                </View>


                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <View style={styles.heroCard}>

                    <View
                        style={styles.heroIconContainer}
                    >

                        <Text
                            style={styles.heroEmoji}
                        >
                            🔄
                        </Text>

                    </View>


                    <View
                        style={styles.heroTextContainer}
                    >

                        <Text
                            style={styles.heroTitle}
                        >
                            Gastos Recurrentes
                        </Text>

                        <Text
                            style={styles.heroSubtitle}
                        >
                            Administra servicios fijos y variables de cada mes
                        </Text>

                    </View>

                </View>


                {/* ================================================= */}
                {/* TIPO DE SERVICIO */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

                    <View style={styles.stepBadge}>

                        <Text
                            style={styles.stepBadgeText}
                        >
                            01
                        </Text>

                    </View>

                    <Text
                        style={styles.sectionTitle}
                    >
                        Tipo de Servicio
                    </Text>

                </View>


                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={
                        styles.rowCat
                    }
                >

                    {categoriasServicios.map(
                        (cat) => {

                            const isSelected =
                                categoriaServicio ===
                                cat;

                            return (

                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.catBtn,
                                        isSelected &&
                                            styles.catBtnActive,
                                    ]}
                                    onPress={() =>
                                        seleccionarCategoria(
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
                        }
                    )}

                </ScrollView>


                {/* ================================================= */}
                {/* TIPO DE MONTO */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

                    <View style={styles.stepBadge}>

                        <Text
                            style={styles.stepBadgeText}
                        >
                            02
                        </Text>

                    </View>

                    <Text
                        style={styles.sectionTitle}
                    >
                        Tipo de Monto
                    </Text>

                </View>


                <View style={styles.typeRow}>

                    {/* FIJO */}

                    <TouchableOpacity
                        style={[
                            styles.typeCard,
                            tipoMonto === 'fijo' &&
                                styles.typeCardSelected,
                        ]}
                        onPress={() =>
                            setTipoMonto('fijo')
                        }
                        activeOpacity={0.8}
                    >

                        <Text
                            style={styles.typeEmoji}
                        >
                            📌
                        </Text>

                        <View
                            style={styles.typeInfo}
                        >

                            <Text
                                style={[
                                    styles.typeTitle,
                                    tipoMonto === 'fijo' &&
                                        styles.typeTitleSelected,
                                ]}
                            >
                                Monto Fijo
                            </Text>

                            <Text
                                style={styles.typeDescription}
                            >
                                El valor normalmente no cambia
                            </Text>

                        </View>

                    </TouchableOpacity>


                    {/* VARIABLE */}

                    <TouchableOpacity
                        style={[
                            styles.typeCard,
                            tipoMonto === 'variable' &&
                                styles.typeCardSelected,
                        ]}
                        onPress={() =>
                            setTipoMonto('variable')
                        }
                        activeOpacity={0.8}
                    >

                        <Text
                            style={styles.typeEmoji}
                        >
                            📊
                        </Text>

                        <View
                            style={styles.typeInfo}
                        >

                            <Text
                                style={[
                                    styles.typeTitle,
                                    tipoMonto === 'variable' &&
                                        styles.typeTitleSelected,
                                ]}
                            >
                                Monto Variable
                            </Text>

                            <Text
                                style={styles.typeDescription}
                            >
                                Cambia según el consumo
                            </Text>

                        </View>

                    </TouchableOpacity>

                </View>


                {/* ================================================= */}
                {/* FORMULARIO */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

                    <View style={styles.stepBadge}>

                        <Text
                            style={styles.stepBadgeText}
                        >
                            03
                        </Text>

                    </View>

                    <Text
                        style={styles.sectionTitle}
                    >
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

                        {tipoMonto === 'variable'
                            ? 'Monto Estimado Mensual ($) — Opcional'
                            : 'Monto Mensual ($)'}

                    </Text>


                    <TextInput
                        style={styles.input}
                        placeholder={
                            tipoMonto === 'variable'
                                ? 'Ej. 35.00'
                                : 'Ej. 35.00'
                        }
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={montoFijo}
                        onChangeText={setMontoFijo}
                    />


                    {/* EXPLICACIÓN */}

                    <View
                        style={styles.infoBox}
                    >

                        <Ionicons
                            name={
                                tipoMonto === 'variable'
                                    ? 'information-circle-outline'
                                    : 'checkmark-circle-outline'
                            }
                            size={19}
                            color="#059669"
                        />

                        <Text
                            style={styles.infoText}
                        >

                            {tipoMonto === 'variable'
                                ? 'Este valor es solamente una referencia. Cada mes podrás registrar el valor real de la factura.'
                                : 'Este valor se utilizará como gasto recurrente mensual mientras esté activo.'}

                        </Text>

                    </View>


                    {/* BOTÓN */}

                    <TouchableOpacity
                        style={styles.btnGuardar}
                        onPress={
                            guardarGastoFijo
                        }
                        activeOpacity={0.85}
                    >

                        <Ionicons
                            name={
                                editandoId
                                    ? 'save-outline'
                                    : 'add-circle-outline'
                            }
                            size={18}
                            color="white"
                            style={{
                                marginRight: 6,
                            }}
                        />

                        <Text
                            style={
                                styles.btnGuardarText
                            }
                        >

                            {editandoId
                                ? 'Actualizar Gasto'
                                : 'Guardar Gasto'}

                        </Text>

                    </TouchableOpacity>


                    {/* CANCELAR */}

                    {editandoId && (

                        <TouchableOpacity
                            style={
                                styles.btnCancelar
                            }
                            onPress={
                                cancelarEdicion
                            }
                        >

                            <Text
                                style={
                                    styles.btnCancelarText
                                }
                            >
                                Cancelar edición
                            </Text>

                        </TouchableOpacity>

                    )}

                </View>


                {/* ================================================= */}
                {/* LISTA */}
                {/* ================================================= */}

                <View style={styles.sectionHeader}>

                    <View style={styles.stepBadge}>

                        <Text
                            style={styles.stepBadgeText}
                        >
                            04
                        </Text>

                    </View>

                    <Text
                        style={styles.sectionTitle}
                    >
                        Gastos Registrados
                    </Text>

                </View>


                {gastosFijosRegistrados.length === 0 ? (

                    <View
                        style={styles.vacioCard}
                    >

                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color="#059669"
                        />

                        <Text
                            style={styles.vacioTexto}
                        >
                            Aún no hay gastos recurrentes configurados.
                        </Text>

                    </View>

                ) : (

                    gastosFijosRegistrados.map(
                        (item) => {

                            const esVariable =
                                item.tipoMonto ===
                                'variable';


                            return (

                                <View
                                    key={item.id}
                                    style={
                                        styles.itemCard
                                    }
                                >

                                    <View
                                        style={
                                            styles.itemInfo
                                        }
                                    >

                                        <View
                                            style={
                                                styles.itemTitleRow
                                            }
                                        >

                                            <Text
                                                style={
                                                    styles.itemNombre
                                                }
                                            >
                                                {item.nombre ||
                                                    'Servicio sin nombre'}
                                            </Text>

                                            <View
                                                style={[
                                                    styles.tipoBadge,
                                                    esVariable &&
                                                        styles.tipoBadgeVariable,
                                                ]}
                                            >

                                                <Text
                                                    style={
                                                        styles.tipoBadgeText
                                                    }
                                                >
                                                    {esVariable
                                                        ? 'VARIABLE'
                                                        : 'FIJO'}
                                                </Text>

                                            </View>

                                        </View>


                                        <Text
                                            style={
                                                styles.itemCategoria
                                            }
                                        >
                                            {item.categoria ||
                                                'Otro'}
                                        </Text>


                                        <Text
                                            style={
                                                styles.itemEstado
                                            }
                                        >
                                            {item.activo === false
                                                ? 'Inactivo'
                                                : 'Activo'}
                                        </Text>

                                    </View>


                                    <View
                                        style={
                                            styles.itemRight
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.itemMonto
                                            }
                                        >

                                            {esVariable &&
                                                '~'}

                                            $
                                            {Number(
                                                item.monto || 0
                                            ).toFixed(2)}

                                        </Text>


                                        <View
                                            style={
                                                styles.actionRow
                                            }
                                        >

                                            {/* EDITAR */}

                                            <TouchableOpacity
                                                style={
                                                    styles.actionButton
                                                }
                                                onPress={() =>
                                                    editarGasto(
                                                        item
                                                    )
                                                }
                                            >

                                                <Ionicons
                                                    name="create-outline"
                                                    size={17}
                                                    color="#059669"
                                                />

                                            </TouchableOpacity>


                                            {/* ELIMINAR */}

                                            <TouchableOpacity
                                                style={[
                                                    styles.actionButton,
                                                    styles.deleteButton,
                                                ]}
                                                onPress={() =>
                                                    eliminarGasto(
                                                        item
                                                    )
                                                }
                                            >

                                                <Ionicons
                                                    name="trash-outline"
                                                    size={17}
                                                    color="#DC2626"
                                                />

                                            </TouchableOpacity>

                                        </View>

                                    </View>

                                </View>
                            );
                        }
                    )
                )}

            </ScrollView>

        </KeyboardAvoidingView>
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
        paddingTop:
            Platform.OS === 'android'
                ? 45
                : 30,
        paddingBottom: 40,
    },


    // ========================================================
    // HEADER
    // ========================================================

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
        shadowOffset: {
            width: 0,
            height: 1,
        },
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


    // ========================================================
    // HERO
    // ========================================================

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
        shadowOffset: {
            width: 0,
            height: 1,
        },
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


    // ========================================================
    // SECCIONES
    // ========================================================

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


    // ========================================================
    // CATEGORÍAS
    // ========================================================

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


    // ========================================================
    // TIPO DE MONTO
    // ========================================================

    typeRow: {
        gap: 10,
        marginBottom: 8,
    },

    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    typeCardSelected: {
        backgroundColor: '#ECFDF5',
        borderColor: '#059669',
    },

    typeEmoji: {
        fontSize: 22,
        marginRight: 13,
    },

    typeInfo: {
        flex: 1,
    },

    typeTitle: {
        color: '#1E293B',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 2,
    },

    typeTitleSelected: {
        color: '#047857',
    },

    typeDescription: {
        color: '#64748B',
        fontSize: 11,
    },


    // ========================================================
    // FORMULARIO
    // ========================================================

    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
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

    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 12,
        marginTop: 14,
    },

    infoText: {
        flex: 1,
        color: '#166534',
        fontSize: 11,
        lineHeight: 16,
        marginLeft: 8,
    },


    // ========================================================
    // BOTONES
    // ========================================================

    btnGuardar: {
        backgroundColor: '#059669',
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#059669',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },

    btnGuardarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },

    btnCancelar: {
        marginTop: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },

    btnCancelarText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },


    // ========================================================
    // ESTADO VACÍO
    // ========================================================

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
        shadowOffset: {
            width: 0,
            height: 1,
        },
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


    // ========================================================
    // ITEMS
    // ========================================================

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
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },

    itemInfo: {
        flex: 1,
        paddingRight: 8,
    },

    itemTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },

    itemNombre: {
        color: '#1E293B',
        fontWeight: 'bold',
        fontSize: 14,
    },

    itemCategoria: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 4,
    },

    itemEstado: {
        color: '#059669',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
    },

    itemRight: {
        alignItems: 'flex-end',
    },

    itemMonto: {
        color: '#047857',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },


    // ========================================================
    // BADGE TIPO
    // ========================================================

    tipoBadge: {
        backgroundColor: '#DCFCE7',
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 3,
    },

    tipoBadgeVariable: {
        backgroundColor: '#FEF3C7',
    },

    tipoBadgeText: {
        color: '#047857',
        fontSize: 8,
        fontWeight: 'bold',
    },


    // ========================================================
    // ACCIONES
    // ========================================================

    actionRow: {
        flexDirection: 'row',
        gap: 6,
    },

    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
    },

    deleteButton: {
        backgroundColor: '#FEF2F2',
    },

});