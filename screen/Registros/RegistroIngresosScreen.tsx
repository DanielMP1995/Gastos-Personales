import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth, db } from '../../firebase/FirebaseConfig'; // Importamos tu configuración
import { ref, push, set, get } from 'firebase/database'; // Agregamos 'get' para leer el código de pareja

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
                const nombreUsuario = userData.nombre; // Tomamos el nombre real del perfil

                if (!idPareja) {
                    Alert.alert("Error", "No tienes un código de pareja asignado.");
                    return;
                }

                // 4. Crear la referencia en la base de datos bajo el nodo de la PAREJA compartida
                // Guardamos en la ruta: parejas -> [CÓDIGO] -> ingresos
                const ingresosRef = ref(db, `parejas/${idPareja}/ingresos`);
                const nuevoIngresoRef = push(ingresosRef); // Genera un ID único automático

                // 5. Construir el objeto de datos a guardar
                const datosIngreso = {
                    tipo: 'ingreso',
                    monto: parseFloat(monto), // Convertimos el texto a número decimal
                    descripcion: descripcion,
                    fecha: new Date().toISOString(), // Guardamos la fecha y hora exacta
                    usuarioEmail: usuarioActual.email,
                    usuarioId: usuarioActual.uid,
                    autor: nombreUsuario // Usamos el nombre real en lugar del chequeo de correo
                };

                // 6. Guardar en Firebase
                set(nuevoIngresoRef, datosIngreso)
                    .then(() => {
                        Alert.alert("¡Éxito!", "Ingreso registrado y compartido correctamente.");
                        setMonto(''); // Limpiamos el formulario
                        setDescripcion('');
                        navigation.goBack(); // Volvemos a la pantalla anterior
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
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>Registrar Ingreso</Text>
            <Text style={styles.subtitulo}>Añade un nuevo ingreso al fondo común</Text>

            <View style={styles.formContainer}>
                <Text style={styles.label}>Monto del Ingreso ($)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. 1500.00"
                    placeholderTextColor="#64748B"
                    keyboardType="numeric" // Teclado numérico
                    value={monto}
                    onChangeText={setMonto}
                />

                <Text style={styles.label}>Descripción o Motivo</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Pago de quincena, Venta, etc."
                    placeholderTextColor="#64748B"
                    value={descripcion}
                    onChangeText={setDescripcion}
                />

                <TouchableOpacity style={styles.primaryButton} onPress={guardarIngreso}>
                    <Text style={styles.primaryButtonText}>Guardar Ingreso</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A', // Fondo oscuro
    },
    container: {
        paddingHorizontal: 30,
        paddingTop: 50,
        paddingBottom: 40,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#10B981', // Verde para indicar ingresos
        marginBottom: 8,
    },
    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 30,
    },
    formContainer: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    label: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        padding: 14,
        color: '#F8FAFC',
        fontSize: 16,
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: '#10B981', // Botón verde corporativo para ingresos
        marginTop: 20,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        marginTop: 12,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#64748B',
    },
    secondaryButtonText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    }
})