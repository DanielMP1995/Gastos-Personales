import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    TextInput,
} from 'react-native';

import React, { useState } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    push,
    set,
    get,
} from 'firebase/database';

export default function RegistroGastosRapidos({
    navigation,
}: any) {

    // ============================================================
    // ESTADOS
    // ============================================================

    const [monto, setMonto] =
        useState('');

    const [motivo, setMotivo] =
        useState('');

    const [categoria, setCategoria] =
        useState('Tienda');

    // ============================================================
    // CATEGORÍAS
    // ============================================================

    const categorias = [
        'Tienda',
        'Farmacia',
        'Comida',
        'Transporte',
    ];

    // ============================================================
    // GUARDAR GASTO
    // ============================================================

    function guardarGasto() {

        // --------------------------------------------------------
        // VALIDAR MONTO
        // --------------------------------------------------------

        const montoNum =
            parseFloat(monto);

        if (
            !monto ||
            isNaN(montoNum) ||
            montoNum <= 0
        ) {

            Alert.alert(
                'Error',
                'Por favor ingresa o selecciona un monto válido.'
            );

            return;
        }

        // --------------------------------------------------------
        // USUARIO
        // --------------------------------------------------------

        const usuarioActual =
            auth.currentUser;

        if (!usuarioActual) {

            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );

            return;
        }

        // --------------------------------------------------------
        // OBTENER DATOS DEL USUARIO
        // --------------------------------------------------------

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

                // ------------------------------------------------
                // VALIDAR PAREJA
                // ------------------------------------------------

                if (!idPareja) {

                    Alert.alert(
                        'Error',
                        'No tienes una pareja vinculada.'
                    );

                    return;
                }

                // ------------------------------------------------
                // REFERENCIA DE MOVIMIENTOS
                // ------------------------------------------------

                const gastosRef = ref(
                    db,
                    `parejas/${idPareja}/movimientos`
                );

                const nuevoGastoRef =
                    push(gastosRef);

                // ------------------------------------------------
                // DESCRIPCIÓN
                // ------------------------------------------------

                const motivoLimpio =
                    motivo.trim();

                const descripcionFinal =
                    motivoLimpio
                        ? `${categoria} - ${motivoLimpio}`
                        : `Gasto rápido: ${categoria}`;

                // ------------------------------------------------
                // DATOS DEL GASTO
                // ------------------------------------------------

                const datosGasto = {

                    // Identificador del movimiento
                    tipo:
                        'gasto',

                    // Categoría
                    categoria:
                        categoria,

                    // Monto
                    monto:
                        Number(
                            montoNum.toFixed(2)
                        ),

                    // Descripción
                    descripcion:
                        descripcionFinal,

                    // Fecha
                    fecha:
                        new Date().toISOString(),

                    // Usuario
                    usuarioEmail:
                        usuarioActual.email,

                    // Autor
                    autor:
                        userData.nombre ||
                        usuarioActual.email ||
                        'Usuario',

                    // Indica que viene del formulario
                    origen:
                        'gastoRapido',
                };

                // ------------------------------------------------
                // GUARDAR EN FIREBASE
                // ------------------------------------------------

                set(
                    nuevoGastoRef,
                    datosGasto
                )
                    .then(() => {

                        Alert.alert(
                            '¡Éxito!',
                            `Gasto de $${montoNum.toFixed(
                                2
                            )} registrado correctamente.`
                        );

                        // Limpiar
                        setMonto('');
                        setMotivo('');

                        // Volver
                        navigation.goBack();

                    })
                    .catch((error) => {

                        Alert.alert(
                            'Error',
                            error?.message ||
                                'No se pudo registrar el gasto.'
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

        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={
                styles.container
            }
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
        >

            {/* ================================================== */}
            {/* TÍTULO */}
            {/* ================================================== */}

            <Text style={styles.titulo}>
                ⚡ Gasto Rápido
            </Text>

            <Text style={styles.subtitulo}>
                Registra rápidamente tus gastos del día.
            </Text>

            {/* ================================================== */}
            {/* CATEGORÍA */}
            {/* ================================================== */}

            <Text style={styles.label}>
                Categoría:
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                    styles.row
                }
            >

                {categorias.map(
                    (cat) => (

                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.catBtn,
                                categoria ===
                                    cat &&
                                    styles.catActive,
                            ]}
                            onPress={() =>
                                setCategoria(
                                    cat
                                )
                            }
                        >

                            <Text
                                style={
                                    categoria ===
                                        cat
                                        ? styles.catTextActive
                                        : styles.catText
                                }
                            >
                                {cat}
                            </Text>

                        </TouchableOpacity>

                    )
                )}

            </ScrollView>

            {/* ================================================== */}
            {/* MONTO */}
            {/* ================================================== */}

            <Text style={styles.label}>
                Monto ($):
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={
                    styles.row
                }
            >

                {[
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                    7,
                    8,
                    9,
                    10,
                ].map(
                    (val) => (

                        <TouchableOpacity
                            key={val}
                            style={[
                                styles.montoBtn,
                                monto ===
                                    val.toString() &&
                                    styles.montoActive,
                            ]}
                            onPress={() =>
                                setMonto(
                                    val.toString()
                                )
                            }
                        >

                            <Text
                                style={[
                                    styles.montoText,
                                    monto ===
                                        val.toString() &&
                                        styles.montoTextActive,
                                ]}
                            >
                                ${val}
                            </Text>

                        </TouchableOpacity>

                    )
                )}

            </ScrollView>

            {/* ================================================== */}
            {/* MONTO PERSONALIZADO */}
            {/* ================================================== */}

            <TextInput
                style={styles.input}
                placeholder="O escribe otro valor..."
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={monto}
                onChangeText={
                    setMonto
                }
            />

            {/* ================================================== */}
            {/* MOTIVO */}
            {/* ================================================== */}

            <Text style={styles.label}>
                Motivo / Descripción (Opcional):
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Ej. Pan y leche"
                placeholderTextColor="#64748B"
                value={motivo}
                onChangeText={
                    setMotivo
                }
            />

            {/* ================================================== */}
            {/* RESUMEN */}
            {/* ================================================== */}

            {parseFloat(monto) > 0 && (

                <View
                    style={
                        styles.resumenCard
                    }
                >

                    <Text
                        style={
                            styles.resumenTitulo
                        }
                    >
                        Resumen del gasto
                    </Text>

                    <View
                        style={
                            styles.resumenFila
                        }
                    >

                        <Text
                            style={
                                styles.resumenLabel
                            }
                        >
                            Categoría
                        </Text>

                        <Text
                            style={
                                styles.resumenValor
                            }
                        >
                            {categoria}
                        </Text>

                    </View>

                    <View
                        style={
                            styles.resumenFila
                        }
                    >

                        <Text
                            style={
                                styles.resumenLabel
                            }
                        >
                            Monto
                        </Text>

                        <Text
                            style={
                                styles.resumenMonto
                            }
                        >
                            $
                            {parseFloat(
                                monto
                            ).toFixed(2)}
                        </Text>

                    </View>

                    {motivo.trim() !== '' && (

                        <View
                            style={
                                styles.resumenFila
                            }
                        >

                            <Text
                                style={
                                    styles.resumenLabel
                                }
                            >
                                Motivo
                            </Text>

                            <Text
                                style={
                                    styles.resumenValor
                                }
                            >
                                {motivo.trim()}
                            </Text>

                        </View>

                    )}

                </View>

            )}

            {/* ================================================== */}
            {/* GUARDAR */}
            {/* ================================================== */}

            <TouchableOpacity
                style={
                    styles.btnGuardar
                }
                onPress={
                    guardarGasto
                }
            >

                <Ionicons
                    name="save-outline"
                    size={19}
                    color="#FFFFFF"
                    style={{
                        marginRight: 7,
                    }}
                />

                <Text
                    style={
                        styles.btnGuardarText
                    }
                >
                    Registrar Gasto
                </Text>

            </TouchableOpacity>

            {/* ================================================== */}
            {/* CANCELAR */}
            {/* ================================================== */}

            <TouchableOpacity
                style={
                    styles.btnVolver
                }
                onPress={() =>
                    navigation.goBack()
                }
            >

                <Text
                    style={
                        styles.btnVolverText
                    }
                >
                    Cancelar
                </Text>

            </TouchableOpacity>

        </ScrollView>
    );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },

    container: {
        padding: 25,
        paddingTop: 30,
        paddingBottom: 60,
    },

    titulo: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 5,
    },

    subtitulo: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 20,
    },

    label: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 10,
    },

    row: {
        flexDirection: 'row',
        marginBottom: 10,
        paddingRight: 10,
    },

    catBtn: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },

    catActive: {
        backgroundColor: '#38BDF8',
        borderColor: '#38BDF8',
    },

    catText: {
        color: '#F8FAFC',
        fontSize: 13,
    },

    catTextActive: {
        color: '#0F172A',
        fontWeight: 'bold',
        fontSize: 13,
    },

    montoBtn: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#334155',
    },

    montoActive: {
        backgroundColor: '#EA580C',
        borderColor: '#EA580C',
    },

    montoText: {
        color: '#38BDF8',
        fontWeight: 'bold',
        fontSize: 14,
    },

    montoTextActive: {
        color: '#FFFFFF',
    },

    input: {
        backgroundColor: '#1E293B',
        borderRadius: 10,
        padding: 13,
        color: '#F8FAFC',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#334155',
        fontSize: 14,
    },

    resumenCard: {
        backgroundColor: '#1E293B',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        padding: 15,
        marginTop: 8,
        marginBottom: 5,
    },

    resumenTitulo: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 10,
    },

    resumenFila: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },

    resumenLabel: {
        color: '#94A3B8',
        fontSize: 13,
    },

    resumenValor: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
        maxWidth: '60%',
        textAlign: 'right',
    },

    resumenMonto: {
        color: '#38BDF8',
        fontSize: 18,
        fontWeight: '800',
    },

    btnGuardar: {
        backgroundColor: '#EA580C',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 20,
    },

    btnGuardarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },

    btnVolver: {
        padding: 16,
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#1E293B',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
    },

    btnVolverText: {
        color: '#94A3B8',
        fontWeight: '600',
        fontSize: 14,
    },
});