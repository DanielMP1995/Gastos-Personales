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

import { useTheme } from '../../context/ThemeContext';


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
    // TEMA
    // ========================================================

    const {
        colors,
    } = useTheme();


    // ========================================================
    // ESTADOS
    // ========================================================

    const [nombreGasto, setNombreGasto] =
        useState('');

    const [montoFijo, setMontoFijo] =
        useState('');

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

    function seleccionarCategoria(
        categoria: string
    ) {

        setCategoriaServicio(categoria);

        if (
            categoria === 'Luz' ||
            categoria === 'Agua'
        ) {

            setTipoMonto('variable');

        }

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

        let unsubscribeGastos:
            (() => void) | undefined;


        const cargarGastosFijos =
            async () => {

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


                    const fijosRef =
                        ref(
                            db,
                            `parejas/${idPareja}/gastosFijos`
                        );


                    unsubscribeGastos =
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


                                const lista:
                                    GastoFijo[] =
                                    Object.keys(data).map(
                                        (key) => ({
                                            id: key,
                                            ...data[key],

                                            tipoMonto:
                                                data[key]
                                                    ?.tipoMonto ||
                                                (
                                                    data[key]
                                                        ?.categoria ===
                                                        'Luz' ||
                                                    data[key]
                                                        ?.categoria ===
                                                        'Agua'
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
        // VALIDAR MONTO FIJO
        // ----------------------------------------------------

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
        // VALIDAR MONTO VARIABLE
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

            const usuarioRef =
                ref(
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

                const gastoRef =
                    ref(
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

                        activo:
                            true,

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

            const fijosRef =
                ref(
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

    function editarGasto(
        gasto: GastoFijo
    ) {

        setEditandoId(
            gasto.id
        );


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

    function eliminarGasto(
        gasto: GastoFijo
    ) {

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

                    onPress:
                        async () => {

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
                                    await get(
                                        usuarioRef
                                    );


                                if (
                                    !snapshot.exists()
                                ) {
                                    return;
                                }


                                const idPareja =
                                    snapshot.val()
                                        ?.idPareja;


                                if (!idPareja) {
                                    return;
                                }


                                const gastoRef =
                                    ref(
                                        db,
                                        `parejas/${idPareja}/gastosFijos/${gasto.id}`
                                    );


                                await remove(
                                    gastoRef
                                );


                                if (
                                    editandoId ===
                                    gasto.id
                                ) {

                                    limpiarFormulario();

                                }

                            } catch (
                                error: any
                            ) {

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
            style={[
                styles.rootContainer,
                {
                    backgroundColor:
                        colors.veryLight,
                },
            ]}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : 'height'
            }
        >

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
                {/* CABECERA */}
                {/* ================================================= */}

                <View
                    style={[
                        styles.topHeader,
                        {
                            backgroundColor:
                                colors.primary,
                        },
                    ]}
                >

                    <TouchableOpacity
                        style={[
                            styles.backButton,
                            {
                                backgroundColor:
                                    'rgba(255,255,255,0.15)',

                                borderColor:
                                    'rgba(255,255,255,0.20)',
                            },
                        ]}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={0.8}
                    >

                        <Ionicons
                            name="arrow-back"
                            size={22}
                            color="#FFFFFF"
                        />

                    </TouchableOpacity>


                    <Text
                        style={
                            styles.topHeaderTitle
                        }
                    >
                        Gastos Recurrentes
                    </Text>


                    <View
                        style={{
                            width: 40,
                        }}
                    />

                </View>


                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <View
                    style={[
                        styles.heroCard,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <View
                        style={[
                            styles.heroIconContainer,
                            {
                                backgroundColor:
                                    colors.veryLight,
                            },
                        ]}
                    >

                        <Text
                            style={
                                styles.heroEmoji
                            }
                        >
                            🔄
                        </Text>

                    </View>


                    <View
                        style={
                            styles.heroTextContainer
                        }
                    >

                        <Text
                            style={[
                                styles.heroTitle,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >
                            Gastos Recurrentes
                        </Text>


                        <Text
                            style={
                                styles.heroSubtitle
                            }
                        >
                            Administra servicios fijos y variables de cada mes
                        </Text>

                    </View>

                </View>


                {/* ================================================= */}
                {/* TIPO DE SERVICIO */}
                {/* ================================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={[
                            styles.stepBadge,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                    >

                        <Text
                            style={
                                styles.stepBadgeText
                            }
                        >
                            01
                        </Text>

                    </View>


                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Tipo de Servicio
                    </Text>

                </View>


                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                        false
                    }
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

                                        isSelected && {
                                            backgroundColor:
                                                colors.veryLight,

                                            borderColor:
                                                colors.primary,
                                        },
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

                                            isSelected && {
                                                color:
                                                    colors.primary,

                                                fontWeight:
                                                    'bold',
                                            },
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

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={[
                            styles.stepBadge,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                    >

                        <Text
                            style={
                                styles.stepBadgeText
                            }
                        >
                            02
                        </Text>

                    </View>


                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Tipo de Monto
                    </Text>

                </View>


                <View
                    style={
                        styles.typeRow
                    }
                >

                    {/* ================================================= */}
                    {/* FIJO */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={[
                            styles.typeCard,

                            tipoMonto === 'fijo' && {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.primary,
                            },
                        ]}
                        onPress={() =>
                            setTipoMonto('fijo')
                        }
                        activeOpacity={0.8}
                    >

                        <Text
                            style={
                                styles.typeEmoji
                            }
                        >
                            📌
                        </Text>


                        <View
                            style={
                                styles.typeInfo
                            }
                        >

                            <Text
                                style={[
                                    styles.typeTitle,

                                    tipoMonto === 'fijo' && {
                                        color:
                                            colors.primary,
                                    },
                                ]}
                            >
                                Monto Fijo
                            </Text>


                            <Text
                                style={
                                    styles.typeDescription
                                }
                            >
                                El valor normalmente no cambia
                            </Text>

                        </View>

                    </TouchableOpacity>


                    {/* ================================================= */}
                    {/* VARIABLE */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={[
                            styles.typeCard,

                            tipoMonto === 'variable' && {
                                backgroundColor:
                                    colors.veryLight,

                                borderColor:
                                    colors.primary,
                            },
                        ]}
                        onPress={() =>
                            setTipoMonto('variable')
                        }
                        activeOpacity={0.8}
                    >

                        <Text
                            style={
                                styles.typeEmoji
                            }
                        >
                            📊
                        </Text>


                        <View
                            style={
                                styles.typeInfo
                            }
                        >

                            <Text
                                style={[
                                    styles.typeTitle,

                                    tipoMonto === 'variable' && {
                                        color:
                                            colors.primary,
                                    },
                                ]}
                            >
                                Monto Variable
                            </Text>


                            <Text
                                style={
                                    styles.typeDescription
                                }
                            >
                                Cambia según el consumo
                            </Text>

                        </View>

                    </TouchableOpacity>

                </View>


                {/* ================================================= */}
                {/* FORMULARIO */}
                {/* ================================================= */}

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={[
                            styles.stepBadge,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                    >

                        <Text
                            style={
                                styles.stepBadgeText
                            }
                        >
                            03
                        </Text>

                    </View>


                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Detalles del Gasto
                    </Text>

                </View>


                <View
                    style={[
                        styles.formCard,
                        {
                            borderColor:
                                colors.light,
                        },
                    ]}
                >

                    <Text
                        style={
                            styles.label
                        }
                    >
                        Nombre / Identificador
                    </Text>


                    <TextInput
                        style={
                            styles.input
                        }
                        placeholder="Ej. Luz de casa / Plan de Claro"
                        placeholderTextColor="#94A3B8"
                        value={
                            nombreGasto
                        }
                        onChangeText={
                            setNombreGasto
                        }
                    />


                    <Text
                        style={
                            styles.label
                        }
                    >

                        {tipoMonto === 'variable'
                            ? 'Monto Estimado Mensual ($) — Opcional'
                            : 'Monto Mensual ($)'}

                    </Text>


                    <TextInput
                        style={
                            styles.input
                        }
                        placeholder="Ej. 35.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={
                            montoFijo
                        }
                        onChangeText={
                            setMontoFijo
                        }
                    />


                    {/* ================================================= */}
                    {/* EXPLICACIÓN */}
                    {/* ================================================= */}

                    <View
                        style={[
                            styles.infoBox,
                            {
                                backgroundColor:
                                    colors.veryLight,
                            },
                        ]}
                    >

                        <Ionicons
                            name={
                                tipoMonto === 'variable'
                                    ? 'information-circle-outline'
                                    : 'checkmark-circle-outline'
                            }
                            size={19}
                            color={
                                colors.primary
                            }
                        />


                        <Text
                            style={[
                                styles.infoText,
                                {
                                    color:
                                        colors.dark,
                                },
                            ]}
                        >

                            {tipoMonto === 'variable'
                                ? 'Este valor es solamente una referencia. Cada mes podrás registrar el valor real de la factura.'
                                : 'Este valor se utilizará como gasto recurrente mensual mientras esté activo.'}

                        </Text>

                    </View>


                    {/* ================================================= */}
                    {/* BOTÓN GUARDAR */}
                    {/* ================================================= */}

                    <TouchableOpacity
                        style={[
                            styles.btnGuardar,
                            {
                                backgroundColor:
                                    colors.primary,

                                shadowColor:
                                    colors.primary,
                            },
                        ]}
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
                            color="#FFFFFF"
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


                    {/* ================================================= */}
                    {/* CANCELAR */}
                    {/* ================================================= */}

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

                <View
                    style={
                        styles.sectionHeader
                    }
                >

                    <View
                        style={[
                            styles.stepBadge,
                            {
                                backgroundColor:
                                    colors.primary,
                            },
                        ]}
                    >

                        <Text
                            style={
                                styles.stepBadgeText
                            }
                        >
                            04
                        </Text>

                    </View>


                    <Text
                        style={[
                            styles.sectionTitle,
                            {
                                color:
                                    colors.dark,
                            },
                        ]}
                    >
                        Gastos Registrados
                    </Text>

                </View>


                {gastosFijosRegistrados.length === 0 ? (

                    <View
                        style={[
                            styles.vacioCard,
                            {
                                borderColor:
                                    colors.light,
                            },
                        ]}
                    >

                        <Ionicons
                            name="information-circle-outline"
                            size={22}
                            color={
                                colors.primary
                            }
                        />


                        <Text
                            style={
                                styles.vacioTexto
                            }
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
                                    style={[
                                        styles.itemCard,
                                        {
                                            borderColor:
                                                colors.light,
                                        },
                                    ]}
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
                                                style={[
                                                    styles.itemNombre,
                                                    {
                                                        color:
                                                            colors.dark,
                                                    },
                                                ]}
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
                                            style={[
                                                styles.itemEstado,
                                                {
                                                    color:
                                                        colors.primary,
                                                },
                                            ]}
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
                                            style={[
                                                styles.itemMonto,
                                                {
                                                    color:
                                                        colors.primary,
                                                },
                                            ]}
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
                                                style={[
                                                    styles.actionButton,
                                                    {
                                                        backgroundColor:
                                                            colors.veryLight,
                                                    },
                                                ]}
                                                onPress={() =>
                                                    editarGasto(
                                                        item
                                                    )
                                                }
                                            >

                                                <Ionicons
                                                    name="create-outline"
                                                    size={17}
                                                    color={
                                                        colors.primary
                                                    }
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
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 16,
    },


    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },


    topHeaderTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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


    catText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '500',
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
        borderRadius: 12,
        padding: 12,
        marginTop: 14,
    },


    infoText: {
        flex: 1,
        fontSize: 11,
        lineHeight: 16,
        marginLeft: 8,
    },


    // ========================================================
    // BOTONES
    // ========================================================

    btnGuardar: {
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
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
        fontWeight: 'bold',
        fontSize: 14,
    },


    itemCategoria: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 4,
    },


    itemEstado: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 3,
    },


    itemRight: {
        alignItems: 'flex-end',
    },


    itemMonto: {
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
        justifyContent: 'center',
        alignItems: 'center',
    },


    deleteButton: {
        backgroundColor: '#FEF2F2',
    },

});