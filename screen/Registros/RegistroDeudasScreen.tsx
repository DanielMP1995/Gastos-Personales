import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    push,
    set,
    onValue,
} from 'firebase/database';

type TarjetaRegistrada = {
    id: string;
    banco: string;
    marca: string;
    cupoTotal: number;
    fechaCaducidad: string;
};

export default function RegistroDeudasScreen({
    navigation,
}: any) {

    // ============================================================
    // CATEGORIA
    // ============================================================

    const [
        categoriaSeleccionada,
        setCategoriaSeleccionada,
    ] = useState<string | null>(null);

    // ============================================================
    // DEUDAS GENERALES
    // ============================================================

    const [subEntidad, setSubEntidad] = useState('');
    const [monto, setMonto] = useState('');
    const [cuotaPagar, setCuotaPagar] = useState('');
    const [numeroCuotas, setNumeroCuotas] = useState('');
    const [fechaMaxPago, setFechaMaxPago] = useState('');

    // ============================================================
    // TARJETAS
    // ============================================================

    const [modoTarjeta, setModoTarjeta] = useState<
        'nueva' | 'consumo' | null
    >(null);

    // ============================================================
    // REGISTRAR TARJETA
    // ============================================================

    const [bancoTarjeta, setBancoTarjeta] = useState('');
    const [marcaTarjeta, setMarcaTarjeta] = useState('');
    const [cupoTotal, setCupoTotal] = useState('');
    const [fechaCaducidad, setFechaCaducidad] = useState('');

    // ============================================================
    // CONSUMO TARJETA
    // ============================================================

    const [tarjetasDisponibles, setTarjetasDisponibles] =
        useState<TarjetaRegistrada[]>([]);

    const [tarjetaConsumoId, setTarjetaConsumoId] =
        useState<string | null>(null);

    const [montoConsumo, setMontoConsumo] = useState('');

    const [esDiferido, setEsDiferido] =
        useState<boolean | null>(null);

    const [numeroCuotasConsumo, setNumeroCuotasConsumo] =
        useState('');

    const [valorCuotaConsumo, setValorCuotaConsumo] =
        useState('');

    const [fechaConsumo, setFechaConsumo] =
        useState('');

    const [descripcionConsumo, setDescripcionConsumo] =
        useState('');

    // ============================================================
    // PAREJA
    // ============================================================

    const [idPareja, setIdPareja] =
        useState<string | null>(null);

    // ============================================================
    // OBTENER PAREJA
    // ============================================================

    useEffect(() => {

        navigation.setOptions({
            headerShown: false,
        });

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            return;
        }

        const userRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        const unsubscribe = onValue(
            userRef,
            (snapshot) => {

                const data = snapshot.val();

                if (data?.idPareja) {
                    setIdPareja(data.idPareja);
                }
            },
            {
                onlyOnce: true,
            }
        );

        return () => unsubscribe();

    }, [navigation]);

    // ============================================================
    // CARGAR TARJETAS REGISTRADAS
    // ============================================================

    useEffect(() => {

        if (!idPareja) {
            return;
        }

        if (
            categoriaSeleccionada !==
                'Tarjeta de Crédito' ||
            modoTarjeta !== 'consumo'
        ) {
            return;
        }

        const deudasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        const unsubscribe = onValue(
            deudasRef,
            (snapshot) => {

                const data = snapshot.val();

                if (!data) {
                    setTarjetasDisponibles([]);
                    return;
                }

                const lista: TarjetaRegistrada[] =
                    Object.keys(data)
                        .filter(
                            (key) =>
                                data[key]?.tipo ===
                                'tarjeta'
                        )
                        .map((key) => ({
                            id: key,

                            banco:
                                data[key]?.entidad ||
                                'Banco',

                            marca:
                                data[key]?.marcaTarjeta ||
                                'Tarjeta',

                            cupoTotal:
                                Number(
                                    data[key]?.cupoTotal
                                ) || 0,

                            fechaCaducidad:
                                data[key]?.fechaCaducidad ||
                                'N/A',
                        }));

                setTarjetasDisponibles(lista);
            }
        );

        return () => unsubscribe();

    }, [
        idPareja,
        categoriaSeleccionada,
        modoTarjeta,
    ]);

    // ============================================================
    // LIMPIAR FORMULARIO
    // ============================================================

    function limpiarFormulario() {

        setCategoriaSeleccionada(null);

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
        setValorCuotaConsumo('');
        setFechaConsumo('');
        setDescripcionConsumo('');
    }

    // ============================================================
    // CAMBIAR CATEGORIA
    // ============================================================

    function seleccionarCategoria(
        categoria: string
    ) {

        limpiarFormulario();

        setCategoriaSeleccionada(categoria);
    }

    // ============================================================
    // AUTOR
    // ============================================================

    function obtenerAutor(
        email: string | null | undefined
    ) {

        return email
            ?.toLowerCase()
            .includes('daniela')
            ? 'Daniela'
            : 'Daniel';
    }

    // ============================================================
    // GUARDAR TARJETA NUEVA
    // ============================================================

    function guardarTarjetaNueva() {

        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja configurado.');
            return;
        }

        if (!bancoTarjeta) {
            Alert.alert('Atención', 'Selecciona el banco de la tarjeta.');
            return;
        }

        if (!marcaTarjeta) {
            Alert.alert('Atención', 'Selecciona la marca de la tarjeta.');
            return;
        }

        if (!cupoTotal) {
            Alert.alert('Atención', 'Ingresa el cupo total de la tarjeta.');
            return;
        }

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            Alert.alert('Error', 'No hay un usuario logueado.');
            return;
        }

        const cupoNumero = parseFloat(cupoTotal);

        if (isNaN(cupoNumero) || cupoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un cupo válido.');
            return;
        }

        const tarjetasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaTarjetaRef = push(tarjetasRef);

        const datosTarjeta = {
            tipo: 'tarjeta',
            categoria: 'Tarjeta de Crédito',
            entidad: bancoTarjeta,
            marcaTarjeta: marcaTarjeta,
            cupoTotal: cupoNumero,
            saldoUtilizado: 0,
            saldoDisponible: cupoNumero,
            fechaCaducidad: fechaCaducidad || 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: obtenerAutor(usuarioActual.email),
        };

        set(nuevaTarjetaRef, datosTarjeta)
            .then(() => {
                Alert.alert('¡Éxito!', 'Tarjeta registrada correctamente.');
                limpiarFormulario();
                navigation.goBack();
            })
            .catch((error) => {
                Alert.alert('Error', error?.message || 'No se pudo registrar la tarjeta.');
            });
    }

    // ============================================================
    // GUARDAR CONSUMO DE TARJETA
    // ============================================================

    function guardarConsumo() {

        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja configurado.');
            return;
        }

        if (!tarjetaConsumoId) {
            Alert.alert('Atención', 'Selecciona a qué tarjeta pertenece este consumo.');
            return;
        }

        if (!montoConsumo) {
            Alert.alert('Atención', 'Ingresa el monto del consumo.');
            return;
        }

        const montoNumero = parseFloat(montoConsumo);

        if (isNaN(montoNumero) || montoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un monto de consumo válido.');
            return;
        }

        if (esDiferido === null) {
            Alert.alert('Atención', 'Indica si el consumo es diferido o no.');
            return;
        }

        let cuotas = 1;
        let cuotaFinal = montoNumero;

        if (esDiferido === true) {
            if (!numeroCuotasConsumo) {
                Alert.alert('Atención', 'Ingresa a cuántas cuotas vas a diferir el consumo.');
                return;
            }

            cuotas = parseInt(numeroCuotasConsumo);

            if (isNaN(cuotas) || cuotas <= 0) {
                Alert.alert('Atención', 'Ingresa un número de cuotas válido.');
                return;
            }

            if (!valorCuotaConsumo) {
                Alert.alert('Atención', 'Ingresa el valor de la cuota.');
                return;
            }

            cuotaFinal = parseFloat(valorCuotaConsumo);

            if (isNaN(cuotaFinal) || cuotaFinal <= 0) {
                Alert.alert('Atención', 'Ingresa un valor de cuota válido.');
                return;
            }
        }

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            Alert.alert('Error', 'No hay un usuario logueado.');
            return;
        }

        const tarjetaElegida = tarjetasDisponibles.find(
            (tarjeta) => tarjeta.id === tarjetaConsumoId
        );

        if (!tarjetaElegida) {
            Alert.alert('Error', 'No se encontró la tarjeta seleccionada.');
            return;
        }

        const cupo = Number(tarjetaElegida.cupoTotal) || 0;

        if (montoNumero > cupo) {
            Alert.alert(
                'Cupo insuficiente',
                `El consumo de $${montoNumero.toFixed(2)} supera el cupo total de $${cupo.toFixed(2)}.`
            );
            return;
        }

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevoConsumoRef = push(deudasRef);

        const datosConsumo = {
            tipo: 'consumoTarjeta',
            categoria: 'Tarjeta de Crédito',
            tarjetaId: tarjetaConsumoId,
            tarjetaBanco: tarjetaElegida.banco,
            tarjetaMarca: tarjetaElegida.marca,
            monto: montoNumero,
            diferido: esDiferido,
            numeroCuotas: cuotas,
            cuotaPagar: Number(cuotaFinal.toFixed(2)),
            valorCuota: Number(cuotaFinal.toFixed(2)),
            descripcion: descripcionConsumo || 'Consumo con tarjeta',
            fechaMaxPago: fechaConsumo || 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: obtenerAutor(usuarioActual.email),
        };

        set(nuevoConsumoRef, datosConsumo)
            .then(() => {
                Alert.alert(
                    '¡Éxito!',
                    `Consumo registrado correctamente.\n\nValor de la cuota: $${cuotaFinal.toFixed(2)}`
                );
                limpiarFormulario();
                navigation.goBack();
            })
            .catch((error) => {
                Alert.alert('Error', error?.message || 'No se pudo registrar el consumo.');
            });
    }

    // ============================================================
    // GUARDAR DEUDA GENERAL
    // ============================================================

    function guardarDeudaGeneral() {

        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja configurado.');
            return;
        }

        if (!categoriaSeleccionada) {
            Alert.alert('Atención', 'Por favor selecciona un tipo de deuda.');
            return;
        }

        if (!subEntidad || !monto || !cuotaPagar) {
            Alert.alert('Atención', 'Debes completar la entidad/banco, el monto total y la cuota a pagar.');
            return;
        }

        const usuarioActual = auth.currentUser;

        if (!usuarioActual) {
            Alert.alert('Error', 'No hay un usuario logueado.');
            return;
        }

        const montoNumero = parseFloat(monto);
        const cuotaNumero = parseFloat(cuotaPagar);

        if (isNaN(montoNumero) || montoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un monto válido.');
            return;
        }

        if (isNaN(cuotaNumero) || cuotaNumero <= 0) {
            Alert.alert('Atención', 'Ingresa una cuota válida.');
            return;
        }

        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaDeudaRef = push(deudasRef);

        const datosDeuda = {
            tipo: 'deuda',
            categoria: categoriaSeleccionada,
            entidad: subEntidad,
            monto: montoNumero,
            cuotaPagar: cuotaNumero,
            numeroCuotas:
                categoriaSeleccionada === 'Préstamo Bancario' ||
                categoriaSeleccionada === 'Casa Comercial'
                    ? parseInt(numeroCuotas) || 1
                    : 1,
            fechaMaxPago: fechaMaxPago || 'N/A',
            fechaRegistro: new Date().toISOString(),
            usuarioEmail: usuarioActual.email,
            autor: obtenerAutor(usuarioActual.email),
        };

        set(nuevaDeudaRef, datosDeuda)
            .then(() => {
                Alert.alert('¡Éxito!', 'Deuda registrada correctamente.');
                limpiarFormulario();
                navigation.goBack();
            })
            .catch((error) => {
                Alert.alert('Error', error?.message || 'No se pudo registrar la deuda.');
            });
    }

    // ============================================================
    // INTERFAZ
    // ============================================================

    return (
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Cabecera minimalista superior */}
                <View style={styles.topHeader}>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.topHeaderTitle}>Nueva Obligación</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Banner Principal */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIconContainer}>
                        <Text style={styles.heroEmoji}>💳</Text>
                    </View>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>Control Financiero</Text>
                        <Text style={styles.heroSubtitle}>
                            Registra y organiza tus compromisos en pareja
                        </Text>
                    </View>
                </View>

                {/* Paso 1: Selección de Categoría */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>01</Text>
                    </View>
                    <Text style={styles.sectionTitle}>Tipo de Obligación</Text>
                </View>

                <View style={styles.categoriesContainer}>
                    {[
                        { id: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', icon: '💳' },
                        { id: 'Préstamo Bancario', label: 'Préstamo Bancario', icon: '🏦' },
                        { id: 'Casa Comercial', label: 'Casa Comercial', icon: '🏬' },
                        { id: 'Operadora Celular', label: 'Planes Celular', icon: '📱' },
                    ].map((item) => {
                        const isSelected = categoriaSeleccionada === item.id;
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={[
                                    styles.categoryCard,
                                    isSelected && styles.categoryCardSelected,
                                ]}
                                onPress={() => seleccionarCategoria(item.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.categoryEmoji}>{item.icon}</Text>
                                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                                    {item.label}
                                </Text>
                                <View style={[styles.radioIndicator, isSelected && styles.radioIndicatorSelected]}>
                                    {isSelected && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Opción Ancha para Cuentas por Pagar */}
                    <TouchableOpacity
                        style={[
                            styles.categoryCardWide,
                            categoriaSeleccionada === 'Deuda Familiar' && styles.categoryCardSelected,
                        ]}
                        onPress={() => seleccionarCategoria('Deuda Familiar')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.categoryEmoji}>👥</Text>
                        <View >
                            <Text style={[styles.categoryText, categoriaSeleccionada === 'Deuda Familiar' && styles.categoryTextSelected]}>
                                Cuentas por Pagar
                            </Text>
                            <Text style={styles.categorySubText}>Familiares / Personales</Text>
                        </View>
                        <View style={[styles.radioIndicator, categoriaSeleccionada === 'Deuda Familiar' && styles.radioIndicatorSelected]}>
                            {categoriaSeleccionada === 'Deuda Familiar' && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Sub-Flujo: Tarjeta de Crédito */}
                {categoriaSeleccionada === 'Tarjeta de Crédito' && (
                    <View style={styles.subFlowContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>02</Text>
                            </View>
                            <Text style={styles.sectionTitle}>Acción con Tarjeta</Text>
                        </View>

                        <View style={styles.modeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modeCard,
                                    modoTarjeta === 'nueva' && styles.modeCardSelected,
                                ]}
                                onPress={() => setModoTarjeta('nueva')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modeEmoji}>➕</Text>
                                <Text style={[styles.modeTitle, modoTarjeta === 'nueva' && styles.modeTitleSelected]}>
                                    Tarjeta Nueva
                                </Text>
                                <Text style={styles.modeDesc}>Registrar plástico</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modeCard,
                                    modoTarjeta === 'consumo' && styles.modeCardSelected,
                                ]}
                                onPress={() => setModoTarjeta('consumo')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modeEmoji}>💸</Text>
                                <Text style={[styles.modeTitle, modoTarjeta === 'consumo' && styles.modeTitleSelected]}>
                                    Consumo
                                </Text>
                                <Text style={styles.modeDesc}>Nuevo gasto o diferido</Text>
                            </TouchableOpacity>
                        </View>

                        {/* FORMULARIO: NUEVA TARJETA */}
                        {modoTarjeta === 'nueva' && (
                            <View style={styles.formCard}>
                                <Text style={styles.formCardTitle}>Detalles del Plástico</Text>

                                <Text style={styles.inputLabel}>Banco Emisor</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Pichincha, Guayaquil, Produbanco"
                                    placeholderTextColor="#94A3B8"
                                    value={bancoTarjeta}
                                    onChangeText={setBancoTarjeta}
                                />

                                <Text style={styles.inputLabel}>Marca de la Tarjeta</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Visa, Mastercard"
                                    placeholderTextColor="#94A3B8"
                                    value={marcaTarjeta}
                                    onChangeText={setMarcaTarjeta}
                                />

                                <Text style={styles.inputLabel}>Cupo Total ($)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 1500"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={cupoTotal}
                                    onChangeText={setCupoTotal}
                                />

                                <Text style={styles.inputLabel}>Fecha de Corte / Vencimiento (Opcional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 15 de cada mes"
                                    placeholderTextColor="#94A3B8"
                                    value={fechaCaducidad}
                                    onChangeText={setFechaCaducidad}
                                />

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={guardarTarjetaNueva}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.submitButtonText}>Guardar Tarjeta</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* FORMULARIO: CONSUMO TARJETA */}
                        {modoTarjeta === 'consumo' && (
                            <View style={styles.formCard}>
                                <Text style={styles.formCardTitle}>Detalle del Consumo</Text>

                                <Text style={styles.inputLabel}>Seleccionar Tarjeta</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                    {tarjetasDisponibles.map((tarjeta) => {
                                        const isChipSelected = tarjetaConsumoId === tarjeta.id;
                                        return (
                                            <TouchableOpacity
                                                key={tarjeta.id}
                                                style={[
                                                    styles.chipItem,
                                                    isChipSelected && styles.chipItemSelected,
                                                ]}
                                                onPress={() => setTarjetaConsumoId(tarjeta.id)}
                                            >
                                                <Text style={[styles.chipText, isChipSelected && styles.chipTextSelected]}>
                                                    {tarjeta.banco} ({tarjeta.marca})
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>

                                <Text style={styles.inputLabel}>Monto del Consumo ($)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 85.50"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                    value={montoConsumo}
                                    onChangeText={setMontoConsumo}
                                />

                                <Text style={styles.inputLabel}>Modalidad de Pago</Text>
                                <View style={styles.modeRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.subModeButton,
                                            esDiferido === false && styles.subModeButtonSelected,
                                        ]}
                                        onPress={() => setEsDiferido(false)}
                                    >
                                        <Text style={[styles.subModeText, esDiferido === false && styles.subModeTextSelected]}>
                                            Corriente
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.subModeButton,
                                            esDiferido === true && styles.subModeButtonSelected,
                                        ]}
                                        onPress={() => setEsDiferido(true)}
                                    >
                                        <Text style={[styles.subModeText, esDiferido === true && styles.subModeTextSelected]}>
                                            Diferido
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {esDiferido === true && (
                                    <>
                                        <Text style={styles.inputLabel}>Número de Cuotas</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej. 6 ó 12"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                            value={numeroCuotasConsumo}
                                            onChangeText={setNumeroCuotasConsumo}
                                        />

                                        <Text style={styles.inputLabel}>Valor de la Cuota Mensual ($)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ej. 14.25"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                            value={valorCuotaConsumo}
                                            onChangeText={setValorCuotaConsumo}
                                        />
                                    </>
                                )}

                                <Text style={styles.inputLabel}>Establecimiento o Descripción</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Supermaxi, Cena, Ropa"
                                    placeholderTextColor="#94A3B8"
                                    value={descripcionConsumo}
                                    onChangeText={setDescripcionConsumo}
                                />

                                <Text style={styles.inputLabel}>Fecha Máxima / Corte (Opcional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 2026-09-15"
                                    placeholderTextColor="#94A3B8"
                                    value={fechaConsumo}
                                    onChangeText={setFechaConsumo}
                                />

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={guardarConsumo}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.submitButtonText}>Registrar Consumo</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Sub-Flujo: Deudas Generales */}
                {categoriaSeleccionada && categoriaSeleccionada !== 'Tarjeta de Crédito' && (
                    <View style={styles.subFlowContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.stepBadge}>
                                <Text style={styles.stepBadgeText}>02</Text>
                            </View>
                            <Text style={styles.sectionTitle}>Información de la Deuda</Text>
                        </View>

                        <View style={styles.formCard}>
                            <Text style={styles.inputLabel}>Entidad o Acreedor</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Banco Bolivariano, Almacenes Tía, Familiar"
                                placeholderTextColor="#94A3B8"
                                value={subEntidad}
                                onChangeText={setSubEntidad}
                            />

                            <Text style={styles.inputLabel}>Monto Total de la Deuda ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. 2500"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={monto}
                                onChangeText={setMonto}
                            />

                            <Text style={styles.inputLabel}>Cuota Periódica a Pagar ($)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. 120"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={cuotaPagar}
                                onChangeText={setCuotaPagar}
                            />

                            {(categoriaSeleccionada === 'Préstamo Bancario' || categoriaSeleccionada === 'Casa Comercial') && (
                                <>
                                    <Text style={styles.inputLabel}>Número Total de Cuotas</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ej. 24"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="numeric"
                                        value={numeroCuotas}
                                        onChangeText={setNumeroCuotas}
                                    />
                                </>
                            )}

                            <Text style={styles.inputLabel}>Fecha Límite / Día de Pago</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej. 30 de cada mes"
                                placeholderTextColor="#94A3B8"
                                value={fechaMaxPago}
                                onChangeText={setFechaMaxPago}
                            />

                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={guardarDeudaGeneral}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.submitButtonText}>Guardar Obligación</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

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
        marginBottom: 14,
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
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    categoryCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryCardWide: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    categoryCardSelected: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    categoryEmoji: {
        fontSize: 22,
        marginBottom: 8,
    },
    categoryText: {
        color: '#1E293B',
        fontWeight: '600',
        fontSize: 13,
    },
    categoryTextSelected: {
        color: '#047857',
    },
    categorySubText: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },
    radioIndicator: {
        position: 'absolute',
        top: 14,
        right: 14,
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioIndicatorSelected: {
        borderColor: '#059669',
        backgroundColor: '#059669',
    },
    radioDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
    },
    subFlowContainer: {
        marginTop: 10,
    },
    modeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    modeCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    modeCardSelected: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    modeEmoji: {
        fontSize: 22,
        marginBottom: 8,
    },
    modeTitle: {
        color: '#1E293B',
        fontWeight: '600',
        fontSize: 13,
        marginBottom: 2,
    },
    modeTitleSelected: {
        color: '#047857',
    },
    modeDesc: {
        color: '#64748B',
        fontSize: 11,
    },
    formCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    formCardTitle: {
        color: '#1E293B',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    inputLabel: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 6,
        marginTop: 12,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: '#1E293B',
        fontSize: 13,
    },
    chipScroll: {
        marginBottom: 4,
    },
    chipItem: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 8,
    },
    chipItemSelected: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    chipText: {
        color: '#64748B',
        fontSize: 12,
    },
    chipTextSelected: {
        color: '#047857',
        fontWeight: 'bold',
    },
    subModeButton: {
        width: '48%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    subModeButtonSelected: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    subModeText: {
        color: '#64748B',
        fontSize: 12,
    },
    subModeTextSelected: {
        color: '#047857',
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#059669',
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
});  //pagina /registro/deudas