import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth, db } from '../../firebase/FirebaseConfig'
import { ref, push, set, onValue } from 'firebase/database'

// Tipo simple para las tarjetas que ya están registradas (para poder seleccionarlas al registrar un consumo)
type TarjetaRegistrada = {
    id: string;
    banco: string;
    marca: string;
    cupoTotal: number;
    fechaCaducidad: string;
};

export default function RegistroDeudasScreen({ navigation }: any) {
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);

    // --- Campos genéricos (Préstamo, Casa Comercial, Operadora, Deuda Familiar) ---
    const [subEntidad, setSubEntidad] = useState('');
    const [monto, setMonto] = useState('');
    const [cuotaPagar, setCuotaPagar] = useState('');
    const [numeroCuotas, setNumeroCuotas] = useState('');
    const [fechaMaxPago, setFechaMaxPago] = useState('');

    // --- Tarjetas de Crédito: ahora se maneja en 2 pasos (nueva tarjeta / consumo) ---
    const [modoTarjeta, setModoTarjeta] = useState<'nueva' | 'consumo' | null>(null);

    // Paso 1: registrar la tarjeta (sin monto de deuda, sin cuotas)
    const [bancoTarjeta, setBancoTarjeta] = useState('');
    const [marcaTarjeta, setMarcaTarjeta] = useState('');
    const [cupoTotal, setCupoTotal] = useState('');
    const [fechaCaducidad, setFechaCaducidad] = useState('');

    // Paso 2: registrar un consumo sobre una tarjeta ya existente
    const [tarjetasDisponibles, setTarjetasDisponibles] = useState<TarjetaRegistrada[]>([]);
    const [tarjetaConsumoId, setTarjetaConsumoId] = useState<string | null>(null);
    const [montoConsumo, setMontoConsumo] = useState('');
    const [esDiferido, setEsDiferido] = useState<boolean | null>(null);
    const [numeroCuotasConsumo, setNumeroCuotasConsumo] = useState('');
    const [fechaConsumo, setFechaConsumo] = useState('');
    const [descripcionConsumo, setDescripcionConsumo] = useState('');

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

    // Cuando el usuario entra al modo "Registrar Consumo", traemos las tarjetas ya registradas de la pareja.
    // IMPORTANTE: se leen del mismo nodo "deudas" donde se guardan préstamos, casas comerciales, etc.
    // (la misma ruta que ya funciona), filtrando solo las entradas con tipo === 'tarjeta'.
    useEffect(() => {
        if (!idPareja) return;
        if (categoriaSeleccionada !== 'Tarjeta de Crédito' || modoTarjeta !== 'consumo') return;

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const unsubscribe = onValue(deudasRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setTarjetasDisponibles([]);
                return;
            }
            const lista: TarjetaRegistrada[] = Object.keys(data)
                .filter((key) => data[key].tipo === 'tarjeta')
                .map((key) => ({
                    id: key,
                    banco: data[key].entidad,
                    marca: data[key].marcaTarjeta,
                    cupoTotal: data[key].cupoTotal,
                    fechaCaducidad: data[key].fechaCaducidad,
                }));
            setTarjetasDisponibles(lista);
        });

        return () => unsubscribe();
    }, [idPareja, categoriaSeleccionada, modoTarjeta]);

    function seleccionarCategoria(categoria: string) {
        setCategoriaSeleccionada(categoria);
        // Reiniciamos todos los campos al cambiar de categoría
        setSubEntidad('');
        setMonto('');
        setCuotaPagar('');
        setNumeroCuotas('');
        setFechaMaxPago('');

        setModoTarjeta(null);
        setBancoTarjeta('');
        setMarcaTarjeta('');
        setCupoTotal('');
        setFechaCaducidad('');

        setTarjetaConsumoId(null);
        setMontoConsumo('');
        setEsDiferido(null);
        setNumeroCuotasConsumo('');
        setFechaConsumo('');
        setDescripcionConsumo('');
    }

    function obtenerAutor(email: string | null | undefined) {
        return email?.toLowerCase().includes('daniela') ? 'Daniela' : 'Daniel';
    }

    // Paso 1: guardar una tarjeta nueva (banco, marca, cupo total, caducidad)
    function guardarTarjetaNueva() {
        if (!idPareja) {
            Alert.alert("Atención", "No se encontró el código de pareja configurado.");
            return;
        }
        if (!bancoTarjeta || !marcaTarjeta) {
            Alert.alert("Atención", "Selecciona el banco y la marca de la tarjeta.");
            return;
        }
        if (!cupoTotal) {
            Alert.alert("Atención", "Ingresa el cupo total de la tarjeta.");
            return;
        }

        const usuarioActual = auth.currentUser;
        if (!usuarioActual) {
            Alert.alert("Error", "No hay un usuario logueado.");
            return;
        }

        // Se guarda en el mismo nodo "deudas" que ya usa Préstamos (la ruta que sí funciona en Firebase),
        // marcando tipo: 'tarjeta' para poder identificarla y filtrarla luego.
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaTarjetaRef = push(deudasRef);

        const datosTarjeta = {
            tipo: 'tarjeta',
            categoria: 'Tarjeta de Crédito',
            entidad: bancoTarjeta,
            marcaTarjeta: marcaTarjeta,
            cupoTotal: parseFloat(cupoTotal),
            fechaCaducidad: fechaCaducidad || 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: obtenerAutor(usuarioActual.email),
        };

        set(nuevaTarjetaRef, datosTarjeta)
            .then(() => {
                Alert.alert("¡Éxito!", "Tarjeta registrada correctamente.");
                navigation.goBack();
            })
            .catch((error) => {
                Alert.alert("Error", error.message);
            });
    }

    // Paso 2: guardar un consumo sobre una tarjeta existente (con o sin diferir)
    function guardarConsumo() {
        if (!idPareja) {
            Alert.alert("Atención", "No se encontró el código de pareja configurado.");
            return;
        }
        if (!tarjetaConsumoId) {
            Alert.alert("Atención", "Selecciona a qué tarjeta pertenece este consumo.");
            return;
        }
        if (!montoConsumo) {
            Alert.alert("Atención", "Ingresa el monto del consumo.");
            return;
        }
        if (esDiferido === null) {
            Alert.alert("Atención", "Indica si el consumo es diferido o no.");
            return;
        }
        if (esDiferido && !numeroCuotasConsumo) {
            Alert.alert("Atención", "Ingresa a cuántas cuotas vas a diferir el consumo.");
            return;
        }

        const usuarioActual = auth.currentUser;
        if (!usuarioActual) {
            Alert.alert("Error", "No hay un usuario logueado.");
            return;
        }

        const tarjetaElegida = tarjetasDisponibles.find(t => t.id === tarjetaConsumoId);

        // Igual que la tarjeta: se guarda dentro de "deudas", junto a préstamos, casas comerciales, etc.
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevoConsumoRef = push(deudasRef);

        const datosConsumo = {
            tipo: 'consumoTarjeta',
            categoria: 'Tarjeta de Crédito',
            tarjetaId: tarjetaConsumoId,
            tarjetaBanco: tarjetaElegida?.banco || 'N/A',
            tarjetaMarca: tarjetaElegida?.marca || 'N/A',
            monto: parseFloat(montoConsumo),
            diferido: esDiferido,
            numeroCuotas: esDiferido ? (parseInt(numeroCuotasConsumo) || 1) : 1,
            descripcion: descripcionConsumo || 'N/A',
            fechaMaxPago: fechaConsumo || 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: obtenerAutor(usuarioActual.email),
        };

        set(nuevoConsumoRef, datosConsumo)
            .then(() => {
                Alert.alert("¡Éxito!", "Consumo registrado correctamente.");
                navigation.goBack();
            })
            .catch((error) => {
                Alert.alert("Error", error.message);
            });
    }

    // Para el resto de categorías (Préstamo, Casa Comercial, Operadora, Deuda Familiar) se mantiene igual que antes
    function guardarDeudaGeneral() {
        if (!idPareja) {
            Alert.alert("Atención", "No se encontró el código de pareja configurado.");
            return;
        }
        if (!categoriaSeleccionada) {
            Alert.alert("Atención", "Por favor selecciona un tipo de deuda.");
            return;
        }
        if (!subEntidad || !monto || !cuotaPagar) {
            Alert.alert("Atención", "Debes completar la entidad/banco, el monto total y la cuota a pagar.");
            return;
        }

        const usuarioActual = auth.currentUser;
        if (!usuarioActual) {
            Alert.alert("Error", "No hay un usuario logueado.");
            return;
        }

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaDeudaRef = push(deudasRef);

        const datosDeuda = {
            tipo: 'deuda',
            categoria: categoriaSeleccionada,
            entidad: subEntidad,
            monto: parseFloat(monto),
            cuotaPagar: parseFloat(cuotaPagar),
            numeroCuotas: (categoriaSeleccionada === 'Préstamo Bancario' || categoriaSeleccionada === 'Casa Comercial') ? (parseInt(numeroCuotas) || 1) : 1,
            fechaMaxPago: fechaMaxPago || 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: obtenerAutor(usuarioActual.email),
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
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.titulo}>Registro de Deudas</Text>
                <Text style={styles.subtitulo}>Controla tus compromisos y obligaciones financieras</Text>

                {/* SECCIÓN 1: SELECCIONAR TIPO DE DEUDA */}
                <Text style={styles.labelSection}>1. Selecciona el tipo de deuda:</Text>
                <View style={styles.gridCategorias}>
                    <TouchableOpacity
                        style={[styles.catCard, categoriaSeleccionada === 'Tarjeta de Crédito' && styles.catSelected]}
                        onPress={() => seleccionarCategoria('Tarjeta de Crédito')}
                    >
                        <Text style={styles.catText}>💳 Tarjeta de Crédito</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.catCard, categoriaSeleccionada === 'Préstamo Bancario' && styles.catSelected]}
                        onPress={() => seleccionarCategoria('Préstamo Bancario')}
                    >
                        <Text style={styles.catText}>🏦 Préstamos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.catCard, categoriaSeleccionada === 'Casa Comercial' && styles.catSelected]}
                        onPress={() => seleccionarCategoria('Casa Comercial')}
                    >
                        <Text style={styles.catText}>🏬 Casas Comerciales</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.catCard, categoriaSeleccionada === 'Operadora Celular' && styles.catSelected]}
                        onPress={() => seleccionarCategoria('Operadora Celular')}
                    >
                        <Text style={styles.catText}>📱 Planes Celular</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.catCardWide, categoriaSeleccionada === 'Deuda Familiar' && styles.catSelected]}
                        onPress={() => seleccionarCategoria('Deuda Familiar')}
                    >
                        <Text style={styles.catText}>👥 Cuentas por Pagar (Familiares / Personales)</Text>
                    </TouchableOpacity>
                </View>

                {/* ===================== FLUJO TARJETA DE CRÉDITO (2 PASOS) ===================== */}
                {categoriaSeleccionada === 'Tarjeta de Crédito' && (
                    <View style={styles.subContainer}>
                        <Text style={styles.label}>2. ¿Qué quieres hacer?</Text>
                        <View style={styles.modoRow}>
                            <TouchableOpacity
                                style={[styles.modoButton, modoTarjeta === 'nueva' && styles.modoButtonSelected]}
                                onPress={() => setModoTarjeta('nueva')}
                            >
                                <Text style={styles.modoButtonText}>➕ Registrar Tarjeta Nueva</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modoButton, modoTarjeta === 'consumo' && styles.modoButtonSelected]}
                                onPress={() => setModoTarjeta('consumo')}
                            >
                                <Text style={styles.modoButtonText}>💰 Registrar Consumo</Text>
                            </TouchableOpacity>
                        </View>

                        {/* --- Paso 1: Registrar tarjeta nueva --- */}
                        {modoTarjeta === 'nueva' && (
                            <View style={styles.formCard}>
                                <Text style={styles.label}>Selecciona el Banco:</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.chipsScrollContent}
                                    style={styles.chipsScroll}
                                >
                                    {['Banco Guayaquil', 'Banco Pichincha', 'Produbanco', 'Banco Pacífico', 'Banco Internacional', 'Banco Bolivariano', 'Banco del Austro', 'Diners Club'].map((banco) => (
                                        <TouchableOpacity
                                            key={banco}
                                            style={[styles.chip, bancoTarjeta === banco && styles.chipSelected]}
                                            onPress={() => setBancoTarjeta(banco)}
                                        >
                                            <Text style={styles.chipText}>{banco}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.label}>Selecciona la Marca de la Tarjeta:</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.chipsScrollContent}
                                    style={styles.chipsScroll}
                                >
                                    {['Visa', 'Mastercard', 'American Express'].map((marca) => (
                                        <TouchableOpacity
                                            key={marca}
                                            style={[styles.chip, marcaTarjeta === marca && styles.chipSelected]}
                                            onPress={() => setMarcaTarjeta(marca)}
                                        >
                                            <Text style={styles.chipText}>{marca}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.label}>Cupo Total de la Tarjeta ($)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 2000.00"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={cupoTotal}
                                    onChangeText={setCupoTotal}
                                />

                                <Text style={styles.label}>Fecha de caducidad de la tarjeta</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 12/28"
                                    placeholderTextColor="#64748B"
                                    value={fechaCaducidad}
                                    onChangeText={setFechaCaducidad}
                                />

                                <TouchableOpacity style={styles.primaryButton} onPress={guardarTarjetaNueva}>
                                    <Text style={styles.primaryButtonText}>Guardar Tarjeta</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* --- Paso 2: Registrar un consumo sobre una tarjeta ya registrada --- */}
                        {modoTarjeta === 'consumo' && (
                            <View style={styles.formCard}>
                                <Text style={styles.label}>Selecciona la tarjeta:</Text>
                                {tarjetasDisponibles.length === 0 ? (
                                    <Text style={styles.avisoTexto}>
                                        Todavía no tienes tarjetas registradas. Usa "Registrar Tarjeta Nueva" primero.
                                    </Text>
                                ) : (
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.chipsScrollContent}
                                        style={styles.chipsScroll}
                                    >
                                        {tarjetasDisponibles.map((tarjeta) => (
                                            <TouchableOpacity
                                                key={tarjeta.id}
                                                style={[styles.chip, tarjetaConsumoId === tarjeta.id && styles.chipSelected]}
                                                onPress={() => setTarjetaConsumoId(tarjeta.id)}
                                            >
                                                <Text style={styles.chipText}>{tarjeta.marca} · {tarjeta.banco} (Cupo ${tarjeta.cupoTotal})</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}

                                <Text style={styles.label}>Monto del consumo ($)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 85.50"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={montoConsumo}
                                    onChangeText={setMontoConsumo}
                                />

                                <Text style={styles.label}>Descripción (opcional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Compra en Fybeca"
                                    placeholderTextColor="#64748B"
                                    value={descripcionConsumo}
                                    onChangeText={setDescripcionConsumo}
                                />

                                <Text style={styles.label}>¿Vas a diferir este consumo?</Text>
                                <View style={styles.toggleRow}>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, esDiferido === false && styles.toggleButtonSelected]}
                                        onPress={() => { setEsDiferido(false); setNumeroCuotasConsumo(''); }}
                                    >
                                        <Text style={styles.chipText}>No diferir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, esDiferido === true && styles.toggleButtonSelected]}
                                        onPress={() => setEsDiferido(true)}
                                    >
                                        <Text style={styles.chipText}>Diferir</Text>
                                    </TouchableOpacity>
                                </View>

                                {esDiferido === true && (
                                    <>
                                        <Text style={styles.label}>¿A cuántas cuotas?</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej. 6"
                                            placeholderTextColor="#64748B"
                                            keyboardType="numeric"
                                            value={numeroCuotasConsumo}
                                            onChangeText={setNumeroCuotasConsumo}
                                        />
                                    </>
                                )}

                                <Text style={styles.label}>Fecha máxima de pago</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 2026-08-30 o 15 de cada mes"
                                    placeholderTextColor="#64748B"
                                    value={fechaConsumo}
                                    onChangeText={setFechaConsumo}
                                />

                                <TouchableOpacity style={styles.primaryButton} onPress={guardarConsumo}>
                                    <Text style={styles.primaryButtonText}>Guardar Consumo</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ===================== RESTO DE CATEGORÍAS (SIN CAMBIOS) ===================== */}
                {categoriaSeleccionada === 'Préstamo Bancario' && (
                    <View style={styles.subContainer}>
                        <Text style={styles.label}>Selecciona el Banco:</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipsScrollContent}
                            style={styles.chipsScroll}
                        >
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
                    </View>
                )}

                {categoriaSeleccionada === 'Casa Comercial' && (
                    <View style={styles.subContainer}>
                        <Text style={styles.label}>Selecciona la Casa Comercial:</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipsScrollContent}
                            style={styles.chipsScroll}
                        >
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
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.chipsScrollContent}
                            style={styles.chipsScroll}
                        >
                            {['Claro', 'Movistar', 'Tuenti'].map((op) => (
                                <TouchableOpacity
                                    key={op}
                                    style={[styles.chip, subEntidad === op && styles.chipSelected]}
                                    onPress={() => setSubEntidad(op)}
                                >
                                    <Text style={styles.chipText}>{op}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
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

                {/* Formulario genérico de monto/cuota/fecha SOLO para las categorías que no son tarjeta de crédito */}
                {categoriaSeleccionada && categoriaSeleccionada !== 'Tarjeta de Crédito' && (
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

                        {(categoriaSeleccionada === 'Préstamo Bancario' || categoriaSeleccionada === 'Casa Comercial') && (
                            <>
                                <Text style={styles.label}>¿Cuántas cuotas son?</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 12 (meses)"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={numeroCuotas}
                                    onChangeText={setNumeroCuotas}
                                />
                            </>
                        )}

                        <Text style={styles.label}>Fecha máxima de pago</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ej. 2026-08-30 o 15 de cada mes"
                            placeholderTextColor="#64748B"
                            value={fechaMaxPago}
                            onChangeText={setFechaMaxPago}
                        />

                        <TouchableOpacity style={styles.primaryButton} onPress={guardarDeudaGeneral}>
                            <Text style={styles.primaryButtonText}>Guardar Deuda</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.secondaryButtonText}>Volver al Panel</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: '#0F172A',
        ...Platform.select({
            web: { height: '100vh' as any, overflow: 'hidden' as any },
            default: {},
        }),
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 25,
        paddingTop: 40,
        paddingBottom: 80,
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
        marginBottom: 8,
    },
    chipsScrollContent: {
        paddingRight: 15,
        alignItems: 'center',
    },
    chip: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
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
    },
    modoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    modoButton: {
        backgroundColor: '#1E293B',
        width: '48%',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
    },
    modoButtonSelected: {
        borderColor: '#38BDF8',
        backgroundColor: '#1E3A8A',
    },
    modoButtonText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    toggleButton: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 10,
    },
    toggleButtonSelected: {
        backgroundColor: '#1D4ED8',
        borderColor: '#60A5FA',
    },
    avisoTexto: {
        color: '#FBBF24',
        fontSize: 13,
        marginBottom: 10,
    },
})