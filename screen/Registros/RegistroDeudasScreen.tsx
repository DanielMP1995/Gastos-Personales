import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth, db } from '../../firebase/FirebaseConfig'
import { ref, push, set, onValue } from 'firebase/database'

export default function RegistroDeudasScreen({ navigation }: any) {
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
    const [subEntidad, setSubEntidad] = useState(''); 
    const [marcaTarjeta, setMarcaTarjeta] = useState(''); 
    const [monto, setMonto] = useState('');
    const [cuotaPagar, setCuotaPagar] = useState(''); 
    const [fechaMaxPago, setFechaMaxPago] = useState('');
    const [fechaCaducidad, setFechaCaducidad] = useState('');
    
    // Estado para la lógica de parejas
    const [idPareja, setIdPareja] = useState<string | null>(null);

    useEffect(() => {
        navigation.setOptions({ headerShown: false });

        const usuarioActual = auth.currentUser;
        if (usuarioActual) {
            const userRef = ref(db, `usuarios/${usuarioActual.uid}`);
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.idPareja) {
                    setIdPareja(data.idPareja);
                }
            }, { onlyOnce: true });
        }
    }, [navigation]);

    function guardarDeuda() {
        if (!idPareja) {
            Alert.alert("Atención", "No se encontró el código de pareja configurado.");
            return;
        }
        if (!categoriaSeleccionada) {
            Alert.alert("Atención", "Por favor selecciona un tipo de deuda.");
            return;
        }
        if (!subEntidad || !monto) {
            Alert.alert("Atención", "Debes completar al menos la entidad/banco y el monto de la deuda.");
            return;
        }

        const usuarioActual = auth.currentUser;
        if (!usuarioActual) {
            Alert.alert("Error", "No hay un usuario logueado.");
            return;
        }

        // Guardar dentro del nodo de la pareja correspondiente
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaDeudaRef = push(deudasRef);

        const datosDeuda = {
            tipo: 'deuda',
            categoria: categoriaSeleccionada,
            entidad: subEntidad, 
            marcaTarjeta: categoriaSeleccionada === 'Tarjeta de Crédito' ? marcaTarjeta : 'N/A',
            monto: parseFloat(monto),
            cuotaPagar: parseFloat(cuotaPagar) || 0,
            fechaMaxPago: fechaMaxPago || 'N/A',
            fechaCaducidad: categoriaSeleccionada === 'Tarjeta de Crédito' ? (fechaCaducidad || 'N/A') : 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: usuarioActual.email?.toLowerCase().includes('daniela') ? 'Daniela' : 'Daniel'
        };

        set(nuevaDeudaRef, datosDeuda)
            .then(() => {
                Alert.alert("¡Éxito!", "Deuda registrada correctamente en el sistema de pareja.");
                navigation.goBack();
            })
            .catch((error) => {
                Alert.alert("Error", error.message);
            });
    }

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>Registro de Deudas</Text>
            <Text style={styles.subtitulo}>Controla tus compromisos y obligaciones financieras</Text>

            {/* SECCIÓN 1: SELECCIONAR TIPO DE DEUDA */}
            <Text style={styles.labelSection}>1. Selecciona el tipo de deuda:</Text>
            <View style={styles.gridCategorias}>
                <TouchableOpacity 
                    style={[styles.catCard, categoriaSeleccionada === 'Tarjeta de Crédito' && styles.catSelected]}
                    onPress={() => { setCategoriaSeleccionada('Tarjeta de Crédito'); setSubEntidad(''); setMarcaTarjeta(''); }}
                >
                    <Text style={styles.catText}>💳 Tarjeta de Crédito</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.catCard, categoriaSeleccionada === 'Préstamo Bancario' && styles.catSelected]}
                    onPress={() => { setCategoriaSeleccionada('Préstamo Bancario'); setSubEntidad(''); }}
                >
                    <Text style={styles.catText}>🏦 Préstamos</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.catCard, categoriaSeleccionada === 'Casa Comercial' && styles.catSelected]}
                    onPress={() => { setCategoriaSeleccionada('Casa Comercial'); setSubEntidad(''); }}
                >
                    <Text style={styles.catText}>🏬 Casas Comerciales</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.catCard, categoriaSeleccionada === 'Operadora Celular' && styles.catSelected]}
                    onPress={() => { setCategoriaSeleccionada('Operadora Celular'); setSubEntidad(''); }}
                >
                    <Text style={styles.catText}>📱 Planes Celular</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.catCardWide, categoriaSeleccionada === 'Deuda Familiar' && styles.catSelected]}
                    onPress={() => { setCategoriaSeleccionada('Deuda Familiar'); setSubEntidad(''); }}
                >
                    <Text style={styles.catText}>👥 Cuentas por Pagar (Familiares / Personales)</Text>
                </TouchableOpacity>
            </View>

            {/* SECCIÓN 2: OPCIONES ESPECÍFICAS SEGÚN LA CATEGORÍA */}
            {(categoriaSeleccionada === 'Tarjeta de Crédito' || categoriaSeleccionada === 'Préstamo Bancario') && (
                <View style={styles.subContainer}>
                    <Text style={styles.label}>Selecciona el Banco:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                        {['Banco Guayaquil', 'Banco Pichincha', 'Produbanco', 'Banco Pacífico', 'Banco Internacional', 'Banco Bolivariano', 'Banco del Austro', 'Diners Club'].map((banco) => (
                            <TouchableOpacity 
                                key={banco} 
                                style={[styles.chip, subEntidad === banco && styles.chipSelected]}
                                onPress={() => setSubEntidad(banco)}
                            >
                                <Text style={styles.chipText}>{banco}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {categoriaSeleccionada === 'Tarjeta de Crédito' && (
                        <>
                            <Text style={styles.label}>Selecciona la Marca de la Tarjeta:</Text>
                            <View style={styles.rowOps}>
                                {['Visa', 'Mastercard', 'American Express'].map((marca) => (
                                    <TouchableOpacity 
                                        key={marca} 
                                        style={[styles.chipBrand, marcaTarjeta === marca && styles.chipSelected]}
                                        onPress={() => setMarcaTarjeta(marca)}
                                    >
                                        <Text style={styles.chipText}>{marca}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            )}

            {categoriaSeleccionada === 'Casa Comercial' && (
                <View style={styles.subContainer}>
                    <Text style={styles.label}>Selecciona la Casa Comercial:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                        {['De Prati', 'Computron', 'Marcimex', 'Etafashion', 'Pycca', 'Almacenes Tía', 'Jiman'].map((tienda) => (
                            <TouchableOpacity 
                                key={tienda} 
                                style={[styles.chip, subEntidad === tienda && styles.chipSelected]}
                                onPress={() => setSubEntidad(tienda)}
                            >
                                <Text style={styles.chipText}>{tienda}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {categoriaSeleccionada === 'Operadora Celular' && (
                <View style={styles.subContainer}>
                    <Text style={styles.label}>Selecciona la Operadora:</Text>
                    <View style={styles.rowOps}>
                        {['Claro', 'Movistar', 'Tuenti'].map((op) => (
                            <TouchableOpacity 
                                key={op} 
                                style={[styles.chipOp, subEntidad === op && styles.chipSelected]}
                                onPress={() => setSubEntidad(op)}
                            >
                                <Text style={styles.chipText}>{op}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {categoriaSeleccionada === 'Deuda Familiar' && (
                <View style={styles.subContainer}>
                    <Text style={styles.label}>Nombre de la Persona (Papá, Hermano/a...):</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Préstamo a Papá / Hermana"
                        placeholderTextColor="#64748B"
                        value={subEntidad}
                        onChangeText={setSubEntidad}
                    />
                </View>
            )}

            {/* SECCIÓN 3: CAMPOS DE MONTO, CUOTA Y FECHAS */}
            {categoriaSeleccionada && (
                <View style={styles.formCard}>
                    <Text style={styles.label}>Monto Total de la Deuda ($)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 300.00"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={monto}
                        onChangeText={setMonto}
                    />

                    <Text style={styles.label}>Cuota a pagar ($)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 50.00"
                        placeholderTextColor="#64748B"
                        keyboardType="numeric"
                        value={cuotaPagar}
                        onChangeText={setCuotaPagar}
                    />

                    <Text style={styles.label}>Fecha máxima de pago</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 2026-08-30 o 15 de cada mes"
                        placeholderTextColor="#64748B"
                        value={fechaMaxPago}
                        onChangeText={setFechaMaxPago}
                    />

                    {categoriaSeleccionada === 'Tarjeta de Crédito' && (
                        <>
                            <Text style={styles.label}>Fecha de caducidad de la tarjeta</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. 12/28"
                                placeholderTextColor="#64748B"
                                value={fechaCaducidad}
                                onChangeText={setFechaCaducidad}
                            />
                        </>
                    )}

                    <TouchableOpacity style={styles.primaryButton} onPress={guardarDeuda}>
                        <Text style={styles.primaryButtonText}>Guardar Deuda</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryButtonText}>Volver al Panel</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    container: {
        paddingHorizontal: 25,
        paddingTop: 40,
        paddingBottom: 40,
    },
    titulo: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#EF4444', 
        marginBottom: 6,
    },
    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 20,
    },
    labelSection: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
    },
    gridCategorias: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    catCard: {
        backgroundColor: '#1E293B',
        width: '48%',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 10,
        alignItems: 'center',
    },
    catCardWide: {
        backgroundColor: '#1E293B',
        width: '100%',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 10,
        alignItems: 'center',
    },
    catSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#1E3A8A',
    },
    catText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
    },
    subContainer: {
        marginBottom: 15,
    },
    label: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
        marginTop: 6,
    },
    chipsScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    rowOps: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    chip: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
    },
    chipOp: {
        backgroundColor: '#1E293B',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        width: '31%',
        alignItems: 'center',
    },
    chipBrand: {
        backgroundColor: '#1E293B',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        width: '32%',
        alignItems: 'center',
    },
    chipSelected: {
        backgroundColor: '#1D4ED8',
        borderColor: '#60A5FA',
    },
    chipText: {
        color: '#F8FAFC',
        fontSize: 13,
    },
    formCard: {
        backgroundColor: '#1E293B',
        padding: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 15,
    },
    input: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 10,
        padding: 12,
        color: '#F8FAFC',
        fontSize: 15,
        marginBottom: 10,
    },
    primaryButton: {
        backgroundColor: '#EF4444',
        marginTop: 15,
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#64748B',
    },
    secondaryButtonText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '600',
    }
})