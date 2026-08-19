import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
} from 'react-native';
import React, { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, push, set, onValue, get } from 'firebase/database';
import { useTheme, Tema } from '../../context/ThemeContext';

type TarjetaRegistrada = {
    id: string;
    banco: string;
    marca: string;
    cupoTotal: number;
    fechaCaducidad: string;
};

type PersonaCodigo = {
    uid: string;
    nombre: string;
    apellido: string;
    parentesco?: string;
};

export default function RegistroDeudasScreen({ navigation }: any) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
    const [modalCuentasVisible, setModalCuentasVisible] = useState(false);

    const [subEntidad, setSubEntidad] = useState('');
    const [monto, setMonto] = useState('');
    const [cuotaPagar, setCuotaPagar] = useState('');
    const [numeroCuotas, setNumeroCuotas] = useState('');
    const [fechaMaxPago, setFechaMaxPago] = useState('');
    const [cupoDisponible, setCupoDisponible] = useState('');

    const [nombrePersona, setNombrePersona] = useState('');
    const [apellidoPersona, setApellidoPersona] = useState('');
    const [parentescoPersona, setParentescoPersona] = useState('');
    const [usarCodigoPersona, setUsarCodigoPersona] = useState(false);
    const [codigoPersona, setCodigoPersona] = useState('');
    const [personaEncontrada, setPersonaEncontrada] = useState<PersonaCodigo | null>(null);
    const [buscandoCodigo, setBuscandoCodigo] = useState(false);
    const [formaPagoCobrar, setFormaPagoCobrar] = useState<'corriente' | 'diferido' | null>(null);
    const [cuotasCobrar, setCuotasCobrar] = useState('');
    const [valorCuotaCobrar, setValorCuotaCobrar] = useState('');

    const [miCodigoCuenta, setMiCodigoCuenta] = useState('');
    const [cargandoCodigo, setCargandoCodigo] = useState(true);

    const [modoTarjeta, setModoTarjeta] = useState<'nueva' | 'consumo' | null>(null);
    const [bancoTarjeta, setBancoTarjeta] = useState('');
    const [marcaTarjeta, setMarcaTarjeta] = useState('');
    const [cupoTotal, setCupoTotal] = useState('');
    const [fechaCaducidad, setFechaCaducidad] = useState('');
    const [tarjetasDisponibles, setTarjetasDisponibles] = useState<TarjetaRegistrada[]>([]);
    const [tarjetaConsumoId, setTarjetaConsumoId] = useState<string | null>(null);
    const [montoConsumo, setMontoConsumo] = useState('');
    const [esDiferido, setEsDiferido] = useState<boolean | null>(null);
    const [numeroCuotasConsumo, setNumeroCuotasConsumo] = useState('');
    const [valorCuotaConsumo, setValorCuotaConsumo] = useState('');
    const [fechaConsumo, setFechaConsumo] = useState('');
    const [descripcionConsumo, setDescripcionConsumo] = useState('');

    const [idPareja, setIdPareja] = useState<string | null>(null);
    const usuarioActual = auth.currentUser;

    function generarCodigoCuenta() {
        const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let codigo = '';
        for (let i = 0; i < 6; i++) {
            codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return codigo;
    }

    async function cargarMiCodigoCuenta() {
        if (!usuarioActual) {
            setCargandoCodigo(false);
            return;
        }
        try {
            const usuarioRef = ref(db, `usuarios/${usuarioActual.uid}`);
            const snapshot = await get(usuarioRef);
            if (!snapshot.exists()) {
                setCargandoCodigo(false);
                return;
            }
            const datos = snapshot.val();
            if (datos.codigoCuenta) {
                setMiCodigoCuenta(datos.codigoCuenta);
                setCargandoCodigo(false);
                return;
            }
            let codigo = '';
            let existe = true;
            while (existe) {
                codigo = generarCodigoCuenta();
                const codigoRef = ref(db, `codigosCuentas/${codigo}`);
                const codigoSnapshot = await get(codigoRef);
                existe = codigoSnapshot.exists();
            }
            await set(ref(db, `usuarios/${usuarioActual.uid}/codigoCuenta`), codigo);
            await set(ref(db, `codigosCuentas/${codigo}`), {
                uid: usuarioActual.uid,
                fechaRegistro: new Date().toISOString(),
            });
            setMiCodigoCuenta(codigo);
        } catch (error) {
            console.log('Error generando código:', error);
        } finally {
            setCargandoCodigo(false);
        }
    }

    useEffect(() => {
        navigation.setOptions({ headerShown: false });
        if (!usuarioActual) return;
        cargarMiCodigoCuenta();
        const userRef = ref(db, `usuarios/${usuarioActual.uid}`);
        const unsubscribe = onValue(userRef, snapshot => {
            const data = snapshot.val();
            if (data?.idPareja) setIdPareja(data.idPareja);
        }, { onlyOnce: true });
        return () => unsubscribe();
    }, [navigation]);

    async function buscarPersonaPorCodigo() {
        const codigo = codigoPersona.trim().toUpperCase();
        if (!codigo) {
            Alert.alert('Atención', 'Ingresa el código de la persona.');
            return;
        }
        if (codigo === miCodigoCuenta.toUpperCase()) {
            Alert.alert('Código no válido', 'No puedes registrar un préstamo contigo mismo.');
            return;
        }
        setBuscandoCodigo(true);
        setPersonaEncontrada(null);
        try {
            const codigoRef = ref(db, `codigosCuentas/${codigo}`);
            const snapshot = await get(codigoRef);
            if (!snapshot.exists()) {
                Alert.alert('Código no encontrado', 'No existe una cuenta registrada con ese código.');
                return;
            }
            const datosCodigo = snapshot.val();
            const uidPersona = datosCodigo?.uid;
            if (!uidPersona) {
                Alert.alert('Error', 'El código no está asociado correctamente.');
                return;
            }
            const personaRef = ref(db, `usuarios/${uidPersona}`);
            const personaSnapshot = await get(personaRef);
            if (!personaSnapshot.exists()) {
                Alert.alert('Error', 'No se encontró la cuenta de la persona.');
                return;
            }
            const datosPersona = personaSnapshot.val();
            const persona: PersonaCodigo = {
                uid: uidPersona,
                nombre: datosPersona.nombre || 'Usuario',
                apellido: datosPersona.apellido || '',
                parentesco: parentescoPersona || '',
            };
            setPersonaEncontrada(persona);
            if (!nombrePersona) setNombrePersona(datosPersona.nombre || '');
            if (!apellidoPersona) setApellidoPersona(datosPersona.apellido || '');
            Alert.alert('Código válido', `Cuenta encontrada:\n${datosPersona.nombre || ''} ${datosPersona.apellido || ''}`);
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'No se pudo verificar el código.');
        } finally {
            setBuscandoCodigo(false);
        }
    }

    function limpiarFormulario() {
        setCategoriaSeleccionada(null);
        setSubEntidad('');
        setMonto('');
        setCuotaPagar('');
        setNumeroCuotas('');
        setFechaMaxPago('');
        setNombrePersona('');
        setApellidoPersona('');
        setParentescoPersona('');
        setUsarCodigoPersona(false);
        setCodigoPersona('');
        setPersonaEncontrada(null);
        setFormaPagoCobrar(null);
        setCuotasCobrar('');
        setValorCuotaCobrar('');
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

    function seleccionarCategoria(categoria: string) {
        limpiarFormulario();
        setCategoriaSeleccionada(categoria);
    }

    function obtenerAutor(email: string | null | undefined) {
        return email?.toLowerCase().includes('daniela') ? 'Daniela' : 'Daniel';
    }

    function obtenerNombrePropio() {
        return usuarioActual?.displayName || usuarioActual?.email || 'Usuario';
    }

    async function guardarCuentaPorCobrar() {
        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja configurado.');
            return;
        }
        if (!usuarioActual) {
            Alert.alert('Error', 'No hay un usuario logueado.');
            return;
        }
        if (!nombrePersona.trim()) {
            Alert.alert('Atención', 'Ingresa el nombre de la persona.');
            return;
        }
        if (!apellidoPersona.trim()) {
            Alert.alert('Atención', 'Ingresa el apellido de la persona.');
            return;
        }
        if (!monto) {
            Alert.alert('Atención', 'Ingresa el monto prestado.');
            return;
        }
        const montoNumero = parseFloat(monto);
        if (isNaN(montoNumero) || montoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un monto válido.');
            return;
        }
        if (!formaPagoCobrar) {
            Alert.alert('Atención', 'Selecciona si el préstamo es corriente o diferido.');
            return;
        }
        let cuotas = 1;
        let valorCuota = montoNumero;
        if (formaPagoCobrar === 'diferido') {
            if (!cuotasCobrar) {
                Alert.alert('Atención', 'Ingresa el número de cuotas.');
                return;
            }
            cuotas = parseInt(cuotasCobrar);
            if (isNaN(cuotas) || cuotas <= 0) {
                Alert.alert('Atención', 'Ingresa un número de cuotas válido.');
                return;
            }
            if (!valorCuotaCobrar) {
                Alert.alert('Atención', 'Ingresa el valor de la cuota.');
                return;
            }
            valorCuota = parseFloat(valorCuotaCobrar);
            if (isNaN(valorCuota) || valorCuota <= 0) {
                Alert.alert('Atención', 'Ingresa un valor de cuota válido.');
                return;
            }
        }
        if (usarCodigoPersona && !personaEncontrada) {
            Alert.alert('Atención', 'Primero verifica el código de la persona.');
            return;
        }
        try {
            const fecha = new Date().toISOString();
            const operacionRef = push(ref(db, `parejas/${idPareja}/cuentasPorCobrar`));
            const idOperacion = operacionRef.key;
            if (!idOperacion) return;
            const datosPrestamo = {
                tipo: 'cuentaPorCobrar',
                idOperacion,
                categoria: 'Cuenta por Cobrar',
                nombre: nombrePersona.trim(),
                apellido: apellidoPersona.trim(),
                parentesco: parentescoPersona.trim() || 'No especificado',
                monto: Number(montoNumero.toFixed(2)),
                formaPago: formaPagoCobrar,
                numeroCuotas: cuotas,
                valorCuota: Number(valorCuota.toFixed(2)),
                cuotaPagar: Number(valorCuota.toFixed(2)),
                fechaPago: fechaMaxPago || 'N/A',
                fechaRegistro: fecha,
                montoPagado: 0,
                saldoPendiente: Number(montoNumero.toFixed(2)),
                estado: 'Pendiente',
                codigoPersona: usarCodigoPersona ? codigoPersona.trim().toUpperCase() : null,
                uidPersona: usarCodigoPersona && personaEncontrada ? personaEncontrada.uid : null,
                vinculada: usarCodigoPersona && !!personaEncontrada,
                usuarioEmail: usuarioActual.email,
                autor: obtenerAutor(usuarioActual.email),
            };
            await set(operacionRef, datosPrestamo);
            if (usarCodigoPersona && personaEncontrada) {
                const deudaOtraPersonaRef = ref(db, `usuarios/${personaEncontrada.uid}/cuentasPorPagar/${idOperacion}`);
                await set(deudaOtraPersonaRef, {
                    tipo: 'cuentaPorPagar',
                    idOperacion,
                    categoria: 'Cuenta por Pagar',
                    acreedorUid: usuarioActual.uid,
                    acreedorNombre: obtenerNombrePropio(),
                    acreedorCodigo: miCodigoCuenta,
                    deudorNombre: nombrePersona.trim(),
                    deudorApellido: apellidoPersona.trim(),
                    parentesco: parentescoPersona.trim() || 'No especificado',
                    monto: Number(montoNumero.toFixed(2)),
                    formaPago: formaPagoCobrar,
                    numeroCuotas: cuotas,
                    valorCuota: Number(valorCuota.toFixed(2)),
                    cuotaPagar: Number(valorCuota.toFixed(2)),
                    fechaPago: fechaMaxPago || 'N/A',
                    fechaRegistro: fecha,
                    montoPagado: 0,
                    saldoPendiente: Number(montoNumero.toFixed(2)),
                    estado: 'Pendiente',
                    codigoPrestamista: miCodigoCuenta,
                    vinculada: true,
                });
                Alert.alert('¡Préstamo vinculado!', `Se registró el préstamo de $${montoNumero.toFixed(2)} en ambas cuentas.`);
            } else {
                Alert.alert('¡Préstamo registrado!', `La cuenta por cobrar de $${montoNumero.toFixed(2)} quedó registrada únicamente en tu cuenta.`);
            }
            limpiarFormulario();
            navigation.goBack();
        } catch (error: any) {
            console.log('Error guardando cuenta por cobrar:', error);
            Alert.alert('Error', error?.message || 'No se pudo registrar el préstamo.');
        }
    }

    useEffect(() => {
        if (!idPareja) return;
        if (categoriaSeleccionada !== 'Tarjeta de Crédito' || modoTarjeta !== 'consumo') return;
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const unsubscribe = onValue(deudasRef, snapshot => {
            const data = snapshot.val();
            if (!data) {
                setTarjetasDisponibles([]);
                return;
            }
            const lista: TarjetaRegistrada[] = Object.keys(data)
                .filter(key => data[key]?.tipo === 'tarjeta')
                .map(key => ({
                    id: key,
                    banco: data[key]?.entidad || 'Banco',
                    marca: data[key]?.marcaTarjeta || 'Tarjeta',
                    cupoTotal: Number(data[key]?.cupoTotal) || 0,
                    fechaCaducidad: data[key]?.fechaCaducidad || 'N/A',
                }));
            setTarjetasDisponibles(lista);
        });
        return () => unsubscribe();
    }, [idPareja, categoriaSeleccionada, modoTarjeta]);

    async function guardarTarjetaNueva() {
        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja configurado.');
            return;
        }
        if (!bancoTarjeta) {
            Alert.alert('Atención', 'Ingresa el banco de la tarjeta.');
            return;
        }
        if (!marcaTarjeta) {
            Alert.alert('Atención', 'Selecciona la marca de la tarjeta.');
            return;
        }
        const cupoNumero = parseFloat(cupoTotal);
        if (isNaN(cupoNumero) || cupoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un cupo válido.');
            return;
        }
        if (!usuarioActual) return;
        const tarjetasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaTarjetaRef = push(tarjetasRef);
        try {
            await set(nuevaTarjetaRef, {
                tipo: 'tarjeta',
                categoria: 'Tarjeta de Crédito',
                entidad: bancoTarjeta,
                marcaTarjeta,
                cupoTotal: cupoNumero,
                saldoUtilizado: 0,
                saldoDisponible: cupoNumero,
                fechaCaducidad: fechaCaducidad || 'N/A',
                fechaRegistro: new Date().toISOString(),
                usuarioEmail: usuarioActual.email,
                autor: obtenerAutor(usuarioActual.email),
            });
            Alert.alert('¡Tarjeta registrada!', `${marcaTarjeta} registrada correctamente.`);
            limpiarFormulario();
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'No se pudo registrar la tarjeta.');
        }
    }

    async function guardarConsumo() {
        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja.');
            return;
        }
        if (!tarjetaConsumoId) {
            Alert.alert('Atención', 'Selecciona la tarjeta.');
            return;
        }
        const montoNumero = parseFloat(montoConsumo);
        if (isNaN(montoNumero) || montoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un monto válido.');
            return;
        }
        if (esDiferido === null) {
            Alert.alert('Atención', 'Indica si es corriente o diferido.');
            return;
        }
        let cuotas = 1;
        let cuotaFinal = montoNumero;
        if (esDiferido) {
            cuotas = parseInt(numeroCuotasConsumo);
            cuotaFinal = parseFloat(valorCuotaConsumo);
            if (isNaN(cuotas) || cuotas <= 0) {
                Alert.alert('Atención', 'Ingresa las cuotas.');
                return;
            }
            if (isNaN(cuotaFinal) || cuotaFinal <= 0) {
                Alert.alert('Atención', 'Ingresa el valor de cuota.');
                return;
            }
        }
        if (!usuarioActual) return;
        const tarjeta = tarjetasDisponibles.find(t => t.id === tarjetaConsumoId);
        if (!tarjeta) {
            Alert.alert('Error', 'No se encontró la tarjeta.');
            return;
        }
        const cupo = Number(tarjeta.cupoTotal) || 0;
        if (montoNumero > cupo) {
            Alert.alert('Cupo insuficiente', `El consumo supera el cupo de $${cupo.toFixed(2)}.`);
            return;
        }
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevoConsumoRef = push(deudasRef);
        try {
            await set(nuevoConsumoRef, {
                tipo: 'consumoTarjeta',
                categoria: 'Tarjeta de Crédito',
                tarjetaId: tarjetaConsumoId,
                tarjetaBanco: tarjeta.banco,
                tarjetaMarca: tarjeta.marca,
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
            });
            Alert.alert('¡Consumo registrado!', `Consumo: $${montoNumero.toFixed(2)}\nCuota: $${cuotaFinal.toFixed(2)}`);
            limpiarFormulario();
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'No se pudo registrar.');
        }
    }

    async function guardarDeudaGeneral() {
        if (!idPareja) {
            Alert.alert('Atención', 'No se encontró el código de pareja.');
            return;
        }
        if (!categoriaSeleccionada) return;
        if (!subEntidad || !monto) {
            Alert.alert('Atención', 'Completa la entidad y el monto.');
            return;
        }
        const montoNumero = parseFloat(monto);
        const cuotaNumero = cuotaPagar ? parseFloat(cuotaPagar) : 0;
        if (isNaN(montoNumero) || montoNumero <= 0) {
            Alert.alert('Atención', 'Ingresa un monto válido.');
            return;
        }
        if (categoriaSeleccionada !== 'Deuda Familiar' && (isNaN(cuotaNumero) || cuotaNumero <= 0)) {
            Alert.alert('Atención', 'Ingresa una cuota válida.');
            return;
        }
        if (!usuarioActual) return;
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);
        const nuevaDeudaRef = push(deudasRef);
        try {
            await set(nuevaDeudaRef, {
                tipo: 'deuda',
                categoria: categoriaSeleccionada,
                entidad: subEntidad,
                monto: montoNumero,
                cuotaPagar: cuotaNumero,
                numeroCuotas:
                    categoriaSeleccionada === 'Préstamo Bancario' || categoriaSeleccionada === 'Casa Comercial'
                        ? parseInt(numeroCuotas) || 1
                        : 1,
                cupoDisponible:
                    categoriaSeleccionada === 'Casa Comercial' && cupoDisponible.trim() !== ''
                        ? Number(parseFloat(cupoDisponible).toFixed(2))
                        : null,
                fechaMaxPago: fechaMaxPago || 'N/A',
                fechaRegistro: new Date().toISOString(),
                usuarioEmail: usuarioActual.email,
                autor: obtenerAutor(usuarioActual.email),
            });
            Alert.alert('¡Éxito!', 'Deuda registrada correctamente.');
            limpiarFormulario();
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', error?.message || 'No se pudo registrar.');
        }
    }

    const categorias = [
        { id: 'Tarjeta de Crédito', label: 'Tarjeta de Crédito', icon: '💳' },
        { id: 'Préstamo Bancario', label: 'Préstamo Bancario', icon: '🏦' },
        { id: 'Casa Comercial', label: 'Casa Comercial', icon: '🏬' },
        { id: 'Operadora Celular', label: 'Planes Celular', icon: '📱' },
    ];

    const marcas = ['Visa', 'Mastercard', 'Diners', 'American Express', 'Discover'];
    const cuentasSeleccionada = categoriaSeleccionada === 'Deuda Familiar' || categoriaSeleccionada === 'Cuenta por Cobrar';

    return (
        <KeyboardAvoidingView style={styles.rootContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <View style={styles.topHeader}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color={colors.dark} />
                    </TouchableOpacity>
                    <Text style={styles.topHeaderTitle}>Nueva Obligación</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.heroCard}>
                    <View style={styles.heroIconContainer}>
                        <Text style={styles.heroEmoji}>💰</Text>
                    </View>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>Control Financiero</Text>
                        <Text style={styles.heroSubtitle}>Registra deudas, préstamos y cuentas por cobrar</Text>
                    </View>
                </View>

                <View style={styles.codigoCard}>
                    <Text style={styles.codigoLabel}>🔗 Mi código de cuenta</Text>
                    {cargandoCodigo ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Text style={styles.codigoTexto}>{miCodigoCuenta || 'No disponible'}</Text>
                    )}
                    <Text style={styles.codigoDescripcion}>Comparte este código para vincular préstamos con otra cuenta.</Text>
                </View>

                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>01</Text></View>
                    <Text style={styles.sectionTitle}>Tipo de Obligación</Text>
                </View>

                <View style={styles.categoriesContainer}>
                    {categorias.map(item => {
                        const selected = categoriaSeleccionada === item.id;
                        return (
                            <TouchableOpacity key={item.id} style={[styles.categoryCard, selected && styles.categoryCardSelected]} onPress={() => seleccionarCategoria(item.id)}>
                                <View style={[styles.categoryIconBox, selected && styles.categoryIconBoxSelected]}>
                                    <Text style={styles.categoryEmoji}>{item.icon}</Text>
                                </View>
                                <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{item.label}</Text>
                                <View style={[styles.radioIndicator, selected && styles.radioIndicatorSelected]}>
                                    {selected && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={[styles.categoryCardWide, cuentasSeleccionada && styles.categoryCardSelected]} onPress={() => setModalCuentasVisible(true)}>
                        <View style={[styles.categoryIconBox, cuentasSeleccionada && styles.categoryIconBoxSelected]}>
                            <Text style={styles.categoryEmoji}>💸💰</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.categoryText, cuentasSeleccionada && styles.categoryTextSelected]}>Cuentas por Pagar y Cobrar</Text>
                            <Text style={styles.categorySubText}>
                                {categoriaSeleccionada === 'Deuda Familiar'
                                    ? 'Seleccionado: Cuentas por Pagar'
                                    : categoriaSeleccionada === 'Cuenta por Cobrar'
                                    ? 'Seleccionado: Cuentas por Cobrar'
                                    : 'Gestiona el dinero que debes y te deben'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {categoriaSeleccionada === 'Tarjeta de Crédito' && (
                    <View style={styles.subFlowContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>02</Text></View>
                            <Text style={styles.sectionTitle}>Tarjeta de Crédito</Text>
                        </View>
                        <View style={styles.modeRow}>
                            <TouchableOpacity style={[styles.tarjetaModeButton, modoTarjeta === 'nueva' && styles.tarjetaModeButtonSelected]} onPress={() => setModoTarjeta('nueva')}>
                                <Text style={styles.tarjetaModeIcon}>➕</Text>
                                <Text style={[styles.tarjetaModeText, modoTarjeta === 'nueva' && styles.tarjetaModeTextSelected]}>Nueva tarjeta</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tarjetaModeButton, modoTarjeta === 'consumo' && styles.tarjetaModeButtonSelected]} onPress={() => setModoTarjeta('consumo')}>
                                <Text style={styles.tarjetaModeIcon}>🛒</Text>
                                <Text style={[styles.tarjetaModeText, modoTarjeta === 'consumo' && styles.tarjetaModeTextSelected]}>Registrar consumo</Text>
                            </TouchableOpacity>
                        </View>

                        {modoTarjeta === 'nueva' && (
                            <View style={styles.formCard}>
                                <Text style={styles.inputLabel}>Banco / Entidad</Text>
                                <TextInput style={styles.input} placeholder="Ej. Banco Pichincha" placeholderTextColor="#94A3B8" value={bancoTarjeta} onChangeText={setBancoTarjeta} />
                                <Text style={styles.inputLabel}>Marca de la tarjeta</Text>
                                <View style={styles.marcasContainer}>
                                    {marcas.map(marca => {
                                        const selected = marcaTarjeta === marca;
                                        return (
                                            <TouchableOpacity key={marca} style={[styles.marcaButton, selected && styles.marcaButtonSelected]} onPress={() => setMarcaTarjeta(marca)}>
                                                <Text style={[styles.marcaButtonText, selected && styles.marcaButtonTextSelected]}>{marca}</Text>
                                                {selected && <Text style={styles.marcaCheck}>✓</Text>}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                <Text style={styles.inputLabel}>Cupo Total ($)</Text>
                                <TextInput style={styles.input} placeholder="Ej. 3000" placeholderTextColor="#94A3B8" keyboardType="numeric" value={cupoTotal} onChangeText={setCupoTotal} />
                                <Text style={styles.inputLabel}>Fecha de Caducidad</Text>
                                <TextInput style={styles.input} placeholder="Ej. 08/29" placeholderTextColor="#94A3B8" value={fechaCaducidad} onChangeText={setFechaCaducidad} />
                                <TouchableOpacity style={styles.submitButton} onPress={guardarTarjetaNueva}>
                                    <Text style={styles.submitButtonText}>💳 Registrar Tarjeta</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {modoTarjeta === 'consumo' && (
                            <View style={styles.formCard}>
                                <Text style={styles.inputLabel}>Selecciona la tarjeta</Text>
                                {tarjetasDisponibles.length === 0 ? (
                                    <View style={styles.emptyCard}>
                                        <Text style={styles.emptyCardIcon}>💳</Text>
                                        <Text style={styles.emptyCardTitle}>No tienes tarjetas registradas</Text>
                                        <Text style={styles.emptyCardText}>Primero registra una tarjeta para poder agregar consumos.</Text>
                                    </View>
                                ) : (
                                    tarjetasDisponibles.map(tarjeta => {
                                        const selected = tarjetaConsumoId === tarjeta.id;
                                        return (
                                            <TouchableOpacity key={tarjeta.id} style={[styles.tarjetaItem, selected && styles.tarjetaItemSelected]} onPress={() => setTarjetaConsumoId(tarjeta.id)}>
                                                <View style={styles.tarjetaItemIcon}><Text style={{ fontSize: 22 }}>💳</Text></View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.tarjetaItemTitle}>{tarjeta.banco}</Text>
                                                    <Text style={styles.tarjetaItemSubtitle}>{tarjeta.marca} • Cupo ${tarjeta.cupoTotal.toFixed(2)}</Text>
                                                </View>
                                                <View style={[styles.radioIndicator, selected && styles.radioIndicatorSelected]}>
                                                    {selected && <View style={styles.radioDot} />}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                )}
                                {tarjetasDisponibles.length > 0 && (
                                    <>
                                        <Text style={styles.inputLabel}>Monto del Consumo ($)</Text>
                                        <TextInput style={styles.input} placeholder="Ej. 120" placeholderTextColor="#94A3B8" keyboardType="numeric" value={montoConsumo} onChangeText={setMontoConsumo} />
                                        <Text style={styles.inputLabel}>Forma de pago</Text>
                                        <View style={styles.modeRow}>
                                            <TouchableOpacity style={[styles.subModeButton, esDiferido === false && styles.subModeButtonSelected]} onPress={() => setEsDiferido(false)}>
                                                <Text style={[styles.subModeText, esDiferido === false && styles.subModeTextSelected]}>Corriente</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.subModeButton, esDiferido === true && styles.subModeButtonSelected]} onPress={() => setEsDiferido(true)}>
                                                <Text style={[styles.subModeText, esDiferido === true && styles.subModeTextSelected]}>Diferido</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {esDiferido === true && (
                                            <>
                                                <Text style={styles.inputLabel}>Número de Cuotas</Text>
                                                <TextInput style={styles.input} placeholder="Ej. 6" placeholderTextColor="#94A3B8" keyboardType="numeric" value={numeroCuotasConsumo} onChangeText={setNumeroCuotasConsumo} />
                                                <Text style={styles.inputLabel}>Valor de la Cuota ($)</Text>
                                                <TextInput style={styles.input} placeholder="Ej. 20" placeholderTextColor="#94A3B8" keyboardType="numeric" value={valorCuotaConsumo} onChangeText={setValorCuotaConsumo} />
                                            </>
                                        )}
                                        <Text style={styles.inputLabel}>Descripción</Text>
                                        <TextInput style={styles.input} placeholder="Ej. Compra supermercado" placeholderTextColor="#94A3B8" value={descripcionConsumo} onChangeText={setDescripcionConsumo} />
                                        <Text style={styles.inputLabel}>Fecha / Día de Pago</Text>
                                        <TextInput style={styles.input} placeholder="Ej. 15 de cada mes" placeholderTextColor="#94A3B8" value={fechaConsumo} onChangeText={setFechaConsumo} />
                                        <TouchableOpacity style={styles.submitButton} onPress={guardarConsumo}>
                                            <Text style={styles.submitButtonText}>🛒 Registrar Consumo</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {categoriaSeleccionada === 'Cuenta por Cobrar' && (
                    <View style={styles.subFlowContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>02</Text></View>
                            <Text style={styles.sectionTitle}>Persona que te debe</Text>
                        </View>
                        <View style={styles.formCard}>
                            <Text style={styles.inputLabel}>Nombre</Text>
                            <TextInput style={styles.input} placeholder="Ej. Juan" placeholderTextColor="#94A3B8" value={nombrePersona} onChangeText={setNombrePersona} />
                            <Text style={styles.inputLabel}>Apellido</Text>
                            <TextInput style={styles.input} placeholder="Ej. Pérez" placeholderTextColor="#94A3B8" value={apellidoPersona} onChangeText={setApellidoPersona} />
                            <Text style={styles.inputLabel}>Parentesco / Relación</Text>
                            <TextInput style={styles.input} placeholder="Ej. Hermano, amigo, compañero" placeholderTextColor="#94A3B8" value={parentescoPersona} onChangeText={setParentescoPersona} />
                            <Text style={styles.inputLabel}>¿Tiene código de cuenta?</Text>
                            <View style={styles.modeRow}>
                                <TouchableOpacity style={[styles.subModeButton, !usarCodigoPersona && styles.subModeButtonSelected]} onPress={() => { setUsarCodigoPersona(false); setPersonaEncontrada(null); setCodigoPersona(''); }}>
                                    <Text style={[styles.subModeText, !usarCodigoPersona && styles.subModeTextSelected]}>No</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.subModeButton, usarCodigoPersona && styles.subModeButtonSelected]} onPress={() => setUsarCodigoPersona(true)}>
                                    <Text style={[styles.subModeText, usarCodigoPersona && styles.subModeTextSelected]}>Sí, vincular</Text>
                                </TouchableOpacity>
                            </View>
                            {usarCodigoPersona && (
                                <View>
                                    <Text style={styles.inputLabel}>Código de cuenta de la persona</Text>
                                    <TextInput style={styles.input} placeholder="Ej. XK72P4" placeholderTextColor="#94A3B8" autoCapitalize="characters" value={codigoPersona} onChangeText={text => { setCodigoPersona(text.toUpperCase()); setPersonaEncontrada(null); }} />
                                    <TouchableOpacity style={styles.verifyButton} onPress={buscarPersonaPorCodigo}>
                                        {buscandoCodigo ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.verifyButtonText}>🔍 Validar código</Text>}
                                    </TouchableOpacity>
                                    {personaEncontrada && (
                                        <View style={styles.personaEncontrada}>
                                            <Text style={styles.personaEncontradaTitulo}>✅ Cuenta encontrada</Text>
                                            <Text style={styles.personaEncontradaTexto}>{personaEncontrada.nombre} {personaEncontrada.apellido}</Text>
                                            <Text style={styles.personaEncontradaCodigo}>Código: {codigoPersona}</Text>
                                            <Text style={styles.personaEncontradaInfo}>El préstamo se registrará en ambas cuentas.</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                            <Text style={styles.inputLabel}>Monto Prestado ($)</Text>
                            <TextInput style={styles.input} placeholder="Ej. 300" placeholderTextColor="#94A3B8" keyboardType="numeric" value={monto} onChangeText={setMonto} />
                            <Text style={styles.inputLabel}>Forma de Pago</Text>
                            <View style={styles.modeRow}>
                                <TouchableOpacity style={[styles.subModeButton, formaPagoCobrar === 'corriente' && styles.subModeButtonSelected]} onPress={() => setFormaPagoCobrar('corriente')}>
                                    <Text style={[styles.subModeText, formaPagoCobrar === 'corriente' && styles.subModeTextSelected]}>Corriente</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.subModeButton, formaPagoCobrar === 'diferido' && styles.subModeButtonSelected]} onPress={() => setFormaPagoCobrar('diferido')}>
                                    <Text style={[styles.subModeText, formaPagoCobrar === 'diferido' && styles.subModeTextSelected]}>Diferido</Text>
                                </TouchableOpacity>
                            </View>
                            {formaPagoCobrar === 'diferido' && (
                                <>
                                    <Text style={styles.inputLabel}>Número de Cuotas</Text>
                                    <TextInput style={styles.input} placeholder="Ej. 6" placeholderTextColor="#94A3B8" keyboardType="numeric" value={cuotasCobrar} onChangeText={setCuotasCobrar} />
                                    <Text style={styles.inputLabel}>Valor de la Cuota ($)</Text>
                                    <TextInput style={styles.input} placeholder="Ej. 50" placeholderTextColor="#94A3B8" keyboardType="numeric" value={valorCuotaCobrar} onChangeText={setValorCuotaCobrar} />
                                </>
                            )}
                            <Text style={styles.inputLabel}>Fecha / Día de Pago</Text>
                            <TextInput style={styles.input} placeholder="Ej. 15 de cada mes" placeholderTextColor="#94A3B8" value={fechaMaxPago} onChangeText={setFechaMaxPago} />
                            <TouchableOpacity style={styles.submitButton} onPress={guardarCuentaPorCobrar}>
                                <Text style={styles.submitButtonText}>💰 Registrar Préstamo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {categoriaSeleccionada && categoriaSeleccionada !== 'Tarjeta de Crédito' && categoriaSeleccionada !== 'Cuenta por Cobrar' && (
                    <View style={styles.subFlowContainer}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>02</Text></View>
                            <Text style={styles.sectionTitle}>
                                {categoriaSeleccionada === 'Deuda Familiar' ? 'Cuentas por Pagar' : 'Información de la Deuda'}
                            </Text>
                        </View>
                        <View style={styles.formCard}>
                            <Text style={styles.inputLabel}>Entidad o Acreedor</Text>
                            <TextInput style={styles.input} placeholder="Ej. Banco, almacén, familiar" placeholderTextColor="#94A3B8" value={subEntidad} onChangeText={setSubEntidad} />
                            <Text style={styles.inputLabel}>Monto Total de la Deuda ($)</Text>
                            <TextInput style={styles.input} placeholder="Ej. 2500" placeholderTextColor="#94A3B8" keyboardType="numeric" value={monto} onChangeText={setMonto} />
                            <Text style={styles.inputLabel}>Cuota Periódica</Text>
                            <TextInput style={styles.input} placeholder="Ej. 120" placeholderTextColor="#94A3B8" keyboardType="numeric" value={cuotaPagar} onChangeText={setCuotaPagar} />
                            {(categoriaSeleccionada === 'Préstamo Bancario' || categoriaSeleccionada === 'Casa Comercial') && (
                                <>
                                    <Text style={styles.inputLabel}>Número Total de Cuotas</Text>
                                    <TextInput style={styles.input} placeholder="Ej. 24" placeholderTextColor="#94A3B8" keyboardType="numeric" value={numeroCuotas} onChangeText={setNumeroCuotas} />
                                </>
                            )}
                            {categoriaSeleccionada === 'Casa Comercial' && (
                                <>
                                    <Text style={styles.inputLabel}>Cupo Disponible ($) - Opcional</Text>
                                    <TextInput style={styles.input} placeholder="Ej. 800" placeholderTextColor="#94A3B8" keyboardType="numeric" value={cupoDisponible} onChangeText={setCupoDisponible} />
                                </>
                            )}
                            <Text style={styles.inputLabel}>Fecha Límite / Día de Pago</Text>
                            <TextInput style={styles.input} placeholder="Ej. 30 de cada mes" placeholderTextColor="#94A3B8" value={fechaMaxPago} onChangeText={setFechaMaxPago} />
                            <TouchableOpacity style={styles.submitButton} onPress={guardarDeudaGeneral}>
                                <Text style={styles.submitButtonText}>💾 Guardar Obligación</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal visible={modalCuentasVisible} transparent animationType="fade" onRequestClose={() => setModalCuentasVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalMainTitle}>Cuentas por Pagar y Cobrar</Text>
                        <TouchableOpacity style={styles.modalOptionCard} onPress={() => { setModalCuentasVisible(false); seleccionarCategoria('Deuda Familiar'); }}>
                            <Text style={styles.modalOptionEmoji}>💸</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalOptionTitle}>Cuentas por Pagar</Text>
                                <Text style={styles.modalOptionSubtitle}>Dinero que tú debes</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOptionCard} onPress={() => { setModalCuentasVisible(false); seleccionarCategoria('Cuenta por Cobrar'); }}>
                            <Text style={styles.modalOptionEmoji}>💰</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.modalOptionTitle}>Cuentas por Cobrar</Text>
                                <Text style={styles.modalOptionSubtitle}>Dinero que te deben</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalCuentasVisible(false)}>
                            <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const createStyles = (colors: Tema) =>
    StyleSheet.create({
        rootContainer: { flex: 1, backgroundColor: colors.veryLight },
        scrollView: { flex: 1 },
        container: { paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 45 : 25, paddingBottom: 40 },
        topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
        backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.light, elevation: 2 },
        topHeaderTitle: { color: colors.dark, fontSize: 16, fontWeight: '600' },
        heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: colors.light, elevation: 2 },
        heroIconContainer: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.veryLight, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
        heroEmoji: { fontSize: 24 },
        heroTextContainer: { flex: 1 },
        heroTitle: { color: colors.dark, fontSize: 17, fontWeight: 'bold', marginBottom: 3 },
        heroSubtitle: { color: '#64748B', fontSize: 12, lineHeight: 16 },
        codigoCard: { backgroundColor: colors.veryLight, borderRadius: 18, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.light, alignItems: 'center' },
        codigoLabel: { color: colors.dark, fontSize: 12, fontWeight: '600', marginBottom: 5 },
        codigoTexto: { color: colors.primary, fontSize: 24, fontWeight: 'bold', letterSpacing: 3, marginVertical: 4 },
        codigoDescripcion: { color: '#64748B', fontSize: 10, textAlign: 'center', marginTop: 4 },
        sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 10 },
        stepBadge: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
        stepBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
        sectionTitle: { color: colors.dark, fontSize: 15, fontWeight: '600' },
        categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
        categoryCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.light, position: 'relative', elevation: 2 },
        categoryCardWide: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.light, elevation: 2 },
        categoryCardSelected: { borderColor: colors.primary, backgroundColor: colors.veryLight },
        categoryIconBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginBottom: 9 },
        categoryIconBoxSelected: { backgroundColor: colors.light },
        categoryEmoji: { fontSize: 23 },
        categoryText: { color: colors.dark, fontWeight: '700', fontSize: 13 },
        categoryTextSelected: { color: colors.primary },
        categorySubText: { color: '#64748B', fontSize: 11, marginTop: 2 },
        radioIndicator: { position: 'absolute', top: 14, right: 14, width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.light, justifyContent: 'center', alignItems: 'center' },
        radioIndicatorSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
        radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' },
        subFlowContainer: { marginTop: 10 },
        formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.light, marginBottom: 20, elevation: 2 },
        inputLabel: { color: '#475569', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
        input: { backgroundColor: colors.veryLight, borderWidth: 1, borderColor: colors.light, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.dark, fontSize: 13 },
        modeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
        subModeButton: { width: '48%', backgroundColor: colors.veryLight, borderWidth: 1, borderColor: colors.light, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
        subModeButtonSelected: { borderColor: colors.primary, backgroundColor: colors.veryLight },
        subModeText: { color: '#64748B', fontSize: 12 },
        subModeTextSelected: { color: colors.primary, fontWeight: 'bold' },
        tarjetaModeButton: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.light, borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', elevation: 1 },
        tarjetaModeButtonSelected: { borderColor: colors.primary, backgroundColor: colors.veryLight },
        tarjetaModeIcon: { fontSize: 22, marginBottom: 5 },
        tarjetaModeText: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },
        tarjetaModeTextSelected: { color: colors.primary, fontWeight: 'bold' },
        marcasContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 },
        marcaButton: { width: '48%', minHeight: 48, borderWidth: 1, borderColor: colors.light, backgroundColor: colors.veryLight, borderRadius: 12, paddingHorizontal: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
        marcaButtonSelected: { borderColor: colors.primary, backgroundColor: colors.veryLight },
        marcaButtonText: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },
        marcaButtonTextSelected: { color: colors.primary, fontWeight: 'bold' },
        marcaCheck: { color: colors.primary, fontSize: 15, fontWeight: 'bold', marginLeft: 7 },
        tarjetaItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.veryLight, borderWidth: 1, borderColor: colors.light, borderRadius: 15, padding: 13, marginBottom: 10 },
        tarjetaItemSelected: { borderColor: colors.primary, backgroundColor: colors.veryLight },
        tarjetaItemIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.light, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
        tarjetaItemTitle: { color: colors.dark, fontSize: 13, fontWeight: 'bold' },
        tarjetaItemSubtitle: { color: '#64748B', fontSize: 11, marginTop: 3 },
        emptyCard: { backgroundColor: colors.veryLight, borderRadius: 15, borderWidth: 1, borderColor: colors.light, padding: 20, alignItems: 'center', marginBottom: 10 },
        emptyCardIcon: { fontSize: 32, marginBottom: 8 },
        emptyCardTitle: { color: colors.dark, fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
        emptyCardText: { color: '#64748B', fontSize: 11, textAlign: 'center', marginTop: 5, lineHeight: 16 },
        verifyButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
        verifyButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
        personaEncontrada: { backgroundColor: colors.veryLight, borderWidth: 1, borderColor: colors.light, borderRadius: 14, padding: 14, marginTop: 10 },
        personaEncontradaTitulo: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
        personaEncontradaTexto: { color: colors.dark, fontSize: 15, fontWeight: 'bold' },
        personaEncontradaCodigo: { color: '#64748B', fontSize: 11, marginTop: 3 },
        personaEncontradaInfo: { color: colors.primary, fontSize: 10, marginTop: 6 },
        submitButton: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 24, elevation: 3 },
        submitButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
        modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
        modalContainer: { width: '100%', maxWidth: 380, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: colors.light, elevation: 5 },
        modalMainTitle: { color: colors.dark, fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 },
        modalOptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.veryLight, borderWidth: 1, borderColor: colors.light, borderRadius: 16, padding: 14, marginBottom: 12 },
        modalOptionEmoji: { fontSize: 24, marginRight: 14 },
        modalOptionTitle: { color: colors.dark, fontSize: 14, fontWeight: 'bold' },
        modalOptionSubtitle: { color: '#64748B', fontSize: 11, marginTop: 2 },
        modalCancelButton: { backgroundColor: colors.veryLight, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: colors.light },
        modalCancelButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },
    });