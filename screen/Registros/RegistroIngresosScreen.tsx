import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, push, set, get } from 'firebase/database';

export default function RegistroIngresosScreen({ navigation }: any) {
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });
    }, [navigation]);

    function guardarIngreso() {
        // 1. Validar que los campos no estén vacíos
        if (!monto || !descripcion) {
            Alert.alert("Error", "Por favor ingresa un monto y una descripción.");
            return;
        }

        // 2. Obtener el usuario actual
        const usuarioActual = auth.currentUser;
        if (!usuarioActual) {
            Alert.alert("Error", "No hay un usuario logueado.");
            return;
        }

        // 3. Consultar primero el idPareja del usuario actual en la base de datos
        const usuarioRef = ref(db, `usuarios/${usuarioActual.uid}`);
        get(usuarioRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const idPareja = userData.idPareja;
                const nombreUsuario = userData.nombre;

                if (!idPareja) {
                    Alert.alert("Error", "No tienes un código de pareja asignado.");
                    return;
                }

                // 4. Crear la referencia en la base de datos bajo el nodo de la PAREJA compartida
                const ingresosRef = ref(db, `parejas/${idPareja}/ingresos`);
                const nuevoIngresoRef = push(ingresosRef);

                // 5. Construir el objeto de datos a guardar
                const datosIngreso = {
                    tipo: 'ingreso',
                    monto: parseFloat(monto),
                    descripcion: descripcion,
                    fecha: new Date().toISOString(),
                    usuarioEmail: usuarioActual.email,
                    usuarioId: usuarioActual.uid,
                    autor: nombreUsuario
                };

                // 6. Guardar en Firebase
                set(nuevoIngresoRef, datosIngreso)
                    .then(() => {
                        Alert.alert("¡Éxito!", "Ingreso registrado y compartido correctamente.");
                        setMonto('');
                        setDescripcion('');
                        navigation.goBack();
                    })
                    .catch((error) => {
                        Alert.alert("Error al guardar", error.message);
                    });

            } else {
                Alert.alert("Error", "No se encontraron los datos de tu perfil.");
            }
        }).catch((error) => {
            Alert.alert("Error de conexión", "Hubo un problema al obtener tu información: " + error.message);
        });
    }

    return (
        <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            {/* ENCABEZADO */}
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>$</Text>
                </View>

                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerSmall}>
                        MOVIMIENTO FINANCIERO
                    </Text>

                    <Text style={styles.titulo}>
                        Registrar Ingreso
                    </Text>
                </View>
            </View>

            <Text style={styles.subtitulo}>
                Añade un nuevo ingreso al fondo común
            </Text>

            {/* FORMULARIO */}
            <View style={styles.formContainer}>

                {/* MONTO */}
                <View style={styles.labelContainer}>
                    <View style={styles.labelIcon}>
                        <Text style={styles.labelIconText}>$</Text>
                    </View>

                    <Text style={styles.label}>
                        Monto del Ingreso
                    </Text>
                </View>

                <View style={styles.inputWrapper}>
                    <Text style={styles.currency}>
                        $
                    </Text>

                    <TextInput
                        style={styles.inputMonto}
                        placeholder="0.00"
                        placeholderTextColor="#475569"
                        keyboardType="numeric"
                        value={monto}
                        onChangeText={setMonto}
                    />
                </View>

                {/* DESCRIPCIÓN */}
                <View style={styles.labelContainer}>
                    <View style={styles.labelIcon}>
                        <Text style={styles.labelIconText}>≡</Text>
                    </View>

                    <Text style={styles.label}>
                        Descripción o Motivo
                    </Text>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Ej. Pago de quincena, Venta, etc."
                    placeholderTextColor="#475569"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                />

                {/* INFORMACIÓN */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>
                        ⓘ
                    </Text>

                    <Text style={styles.infoText}>
                        Este ingreso será compartido automáticamente
                        con tu pareja.
                    </Text>
                </View>

                {/* GUARDAR */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={guardarIngreso}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonIcon}>
                        ✓
                    </Text>

                    <Text style={styles.primaryButtonText}>
                        Guardar Ingreso
                    </Text>
                </TouchableOpacity>

                {/* CANCELAR */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>
                        Cancelar
                    </Text>
                </TouchableOpacity>

            </View>

            <Text style={styles.footerText}>
                Finanzas en Pareja
            </Text>

        </ScrollView>
    )
}

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
        marginBottom: 10,
    },

    headerIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: '#059669',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 13,
        shadowColor: '#10B981',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },

    headerIconText: {
        color: '#FFFFFF',
        fontSize: 27,
        fontWeight: '900',
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
        fontSize: 25,
        fontWeight: '800',
    },

    subtitulo: {
        color: '#64748B',
        fontSize: 13,
        marginBottom: 25,
        marginLeft: 65,
    },

    /* FORMULARIO */

    formContainer: {
        backgroundColor: '#111C2E',
        borderRadius: 20,
        padding: 19,
        borderWidth: 1,
        borderColor: '#1E3350',
    },

    /* LABELS */

    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
        marginTop: 4,
    },

    labelIcon: {
        width: 28,
        height: 28,
        borderRadius: 9,
        backgroundColor: '#102F2B',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 9,
    },

    labelIconText: {
        color: '#34D399',
        fontSize: 15,
        fontWeight: '900',
    },

    label: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '700',
    },

    /* MONTO */

    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0A1322',
        borderWidth: 1,
        borderColor: '#1F4052',
        borderRadius: 13,
        marginBottom: 20,
        paddingHorizontal: 14,
    },

    currency: {
        color: '#10B981',
        fontSize: 25,
        fontWeight: '800',
        marginRight: 5,
    },

    inputMonto: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '700',
        paddingVertical: 15,
    },

    /* DESCRIPCIÓN */

    input: {
        backgroundColor: '#0A1322',
        borderWidth: 1,
        borderColor: '#22334A',
        borderRadius: 13,
        paddingHorizontal: 14,
        paddingVertical: 14,
        color: '#F8FAFC',
        fontSize: 15,
        marginBottom: 15,
        minHeight: 52,
    },

    /* INFORMACIÓN */

    infoBox: {
        backgroundColor: '#0D2523',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#164E46',
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
        marginBottom: 5,
    },

    infoIcon: {
        color: '#34D399',
        fontSize: 18,
        marginRight: 9,
    },

    infoText: {
        color: '#6EE7B7',
        fontSize: 11,
        lineHeight: 17,
        flex: 1,
    },

    /* BOTÓN PRINCIPAL */

    primaryButton: {
        backgroundColor: '#059669',
        marginTop: 20,
        borderRadius: 13,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#10B981',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 7,
        elevation: 4,
    },

    primaryButtonIcon: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
        marginRight: 8,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    /* CANCELAR */

    secondaryButton: {
        backgroundColor: '#182436',
        marginTop: 11,
        borderRadius: 13,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#293B52',
    },

    secondaryButtonText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '700',
    },

    /* FOOTER */

    footerText: {
        color: '#334155',
        fontSize: 11,
        textAlign: 'center',
        marginTop: 25,
    },
});