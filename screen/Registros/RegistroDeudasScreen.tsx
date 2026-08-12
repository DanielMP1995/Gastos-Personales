import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
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

            Alert.alert(
                'Atención',
                'No se encontró el código de pareja configurado.'
            );

            return;
        }

        if (!bancoTarjeta) {

            Alert.alert(
                'Atención',
                'Selecciona el banco de la tarjeta.'
            );

            return;
        }

        if (!marcaTarjeta) {

            Alert.alert(
                'Atención',
                'Selecciona la marca de la tarjeta.'
            );

            return;
        }

        if (!cupoTotal) {

            Alert.alert(
                'Atención',
                'Ingresa el cupo total de la tarjeta.'
            );

            return;
        }

        const usuarioActual =
            auth.currentUser;

        if (!usuarioActual) {

            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );

            return;
        }

        const cupoNumero =
            parseFloat(cupoTotal);

        if (
            isNaN(cupoNumero) ||
            cupoNumero <= 0
        ) {

            Alert.alert(
                'Atención',
                'Ingresa un cupo válido.'
            );

            return;
        }

        const tarjetasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        const nuevaTarjetaRef =
            push(tarjetasRef);

        const datosTarjeta = {

            tipo: 'tarjeta',

            categoria:
                'Tarjeta de Crédito',

            entidad:
                bancoTarjeta,

            marcaTarjeta:
                marcaTarjeta,

            cupoTotal:
                cupoNumero,

            saldoUtilizado:
                0,

            saldoDisponible:
                cupoNumero,

            fechaCaducidad:
                fechaCaducidad || 'N/A',

            fechaRegistro:
                new Date().toISOString(),

            usuarioEmail:
                usuarioActual.email,

            autor:
                obtenerAutor(
                    usuarioActual.email
                ),
        };

        set(
            nuevaTarjetaRef,
            datosTarjeta
        )
            .then(() => {

                Alert.alert(
                    '¡Éxito!',
                    'Tarjeta registrada correctamente.'
                );

                limpiarFormulario();

                navigation.goBack();
            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    error?.message ||
                        'No se pudo registrar la tarjeta.'
                );
            });
    }

    // ============================================================
    // GUARDAR CONSUMO DE TARJETA
    // ============================================================

    function guardarConsumo() {

        if (!idPareja) {

            Alert.alert(
                'Atención',
                'No se encontró el código de pareja configurado.'
            );

            return;
        }

        if (!tarjetaConsumoId) {

            Alert.alert(
                'Atención',
                'Selecciona a qué tarjeta pertenece este consumo.'
            );

            return;
        }

        if (!montoConsumo) {

            Alert.alert(
                'Atención',
                'Ingresa el monto del consumo.'
            );

            return;
        }

        const montoNumero =
            parseFloat(montoConsumo);

        if (
            isNaN(montoNumero) ||
            montoNumero <= 0
        ) {

            Alert.alert(
                'Atención',
                'Ingresa un monto de consumo válido.'
            );

            return;
        }

        if (esDiferido === null) {

            Alert.alert(
                'Atención',
                'Indica si el consumo es diferido o no.'
            );

            return;
        }

        let cuotas = 1;

        if (esDiferido === true) {

            if (!numeroCuotasConsumo) {

                Alert.alert(
                    'Atención',
                    'Ingresa a cuántas cuotas vas a diferir el consumo.'
                );

                return;
            }

            cuotas =
                parseInt(
                    numeroCuotasConsumo
                );

            if (
                isNaN(cuotas) ||
                cuotas <= 0
            ) {

                Alert.alert(
                    'Atención',
                    'Ingresa un número de cuotas válido.'
                );

                return;
            }

            if (!valorCuotaConsumo) {

                Alert.alert(
                    'Atención',
                    'Ingresa el valor de la cuota.'
                );

                return;
            }
        }

        const usuarioActual =
            auth.currentUser;

        if (!usuarioActual) {

            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );

            return;
        }

        const tarjetaElegida =
            tarjetasDisponibles.find(
                (tarjeta) =>
                    tarjeta.id ===
                    tarjetaConsumoId
            );

        if (!tarjetaElegida) {

            Alert.alert(
                'Error',
                'No se encontró la tarjeta seleccionada.'
            );

            return;
        }

        let cuotaFinal = montoNumero;

        if (esDiferido === true) {

            cuotaFinal =
                parseFloat(
                    valorCuotaConsumo
                );

            if (
                isNaN(cuotaFinal) ||
                cuotaFinal <= 0
            ) {

                Alert.alert(
                    'Atención',
                    'Ingresa un valor de cuota válido.'
                );

                return;
            }
        }

        const cupo =
            Number(
                tarjetaElegida.cupoTotal
            ) || 0;

        if (montoNumero > cupo) {

            Alert.alert(
                'Cupo insuficiente',
                `El consumo de $${montoNumero.toFixed(
                    2
                )} supera el cupo total de $${cupo.toFixed(
                    2
                )}.`
            );

            return;
        }

        const deudasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        const nuevoConsumoRef =
            push(deudasRef);

        const datosConsumo = {

            tipo:
                'consumoTarjeta',

            categoria:
                'Tarjeta de Crédito',

            tarjetaId:
                tarjetaConsumoId,

            tarjetaBanco:
                tarjetaElegida.banco,

            tarjetaMarca:
                tarjetaElegida.marca,

            monto:
                montoNumero,

            diferido:
                esDiferido,

            numeroCuotas:
                cuotas,

            cuotaPagar:
                Number(
                    cuotaFinal.toFixed(2)
                ),

            valorCuota:
                Number(
                    cuotaFinal.toFixed(2)
                ),

            descripcion:
                descripcionConsumo ||
                'Consumo con tarjeta',

            fechaMaxPago:
                fechaConsumo ||
                'N/A',

            fechaRegistro:
                new Date().toISOString(),

            usuarioEmail:
                usuarioActual.email,

            autor:
                obtenerAutor(
                    usuarioActual.email
                ),
        };

        set(
            nuevoConsumoRef,
            datosConsumo
        )
            .then(() => {

                Alert.alert(
                    '¡Éxito!',
                    `Consumo registrado correctamente.\n\nValor de la cuota: $${cuotaFinal.toFixed(
                        2
                    )}`
                );

                limpiarFormulario();

                navigation.goBack();
            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    error?.message ||
                        'No se pudo registrar el consumo.'
                );
            });
    }

    // ============================================================
    // GUARDAR DEUDA GENERAL
    // ============================================================

    function guardarDeudaGeneral() {

        if (!idPareja) {

            Alert.alert(
                'Atención',
                'No se encontró el código de pareja configurado.'
            );

            return;
        }

        if (!categoriaSeleccionada) {

            Alert.alert(
                'Atención',
                'Por favor selecciona un tipo de deuda.'
            );

            return;
        }

        if (
            !subEntidad ||
            !monto ||
            !cuotaPagar
        ) {

            Alert.alert(
                'Atención',
                'Debes completar la entidad/banco, el monto total y la cuota a pagar.'
            );

            return;
        }

        const usuarioActual =
            auth.currentUser;

        if (!usuarioActual) {

            Alert.alert(
                'Error',
                'No hay un usuario logueado.'
            );

            return;
        }

        const montoNumero =
            parseFloat(monto);

        const cuotaNumero =
            parseFloat(cuotaPagar);

        if (
            isNaN(montoNumero) ||
            montoNumero <= 0
        ) {

            Alert.alert(
                'Atención',
                'Ingresa un monto válido.'
            );

            return;
        }

        if (
            isNaN(cuotaNumero) ||
            cuotaNumero <= 0
        ) {

            Alert.alert(
                'Atención',
                'Ingresa una cuota válida.'
            );

            return;
        }

        const deudasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        const nuevaDeudaRef =
            push(deudasRef);

        const datosDeuda = {

            tipo:
                'deuda',

            categoria:
                categoriaSeleccionada,

            entidad:
                subEntidad,

            monto:
                montoNumero,

            cuotaPagar:
                cuotaNumero,

            numeroCuotas:
                (
                    categoriaSeleccionada ===
                        'Préstamo Bancario' ||
                    categoriaSeleccionada ===
                        'Casa Comercial'
                )
                    ? parseInt(
                          numeroCuotas
                      ) || 1
                    : 1,

            fechaMaxPago:
                fechaMaxPago ||
                'N/A',

            fechaRegistro:
                new Date().toISOString(),

            usuarioEmail:
                usuarioActual.email,

            autor:
                obtenerAutor(
                    usuarioActual.email
                ),
        };

        set(
            nuevaDeudaRef,
            datosDeuda
        )
            .then(() => {

                Alert.alert(
                    '¡Éxito!',
                    'Deuda registrada correctamente.'
                );

                limpiarFormulario();

                navigation.goBack();
            })
            .catch((error) => {

                Alert.alert(
                    'Error',
                    error?.message ||
                        'No se pudo registrar la deuda.'
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
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >

                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>
                        💳
                    </Text>
                </View>

                <Text style={styles.titulo}>
                    Registro de Deudas
                </Text>

                <Text style={styles.subtitulo}>
                    Controla tus compromisos y
                    obligaciones financieras
                </Text>

                <View style={styles.sectionHeader}>
                    <View style={styles.numberCircle}>
                        <Text style={styles.numberText}>
                            1
                        </Text>
                    </View>

                    <Text style={styles.labelSection}>
                        Selecciona el tipo de deuda
                    </Text>
                </View>

                <View style={styles.gridCategorias}>

                    <TouchableOpacity
                        style={[
                            styles.catCard,
                            categoriaSeleccionada ===
                                'Tarjeta de Crédito' &&
                                styles.catSelected,
                        ]}
                        onPress={() =>
                            seleccionarCategoria(
                                'Tarjeta de Crédito'
                            )
                        }
                    >
                        <Text style={styles.catIcon}>
                            💳
                        </Text>

                        <Text style={styles.catText}>
                            Tarjeta de Crédito
                        </Text>

                        {categoriaSeleccionada ===
                            'Tarjeta de Crédito' && (
                            <View
                                style={styles.selectedMark}
                            >
                                <Text>
                                    ✓
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.catCard,
                            categoriaSeleccionada ===
                                'Préstamo Bancario' &&
                                styles.catSelected,
                        ]}
                        onPress={() =>
                            seleccionarCategoria(
                                'Préstamo Bancario'
                            )
                        }
                    >
                        <Text style={styles.catIcon}>
                            🏦
                        </Text>

                        <Text style={styles.catText}>
                            Préstamos
                        </Text>

                        {categoriaSeleccionada ===
                            'Préstamo Bancario' && (
                            <View
                                style={styles.selectedMark}
                            >
                                <Text>
                                    ✓
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.catCard,
                            categoriaSeleccionada ===
                                'Casa Comercial' &&
                                styles.catSelected,
                        ]}
                        onPress={() =>
                            seleccionarCategoria(
                                'Casa Comercial'
                            )
                        }
                    >
                        <Text style={styles.catIcon}>
                            🏬
                        </Text>

                        <Text style={styles.catText}>
                            Casas Comerciales
                        </Text>

                        {categoriaSeleccionada ===
                            'Casa Comercial' && (
                            <View
                                style={styles.selectedMark}
                            >
                                <Text>
                                    ✓
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.catCard,
                            categoriaSeleccionada ===
                                'Operadora Celular' &&
                                styles.catSelected,
                        ]}
                        onPress={() =>
                            seleccionarCategoria(
                                'Operadora Celular'
                            )
                        }
                    >
                        <Text style={styles.catIcon}>
                            📱
                        </Text>

                        <Text style={styles.catText}>
                            Planes Celular
                        </Text>

                        {categoriaSeleccionada ===
                            'Operadora Celular' && (
                            <View
                                style={styles.selectedMark}
                            >
                                <Text>
                                    ✓
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.catCardWide,
                            categoriaSeleccionada ===
                                'Deuda Familiar' &&
                                styles.catSelected,
                        ]}
                        onPress={() =>
                            seleccionarCategoria(
                                'Deuda Familiar'
                            )
                        }
                    >
                        <Text style={styles.catIcon}>
                            👥
                        </Text>

                        <View style={styles.catWideText}>
                            <Text style={styles.catText}>
                                Cuentas por Pagar
                            </Text>

                            <Text
                                style={
                                    styles.catDescription
                                }
                            >
                                Familiares / Personales
                            </Text>
                        </View>

                        {categoriaSeleccionada ===
                            'Deuda Familiar' && (
                            <View
                                style={styles.selectedMark}
                            >
                                <Text>
                                    ✓
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                </View>

                {/* TARJETA */}

                {categoriaSeleccionada ===
                    'Tarjeta de Crédito' && (

                    <View style={styles.subContainer}>

                        <View
                            style={styles.sectionHeader}
                        >
                            <View
                                style={styles.numberCircle}
                            >
                                <Text
                                    style={
                                        styles.numberText
                                    }
                                >
                                    2
                                </Text>
                            </View>

                            <Text
                                style={
                                    styles.labelSection
                                }
                            >
                                ¿Qué quieres hacer?
                            </Text>
                        </View>

                        <View style={styles.modoRow}>

                            <TouchableOpacity
                                style={[
                                    styles.modoButton,
                                    modoTarjeta ===
                                        'nueva' &&
                                        styles.modoButtonSelected,
                                ]}
                                onPress={() =>
                                    setModoTarjeta(
                                        'nueva'
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.modoIcon
                                    }
                                >
                                    ➕
                                </Text>

                                <Text
                                    style={
                                        styles.modoButtonText
                                    }
                                >
                                    Registrar
                                </Text>

                                <Text
                                    style={
                                        styles.modoSubText
                                    }
                                >
                                    Tarjeta Nueva
                                </Text>

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modoButton,
                                    modoTarjeta ===
                                        'consumo' &&
                                        styles.modoButtonSelected,
                                ]}
                                onPress={() =>
                                    setModoTarjeta(
                                        'consumo'
                                    )
                                }
                            >
                                <Text
                                    style={
                                        styles.modoIcon
                                    }
                                >
                                    💰
                                </Text>

                                <Text
                                    style={
                                        styles.modoButtonText
                                    }
                                >
                                    Registrar
                                </Text>

                                <Text
                                    style={
                                        styles.modoSubText
                                    }
                                >
                                    Consumo
                                </Text>

                            </TouchableOpacity>

                        </View>

                        {/* NUEVA TARJETA */}

                        {modoTarjeta === 'nueva' && (

                            <View
                                style={
                                    styles.formCard
                                }
                            >

                                <View
                                    style={
                                        styles.formTitleRow
                                    }
                                >
                                    <Text
                                        style={
                                            styles.formTitleIcon
                                        }
                                    >
                                        💳
                                    </Text>

                                    <Text
                                        style={
                                            styles.formTitle
                                        }
                                    >
                                        Nueva tarjeta
                                    </Text>
                                </View>

                                <Text style={styles.label}>
                                    Selecciona el Banco
                                </Text>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={
                                        false
                                    }
                                    contentContainerStyle={
                                        styles.chipsScrollContent
                                    }
                                >
                                    {[
                                        'Banco Guayaquil',
                                        'Banco Pichincha',
                                        'Produbanco',
                                        'Banco Pacífico',
                                        'Banco Internacional',
                                        'Banco Bolivariano',
                                        'Banco del Austro',
                                        'Diners Club',
                                    ].map((banco) => (

                                        <TouchableOpacity
                                            key={banco}
                                            style={[
                                                styles.chip,
                                                bancoTarjeta ===
                                                    banco &&
                                                    styles.chipSelected,
                                            ]}
                                            onPress={() =>
                                                setBancoTarjeta(
                                                    banco
                                                )
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.chipText
                                                }
                                            >
                                                {banco}
                                            </Text>
                                        </TouchableOpacity>

                                    ))}
                                </ScrollView>

                                <Text style={styles.label}>
                                    Selecciona la Marca
                                </Text>

                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={
                                        false
                                    }
                                    contentContainerStyle={
                                        styles.chipsScrollContent
                                    }
                                >
                                    {[
                                        'Visa',
                                        'Mastercard',
                                        'American Express',
                                    ].map((marca) => (

                                        <TouchableOpacity
                                            key={marca}
                                            style={[
                                                styles.chip,
                                                marcaTarjeta ===
                                                    marca &&
                                                    styles.chipSelected,
                                            ]}
                                            onPress={() =>
                                                setMarcaTarjeta(
                                                    marca
                                                )
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.chipText
                                                }
                                            >
                                                {marca}
                                            </Text>
                                        </TouchableOpacity>

                                    ))}
                                </ScrollView>

                                <Text style={styles.label}>
                                    Cupo Total ($)
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 2000.00"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={cupoTotal}
                                    onChangeText={
                                        setCupoTotal
                                    }
                                />

                                <Text style={styles.label}>
                                    Fecha de caducidad
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 12/28"
                                    placeholderTextColor="#64748B"
                                    value={
                                        fechaCaducidad
                                    }
                                    onChangeText={
                                        setFechaCaducidad
                                    }
                                />

                                <TouchableOpacity
                                    style={
                                        styles.primaryButton
                                    }
                                    onPress={
                                        guardarTarjetaNueva
                                    }
                                >
                                    <Text
                                        style={
                                            styles.primaryButtonText
                                        }
                                    >
                                        Guardar Tarjeta
                                    </Text>
                                </TouchableOpacity>

                            </View>
                        )}

                        {/* CONSUMO */}

                        {modoTarjeta === 'consumo' && (

                            <View
                                style={
                                    styles.formCard
                                }
                            >

                                <View
                                    style={
                                        styles.formTitleRow
                                    }
                                >
                                    <Text
                                        style={
                                            styles.formTitleIcon
                                        }
                                    >
                                        💰
                                    </Text>

                                    <Text
                                        style={
                                            styles.formTitle
                                        }
                                    >
                                        Registrar consumo
                                    </Text>
                                </View>

                                <Text style={styles.label}>
                                    Selecciona la tarjeta
                                </Text>

                                {tarjetasDisponibles.length ===
                                0 ? (

                                    <View
                                        style={
                                            styles.avisoCard
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.avisoIcon
                                            }
                                        >
                                            ℹ️
                                        </Text>

                                        <Text
                                            style={
                                                styles.avisoTexto
                                            }
                                        >
                                            Todavía no tienes
                                            tarjetas registradas.
                                            Usa "Registrar Tarjeta
                                            Nueva" primero.
                                        </Text>
                                    </View>

                                ) : (

                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={
                                            false
                                        }
                                        contentContainerStyle={
                                            styles.chipsScrollContent
                                        }
                                    >
                                        {tarjetasDisponibles.map(
                                            (tarjeta) => (

                                                <TouchableOpacity
                                                    key={
                                                        tarjeta.id
                                                    }
                                                    style={[
                                                        styles.cardTarjeta,
                                                        tarjetaConsumoId ===
                                                            tarjeta.id &&
                                                            styles.cardTarjetaSelected,
                                                    ]}
                                                    onPress={() =>
                                                        setTarjetaConsumoId(
                                                            tarjeta.id
                                                        )
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.cardTarjetaMarca
                                                        }
                                                    >
                                                        {
                                                            tarjeta.marca
                                                        }
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.cardTarjetaBanco
                                                        }
                                                    >
                                                        {
                                                            tarjeta.banco
                                                        }
                                                    </Text>

                                                    <Text
                                                        style={
                                                            styles.cardTarjetaCupo
                                                        }
                                                    >
                                                        Cupo: $
                                                        {
                                                            tarjeta.cupoTotal
                                                                .toFixed(
                                                                    2
                                                                )
                                                        }
                                                    </Text>

                                                </TouchableOpacity>

                                            )
                                        )}
                                    </ScrollView>
                                )}

                                <Text style={styles.label}>
                                    Monto del consumo ($)
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 1000.00"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={
                                        montoConsumo
                                    }
                                    onChangeText={
                                        setMontoConsumo
                                    }
                                />

                                <Text style={styles.label}>
                                    Descripción
                                    <Text
                                        style={
                                            styles.optionalText
                                        }
                                    >
                                        {' '}(
                                        opcional)
                                    </Text>
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Compra en Fybeca"
                                    placeholderTextColor="#64748B"
                                    value={
                                        descripcionConsumo
                                    }
                                    onChangeText={
                                        setDescripcionConsumo
                                    }
                                />

                                <Text style={styles.label}>
                                    ¿Vas a diferir este consumo?
                                </Text>

                                <View
                                    style={
                                        styles.toggleRow
                                    }
                                >

                                    <TouchableOpacity
                                        style={[
                                            styles.toggleButton,
                                            esDiferido ===
                                                false &&
                                                styles.toggleButtonSelected,
                                        ]}
                                        onPress={() => {

                                            setEsDiferido(
                                                false
                                            );

                                            setNumeroCuotasConsumo(
                                                ''
                                            );

                                            setValorCuotaConsumo(
                                                ''
                                            );
                                        }}
                                    >
                                        <Text
                                            style={
                                                styles.toggleIcon
                                            }
                                        >
                                            ✓
                                        </Text>

                                        <Text
                                            style={
                                                styles.toggleText
                                            }
                                        >
                                            No diferir
                                        </Text>

                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.toggleButton,
                                            esDiferido ===
                                                true &&
                                                styles.toggleButtonSelected,
                                        ]}
                                        onPress={() =>
                                            setEsDiferido(
                                                true
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.toggleIcon
                                            }
                                        >
                                            📅
                                        </Text>

                                        <Text
                                            style={
                                                styles.toggleText
                                            }
                                        >
                                            Diferir
                                        </Text>

                                    </TouchableOpacity>

                                </View>

                                {esDiferido === true && (

                                    <>

                                        <Text style={styles.label}>
                                            ¿A cuántas cuotas?
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.input
                                            }
                                            placeholder="Ej. 10"
                                            placeholderTextColor="#64748B"
                                            keyboardType="numeric"
                                            value={
                                                numeroCuotasConsumo
                                            }
                                            onChangeText={
                                                setNumeroCuotasConsumo
                                            }
                                        />

                                        <Text style={styles.label}>
                                            Valor de la cuota ($)
                                        </Text>

                                        <TextInput
                                            style={
                                                styles.input
                                            }
                                            placeholder="Ingrese el valor de la cuota"
                                            placeholderTextColor="#64748B"
                                            keyboardType="numeric"
                                            value={
                                                valorCuotaConsumo
                                            }
                                            onChangeText={
                                                setValorCuotaConsumo
                                            }
                                        />

                                        {valorCuotaConsumo &&
                                            parseFloat(
                                                valorCuotaConsumo
                                            ) > 0 && (

                                                <View
                                                    style={
                                                        styles.cuotaCalculadaCard
                                                    }
                                                >

                                                    <View
                                                        style={
                                                            styles.cuotaIconCircle
                                                        }
                                                    >
                                                        <Text>
                                                            💰
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={
                                                            styles.cuotaInfo
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.cuotaCalculadaTitulo
                                                            }
                                                        >
                                                            Valor de la cuota
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.cuotaCalculadaMonto
                                                            }
                                                        >
                                                            $
                                                            {parseFloat(
                                                                valorCuotaConsumo
                                                            ).toFixed(
                                                                2
                                                            )}
                                                        </Text>

                                                        <Text
                                                            style={
                                                                styles.cuotaCalculadaDetalle
                                                            }
                                                        >
                                                            {montoConsumo
                                                                ? `$${parseFloat(
                                                                      montoConsumo
                                                                  ).toFixed(
                                                                      2
                                                                  )} a ${numeroCuotasConsumo} cuotas`
                                                                : 'Ingresa el monto del consumo'}
                                                        </Text>
                                                    </View>

                                                </View>
                                            )}

                                    </>
                                )}

                                {esDiferido === false &&
                                    parseFloat(
                                        montoConsumo
                                    ) > 0 && (

                                        <View
                                            style={
                                                styles.cuotaCalculadaCard
                                            }
                                        >

                                            <View
                                                style={
                                                    styles.cuotaIconCircle
                                                }
                                            >
                                                <Text>
                                                    💰
                                                </Text>
                                            </View>

                                            <View
                                                style={
                                                    styles.cuotaInfo
                                                }
                                            >

                                                <Text
                                                    style={
                                                        styles.cuotaCalculadaTitulo
                                                    }
                                                >
                                                    Pago pendiente
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.cuotaCalculadaMonto
                                                    }
                                                >
                                                    $
                                                    {parseFloat(
                                                        montoConsumo
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.cuotaCalculadaDetalle
                                                    }
                                                >
                                                    Pago completo
                                                </Text>

                                            </View>

                                        </View>
                                    )}

                                <Text style={styles.label}>
                                    Fecha máxima de pago
                                </Text>

                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. 2026-08-30"
                                    placeholderTextColor="#64748B"
                                    value={
                                        fechaConsumo
                                    }
                                    onChangeText={
                                        setFechaConsumo
                                    }
                                />

                                <TouchableOpacity
                                    style={
                                        styles.primaryButton
                                    }
                                    onPress={
                                        guardarConsumo
                                    }
                                >
                                    <Text
                                        style={
                                            styles.primaryButtonText
                                        }
                                    >
                                        Guardar Consumo
                                    </Text>
                                </TouchableOpacity>

                            </View>
                        )}

                    </View>
                )}

                {/* PRESTAMO */}

                {categoriaSeleccionada ===
                    'Préstamo Bancario' && (

                    <View style={styles.subContainer}>

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            <Text style={styles.label}>
                                Selecciona el Banco
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={
                                    false
                                }
                                contentContainerStyle={
                                    styles.chipsScrollContent
                                }
                            >
                                {[
                                    'Banco Guayaquil',
                                    'Banco Pichincha',
                                    'Produbanco',
                                    'Banco Pacífico',
                                    'Banco Internacional',
                                    'Banco Bolivariano',
                                    'Banco del Austro',
                                    'Diners Club',
                                ].map((banco) => (

                                    <TouchableOpacity
                                        key={banco}
                                        style={[
                                            styles.chip,
                                            subEntidad ===
                                                banco &&
                                                styles.chipSelected,
                                        ]}
                                        onPress={() =>
                                            setSubEntidad(
                                                banco
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.chipText
                                            }
                                        >
                                            {banco}
                                        </Text>
                                    </TouchableOpacity>

                                ))}
                            </ScrollView>

                        </View>

                    </View>
                )}

                {/* CASA COMERCIAL */}

                {categoriaSeleccionada ===
                    'Casa Comercial' && (

                    <View style={styles.subContainer}>

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            <Text style={styles.label}>
                                Selecciona la Casa Comercial
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={
                                    false
                                }
                                contentContainerStyle={
                                    styles.chipsScrollContent
                                }
                            >
                                {[
                                    'De Prati',
                                    'Computron',
                                    'Marcimex',
                                    'Etafashion',
                                    'Pycca',
                                    'Almacenes Tía',
                                    'Jiman',
                                ].map((tienda) => (

                                    <TouchableOpacity
                                        key={tienda}
                                        style={[
                                            styles.chip,
                                            subEntidad ===
                                                tienda &&
                                                styles.chipSelected,
                                        ]}
                                        onPress={() =>
                                            setSubEntidad(
                                                tienda
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.chipText
                                            }
                                        >
                                            {tienda}
                                        </Text>
                                    </TouchableOpacity>

                                ))}
                            </ScrollView>

                        </View>

                    </View>
                )}

                {/* OPERADORA */}

                {categoriaSeleccionada ===
                    'Operadora Celular' && (

                    <View style={styles.subContainer}>

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            <Text style={styles.label}>
                                Selecciona la Operadora
                            </Text>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={
                                    false
                                }
                                contentContainerStyle={
                                    styles.chipsScrollContent
                                }
                            >
                                {[
                                    'Claro',
                                    'Movistar',
                                    'Tuenti',
                                ].map((op) => (

                                    <TouchableOpacity
                                        key={op}
                                        style={[
                                            styles.chip,
                                            subEntidad ===
                                                op &&
                                                styles.chipSelected,
                                        ]}
                                        onPress={() =>
                                            setSubEntidad(
                                                op
                                            )
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.chipText
                                            }
                                        >
                                            {op}
                                        </Text>
                                    </TouchableOpacity>

                                ))}
                            </ScrollView>

                        </View>

                    </View>
                )}

                {/* DEUDA FAMILIAR */}

                {categoriaSeleccionada ===
                    'Deuda Familiar' && (

                    <View style={styles.subContainer}>

                        <View
                            style={
                                styles.formCard
                            }
                        >

                            <Text style={styles.label}>
                                Nombre de la Persona
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ej. Préstamo a Papá / Hermana"
                                placeholderTextColor="#64748B"
                                value={subEntidad}
                                onChangeText={
                                    setSubEntidad
                                }
                            />

                        </View>

                    </View>
                )}

                {/* FORMULARIO DEUDA GENERAL */}

                {categoriaSeleccionada &&
                    categoriaSeleccionada !==
                        'Tarjeta de Crédito' && (

                    <View
                        style={
                            styles.formCard
                        }
                    >

                        <View
                            style={
                                styles.formTitleRow
                            }
                        >
                            <Text
                                style={
                                    styles.formTitleIcon
                                }
                            >
                                💰
                            </Text>

                            <Text
                                style={
                                    styles.formTitle
                                }
                            >
                                Información de la deuda
                            </Text>
                        </View>

                        <Text style={styles.label}>
                            Monto Total de la Deuda ($)
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej. 300.00"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            value={monto}
                            onChangeText={setMonto}
                        />

                        <Text style={styles.label}>
                            Cuota a pagar ($)
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej. 50.00"
                            placeholderTextColor="#64748B"
                            keyboardType="numeric"
                            value={cuotaPagar}
                            onChangeText={
                                setCuotaPagar
                            }
                        />

                        {(categoriaSeleccionada ===
                            'Préstamo Bancario' ||
                            categoriaSeleccionada ===
                                'Casa Comercial') && (

                            <>
                                <Text style={styles.label}>
                                    ¿Cuántas cuotas son?
                                </Text>

                                <TextInput
                                    style={
                                        styles.input
                                    }
                                    placeholder="Ej. 12"
                                    placeholderTextColor="#64748B"
                                    keyboardType="numeric"
                                    value={
                                        numeroCuotas
                                    }
                                    onChangeText={
                                        setNumeroCuotas
                                    }
                                />
                            </>
                        )}

                        <Text style={styles.label}>
                            Fecha máxima de pago
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ej. 2026-08-30"
                            placeholderTextColor="#64748B"
                            value={
                                fechaMaxPago
                            }
                            onChangeText={
                                setFechaMaxPago
                            }
                        />

                        <TouchableOpacity
                            style={
                                styles.primaryButton
                            }
                            onPress={
                                guardarDeudaGeneral
                            }
                        >
                            <Text
                                style={
                                    styles.primaryButtonText
                                }
                            >
                                Guardar Deuda
                            </Text>
                        </TouchableOpacity>

                    </View>
                )}

                {/* VOLVER */}

                <TouchableOpacity
                    style={
                        styles.secondaryButton
                    }
                    onPress={() =>
                        navigation.goBack()
                    }
                >
                    <Text
                        style={
                            styles.secondaryButtonText
                        }
                    >
                        ← Volver al Panel
                    </Text>
                </TouchableOpacity>

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
        backgroundColor: '#0F172A',

        ...Platform.select({
            web: {
                height: '100vh' as any,
                overflow: 'hidden' as any,
            },
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
        paddingTop: 35,
        paddingBottom: 80,
    },

    headerIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        backgroundColor: '#3B1720',
        borderWidth: 1,
        borderColor: '#EF4444',
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    headerIconText: {
        fontSize: 28,
    },

    titulo: {
        textAlign: 'center',
        fontSize: 26,
        fontWeight: '800',
        color: '#EF4444',
        marginBottom: 7,
    },

    subtitulo: {
        textAlign: 'center',
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 28,
        lineHeight: 20,
    },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    numberCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    numberText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },

    labelSection: {
        color: '#F8FAFC',
        fontSize: 15,
        fontWeight: '700',
        flex: 1,
    },

    gridCategorias: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    catCard: {
        backgroundColor: '#1E293B',
        width: '48%',
        minHeight: 105,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },

    catCardWide: {
        backgroundColor: '#1E293B',
        width: '100%',
        minHeight: 82,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },

    catSelected: {
        borderColor: '#EF4444',
        backgroundColor: '#351923',
        shadowColor: '#EF4444',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },

    catIcon: {
        fontSize: 27,
        marginBottom: 8,
    },

    catText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },

    catWideText: {
        alignItems: 'center',
    },

    catDescription: {
        color: '#94A3B8',
        fontSize: 11,
        marginTop: 3,
    },

    selectedMark: {
        position: 'absolute',
        right: 8,
        top: 8,
        width: 21,
        height: 21,
        borderRadius: 11,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },

    subContainer: {
        marginBottom: 8,
    },

    label: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 7,
        marginTop: 9,
    },

    optionalText: {
        color: '#64748B',
        fontWeight: '400',
    },

    chipsScrollContent: {
        paddingRight: 15,
        paddingVertical: 3,
        alignItems: 'center',
    },

    chip: {
        backgroundColor: '#0F172A',
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
    },

    chipSelected: {
        backgroundColor: '#3B1720',
        borderColor: '#EF4444',
    },

    chipText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '600',
    },

    formCard: {
        backgroundColor: '#1E293B',
        padding: 20,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 17,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },

    formTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingBottom: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },

    formTitleIcon: {
        fontSize: 22,
        marginRight: 9,
    },

    formTitle: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '800',
    },

    input: {
        backgroundColor: '#0F172A',
        borderWidth: 1,
        borderColor: '#334155',
        borderRadius: 11,
        paddingHorizontal: 14,
        paddingVertical: 13,
        color: '#F8FAFC',
        fontSize: 15,
        marginBottom: 8,
    },

    primaryButton: {
        backgroundColor: '#EF4444',
        marginTop: 18,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },

    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#475569',
        marginTop: 2,
    },

    secondaryButtonText: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '700',
    },

    modoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 17,
    },

    modoButton: {
        backgroundColor: '#1E293B',
        width: '48%',
        minHeight: 105,
        paddingVertical: 13,
        paddingHorizontal: 8,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#334155',
        alignItems: 'center',
        justifyContent: 'center',
    },

    modoButtonSelected: {
        borderColor: '#EF4444',
        backgroundColor: '#351923',
    },

    modoIcon: {
        fontSize: 25,
        marginBottom: 6,
    },

    modoButtonText: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
    },

    modoSubText: {
        color: '#94A3B8',
        fontSize: 11,
        marginTop: 3,
    },

    toggleRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },

    toggleButton: {
        flex: 1,
        backgroundColor: '#0F172A',
        minHeight: 50,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    toggleButtonSelected: {
        backgroundColor: '#351923',
        borderColor: '#EF4444',
    },

    toggleIcon: {
        fontSize: 14,
        marginRight: 7,
    },

    toggleText: {
        color: '#F8FAFC',
        fontSize: 13,
        fontWeight: '700',
    },

    avisoCard: {
        backgroundColor: '#332B16',
        borderWidth: 1,
        borderColor: '#A16207',
        borderRadius: 11,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    avisoIcon: {
        fontSize: 18,
        marginRight: 9,
    },

    avisoTexto: {
        color: '#FBBF24',
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },

    cardTarjeta: {
        backgroundColor: '#0F172A',
        minWidth: 155,
        paddingHorizontal: 15,
        paddingVertical: 13,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: '#334155',
        marginRight: 9,
    },

    cardTarjetaSelected: {
        backgroundColor: '#351923',
        borderColor: '#EF4444',
    },

    cardTarjetaMarca: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 3,
    },

    cardTarjetaBanco: {
        color: '#94A3B8',
        fontSize: 12,
        marginBottom: 7,
    },

    cardTarjetaCupo: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
    },

    cuotaCalculadaCard: {
        backgroundColor: '#0F172A',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#10B981',
        padding: 15,
        marginTop: 3,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },

    cuotaIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#12352C',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    cuotaInfo: {
        flex: 1,
    },

    cuotaCalculadaTitulo: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 2,
    },

    cuotaCalculadaMonto: {
        color: '#10B981',
        fontSize: 25,
        fontWeight: '800',
        marginBottom: 2,
    },

    cuotaCalculadaDetalle: {
        color: '#64748B',
        fontSize: 11,
    },

});