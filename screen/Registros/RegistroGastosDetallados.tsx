import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    ScrollView,
    TextInput,
} from 'react-native';

import React, { useState, useEffect } from 'react';

import { Ionicons } from '@expo/vector-icons';

import { auth, db } from '../../firebase/FirebaseConfig';

import {
    ref,
    onValue,
    push,
    set,
    get,
} from 'firebase/database';

export default function RegistroGastosDetallados({
    navigation,
}: any) {

    const [tipoGasto, setTipoGasto] =
        useState<'deuda' | 'fijo'>('deuda');

    const [subCategoria, setSubCategoria] =
        useState('Tarjeta de Crédito');

    const subCategoriasDeuda = [
        'Tarjeta de Crédito',
        'Préstamo Bancario',
        'Casa Comercial',
        'Deuda Familiar',
    ];

    const subCategoriasFijo = [
        'Luz',
        'Agua',
        'Internet / Teléfono',
        'Alquiler',
        'Otro',
    ];

    const [deudasFirebase, setDeudasFirebase] =
        useState<any[]>([]);

    const [movimientosFirebase, setMovimientosFirebase] =
        useState<any[]>([]);

    const [gastosFijosFirebase, setGastosFijosFirebase] =
        useState<any[]>([]);

    const [deudaSeleccionada, setDeudaSeleccionada] =
        useState<any>(null);

    const [
        gastoFijoSeleccionado,
        setGastoFijoSeleccionado,
    ] = useState<any>(null);

    const [montoPagar, setMontoPagar] = useState('');
    const [descripcionDetalle, setDescripcionDetalle] =
        useState('');

    const usuarioActual = auth.currentUser;

    useEffect(() => {
        if (usuarioActual) {
            const usuarioRef = ref(
                db,
                `usuarios/${usuarioActual.uid}`
            );

            get(usuarioRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const idPareja = userData.idPareja;

                    if (idPareja) {
                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/deudas`
                            ),
                            (snap) => {
                                const data = snap.val();
                                setDeudasFirebase(
                                    data
                                        ? Object.keys(
                                              data
                                          ).map((key) => ({
                                              id: key,
                                              ...data[key],
                                          }))
                                        : []
                                );
                            }
                        );

                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/movimientos`
                            ),
                            (snap) => {
                                const data = snap.val();
                                setMovimientosFirebase(
                                    data
                                        ? Object.keys(
                                              data
                                          ).map((key) => ({
                                              id: key,
                                              ...data[key],
                                          }))
                                        : []
                                );
                            }
                        );

                        onValue(
                            ref(
                                db,
                                `parejas/${idPareja}/gastosFijos`
                            ),
                            (snap) => {
                                const data = snap.val();
                                setGastosFijosFirebase(
                                    data
                                        ? Object.keys(
                                              data
                                          ).map((key) => ({
                                              id: key,
                                              ...data[key],
                                          }))
                                        : []
                                );
                            }
                        );
                    }
                }
            });
        }
    }, [usuarioActual]);

    const deudasConSaldo = deudasFirebase.map(
        (deuda) => {
            const pagosAsociados =
                movimientosFirebase.filter((mov) => {
                    if (
                        mov.deudaId &&
                        mov.deudaId === deuda.id
                    )
                        return true;

                    const desc = (
                        mov.descripcion || ''
                    ).toLowerCase();

                    const ent = (
                        deuda.entidad || ''
                    ).toLowerCase();

                    const cat = (
                        deuda.categoria || ''
                    ).toLowerCase();

                    return (
                        (ent && desc.includes(ent)) ||
                        (cat &&
                            desc.includes(cat) &&
                            mov.tipo === 'gasto')
                    );
                });

            const totalPagado =
                pagosAsociados.reduce(
                    (sum, mov) =>
                        sum + (Number(mov.monto) || 0),
                    0
                );

            const montoOriginal =
                Number(deuda.monto) || 0;

            const saldoRestante = Math.max(
                0,
                montoOriginal - totalPagado
            );

            return {
                ...deuda,
                saldoRestante,
            };
        }
    );

    const deudasFiltradas = deudasConSaldo.filter(
        (deuda) => {
            const catBD = (
                deuda.categoria || ''
            )
                .trim()
                .toLowerCase();

            const catActual = subCategoria
                .trim()
                .toLowerCase();

            return catBD === catActual;
        }
    );

    const fijosFiltrados = gastosFijosFirebase.filter(
        (gasto) => {
            const catBD = (
                gasto.categoria || ''
            )
                .trim()
                .toLowerCase();

            const catActual = subCategoria
                .trim()
                .toLowerCase();

            if (catActual.includes('internet')) {
                return (
                    catBD.includes('internet') ||
                    catBD.includes('teléfono') ||
                    catBD.includes('telefono')
                );
            }

            return catBD === catActual;
        }
    );

    function guardarPagoDetallado() {
        const montoNum = parseFloat(montoPagar);

        if (isNaN(montoNum) || montoNum <= 0) {
            Alert.alert(
                'Error',
                'Ingresa un monto válido a pagar.'
            );
            return;
        }

        if (
            tipoGasto === 'deuda' &&
            !deudaSeleccionada
        ) {
            Alert.alert(
                'Atención',
                'Por favor selecciona una deuda de la lista.'
            );
            return;
        }

        if (!usuarioActual) return;

        const usuarioRef = ref(
            db,
            `usuarios/${usuarioActual.uid}`
        );

        get(usuarioRef).then((snapshot) => {
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const idPareja = userData.idPareja;

                if (!idPareja) {
                    Alert.alert(
                        'Error',
                        'No tienes una pareja vinculada.'
                    );
                    return;
                }

                const movimientosRef = ref(
                    db,
                    `parejas/${idPareja}/movimientos`
                );

                const nuevoMovimientoRef = push(
                    movimientosRef
                );

                let nombreConcepto = '';

                let datosMovimiento: any = {
                    tipo: 'gasto',
                    monto: montoNum,
                    fecha: new Date().toISOString(),
                    autor:
                        userData.nombre || 'Usuario',
                    categoria: subCategoria,
                };

                if (tipoGasto === 'deuda') {
                    const nombreEntidad =
                        deudaSeleccionada
                            ? deudaSeleccionada.entidad ||
                              deudaSeleccionada.nombre ||
                              'Deuda'
                            : '';

                    nombreConcepto = `Pago Deuda (${subCategoria})${
                        nombreEntidad
                            ? ' - ' + nombreEntidad
                            : ''
                    }`;

                    datosMovimiento.deudaId =
                        deudaSeleccionada.id;

                    datosMovimiento.entidadDeuda =
                        nombreEntidad;
                } else {
                    const nombreFijo =
                        gastoFijoSeleccionado
                            ? gastoFijoSeleccionado.nombre ||
                              'Servicio'
                            : subCategoria;

                    nombreConcepto = `Gasto Fijo (${subCategoria}) - ${nombreFijo}`;
                }

                datosMovimiento.descripcion =
                    descripcionDetalle.trim()
                        ? `${nombreConcepto}: ${descripcionDetalle.trim()}`
                        : nombreConcepto;

                set(
                    nuevoMovimientoRef,
                    datosMovimiento
                )
                    .then(() => {
                        Alert.alert(
                            '¡Éxito!',
                            `Se registró el pago de $${montoNum} y se descontó del balance.`
                        );

                        navigation.goBack();
                    })
                    .catch((error) =>
                        Alert.alert(
                            'Error',
                            error.message
                        )
                    );
            }
        });
    }

    return (
        <View style={styles.rootContainer}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Cabecera superior minimalista */}
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>
                            ←
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.topHeaderTitle}>
                        Pago Detallado
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Hero Card */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIconContainer}>
                        <Text style={styles.heroEmoji}>
                            📋
                        </Text>
                    </View>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>
                            Control de Obligaciones
                        </Text>
                        <Text style={styles.heroSubtitle}>
                            Abona a tus deudas o servicios fijos de forma rápida
                        </Text>
                    </View>
                </View>

                {/* Selector Tipo de Gasto */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                            01
                        </Text>
                    </View>
                    <Text style={styles.sectionTitle}>
                        Seleccionar Categoría Principal
                    </Text>
                </View>

                <View style={styles.tipoContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tipoBtn,
                            tipoGasto === 'deuda' &&
                                styles.tipoBtnActive,
                        ]}
                        onPress={() => {
                            setTipoGasto('deuda');
                            setSubCategoria(
                                'Tarjeta de Crédito'
                            );
                            setDeudaSeleccionada(null);
                            setGastoFijoSeleccionado(
                                null
                            );
                            setMontoPagar('');
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="card-outline"
                            size={18}
                            color={
                                tipoGasto === 'deuda'
                                    ? '#047857'
                                    : '#64748B'
                            }
                            style={{ marginRight: 6 }}
                        />
                        <Text
                            style={[
                                styles.tipoBtnText,
                                tipoGasto === 'deuda' &&
                                    styles.tipoBtnTextActive,
                            ]}
                        >
                            Pagar Deuda
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.tipoBtn,
                            tipoGasto === 'fijo' &&
                                styles.tipoBtnActive,
                        ]}
                        onPress={() => {
                            setTipoGasto('fijo');
                            setSubCategoria('Luz');
                            setDeudaSeleccionada(null);
                            setGastoFijoSeleccionado(
                                null
                            );
                            setMontoPagar('');
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="flash-outline"
                            size={18}
                            color={
                                tipoGasto === 'fijo'
                                    ? '#047857'
                                    : '#64748B'
                            }
                            style={{ marginRight: 6 }}
                        />
                        <Text
                            style={[
                                styles.tipoBtnText,
                                tipoGasto === 'fijo' &&
                                    styles.tipoBtnTextActive,
                            ]}
                        >
                            Servicios / Fijos
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Subcategorías */}
                <View style={styles.sectionHeader}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>
                            02
                        </Text>
                    </View>
                    <Text style={styles.sectionTitle}>
                        Tipo de{' '}
                        {tipoGasto === 'deuda'
                            ? 'deuda'
                            : 'servicio'}
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.rowSub}
                >
                    {(tipoGasto === 'deuda'
                        ? subCategoriasDeuda
                        : subCategoriasFijo
                    ).map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.subBtn,
                                subCategoria === item &&
                                    styles.subBtnActive,
                            ]}
                            onPress={() => {
                                setSubCategoria(item);
                                setDeudaSeleccionada(null);
                                setGastoFijoSeleccionado(
                                    null
                                );
                                setMontoPagar('');
                            }}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.subText,
                                    subCategoria ===
                                        item &&
                                        styles.subTextActive,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Lista de Deudas o Fijos */}
                {tipoGasto === 'deuda' && (
                    <View style={styles.seccionDeudasBox}>
                        <Text style={styles.labelBox}>
                            Deudas de tipo "{subCategoria}":
                        </Text>

                        {deudasFiltradas.length === 0 ? (
                            <Text style={styles.avisoTexto}>
                                No hay deudas registradas
                                bajo esta categoría exacta.
                            </Text>
                        ) : (
                            deudasFiltradas.map(
                                (deuda) => {
                                    const nombreEntidad =
                                        deuda.entidad ||
                                        deuda.nombre ||
                                        'Deuda sin nombre';

                                    const valorCuota =
                                        deuda.cuotaPagar ||
                                        0;

                                    const totalCuotas =
                                        deuda.numeroCuotas ||
                                        1;

                                    const saldoTotalRestante =
                                        deuda.saldoRestante;

                                    const isSelected =
                                        deudaSeleccionada?.id ===
                                        deuda.id;

                                    return (
                                        <TouchableOpacity
                                            key={deuda.id}
                                            style={[
                                                styles.deudaItemCard,
                                                isSelected &&
                                                    styles
                                                        .deudaCardActive,
                                            ]}
                                            onPress={() => {
                                                setDeudaSeleccionada(
                                                    deuda
                                                );
                                                if (
                                                    valorCuota
                                                )
                                                    setMontoPagar(
                                                        valorCuota.toString()
                                                    );
                                            }}
                                            activeOpacity={
                                                0.8
                                            }
                                        >
                                            <View
                                                style={{
                                                    flex: 1,
                                                }}
                                            >
                                                <Text
                                                    style={
                                                        styles.deudaNombre
                                                    }
                                                >
                                                    {
                                                        nombreEntidad
                                                    }
                                                </Text>
                                                <Text
                                                    style={
                                                        styles.deudaMonto
                                                    }
                                                >
                                                    Cuota:
                                                    ${
                                                        valorCuota
                                                    }{' '}
                                                    (
                                                    {
                                                        totalCuotas
                                                    }{' '}
                                                    cuotas)
                                                </Text>
                                                <Text
                                                    style={
                                                        styles
                                                            .deudaTotalRestante
                                                    }
                                                >
                                                    Total a
                                                    deber: $
                                                    {saldoTotalRestante.toFixed(
                                                        2
                                                    )}
                                                </Text>
                                            </View>

                                            {isSelected && (
                                                <Ionicons
                                                    name="checkmark-circle"
                                                    size={22}
                                                    color="#059669"
                                                />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }
                            )
                        )}
                    </View>
                )}

                {tipoGasto === 'fijo' && (
                    <View style={styles.seccionDeudasBox}>
                        <Text style={styles.labelBox}>
                            Servicios fijos en "
                            {subCategoria}":
                        </Text>

                        {fijosFiltrados.length === 0 ? (
                            <Text style={styles.avisoTexto}>
                                No hay servicios fijos
                                configurados en esta categoría.
                            </Text>
                        ) : (
                            fijosFiltrados.map((gasto) => {
                                const isSelected =
                                    gastoFijoSeleccionado?.id ===
                                    gasto.id;
                                const montoVal =
                                    gasto.monto ||
                                    gasto.montoEstimado ||
                                    0;

                                return (
                                    <TouchableOpacity
                                        key={gasto.id}
                                        style={[
                                            styles.deudaItemCard,
                                            isSelected &&
                                                styles
                                                    .deudaCardActive,
                                        ]}
                                        onPress={() => {
                                            setGastoFijoSeleccionado(
                                                gasto
                                            );
                                            if (
                                                montoVal
                                            )
                                                setMontoPagar(
                                                    montoVal.toString()
                                                );
                                        }}
                                        activeOpacity={
                                            0.8
                                        }
                                    >
                                        <View
                                            style={{
                                                flex: 1,
                                            }}
                                        >
                                            <Text
                                                style={
                                                    styles.deudaNombre
                                                }
                                            >
                                                {gasto.nombre ||
                                                    'Servicio sin nombre'}
                                            </Text>
                                            <Text
                                                style={
                                                    styles.deudaMonto
                                                }
                                            >
                                                Monto: $
                                                {montoVal}
                                            </Text>
                                        </View>

                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={22}
                                                color="#059669"
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}

                {/* Formulario de Pago */}
                <View style={styles.formCard}>
                    <Text style={styles.formCardTitle}>
                        Detalles del Pago
                    </Text>

                    <Text style={styles.label}>
                        Monto a pagar / abonar ($)
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. 45.00"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={montoPagar}
                        onChangeText={setMontoPagar}
                    />

                    <Text style={styles.label}>
                        Descripción o Nota adicional (Opcional)
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ej. Pago del mes"
                        placeholderTextColor="#94A3B8"
                        value={descripcionDetalle}
                        onChangeText={
                            setDescripcionDetalle
                        }
                    />

                    <TouchableOpacity
                        style={styles.btnGuardar}
                        onPress={guardarPagoDetallado}
                        activeOpacity={0.85}
                    >
                        <Ionicons
                            name="save-outline"
                            size={18}
                            color="white"
                            style={{ marginRight: 7 }}
                        />
                        <Text style={styles.btnGuardarText}>
                            Registrar Pago y Descontar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnVolver}
                        onPress={() =>
                            navigation.goBack()
                        }
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnVolverText}>
                            Cancelar / Volver
                        </Text>
                    </TouchableOpacity>
                </View>
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
        marginBottom: 12,
        marginTop: 6,
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
    tipoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    tipoBtn: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    tipoBtnActive: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    tipoBtnText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13,
    },
    tipoBtnTextActive: {
        color: '#047857',
        fontWeight: 'bold',
    },
    rowSub: {
        paddingVertical: 4,
        paddingRight: 10,
        marginBottom: 16,
    },
    subBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    subBtnActive: {
        backgroundColor: '#ECFDF5',
        borderColor: '#059669',
    },
    subText: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '500',
    },
    subTextActive: {
        color: '#047857',
        fontWeight: 'bold',
        fontSize: 12,
    },
    seccionDeudasBox: {
        backgroundColor: '#FFFFFF',
        padding: 18,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    labelBox: {
        color: '#1E293B',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    avisoTexto: {
        color: '#D97706',
        fontSize: 13,
        lineHeight: 18,
        fontStyle: 'italic',
        paddingVertical: 5,
    },
    deudaItemCard: {
        backgroundColor: '#F8FAFC',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    deudaCardActive: {
        borderColor: '#059669',
        backgroundColor: '#ECFDF5',
    },
    deudaNombre: {
        color: '#1E293B',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 3,
    },
    deudaMonto: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    deudaTotalRestante: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
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
        marginBottom: 10,
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
    btnGuardar: {
        backgroundColor: '#059669',
        paddingVertical: 15,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
    },
    btnGuardarText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    btnVolver: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 12,
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    btnVolverText: {
        color: '#64748B',
        fontWeight: '600',
        fontSize: 13,
    },
});   //pagina/ registros/gastos/gastos detallados