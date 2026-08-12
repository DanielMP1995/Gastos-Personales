import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, onValue } from 'firebase/database';

export default function InicioScreen({ navigation }: any) {
    const usuarioActual = auth.currentUser;

    const [idPareja, setIdPareja] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [totalIngresos, setTotalIngresos] = useState(0);
    const [totalGastos, setTotalGastos] = useState(0);
    const [totalDeudas, setTotalDeudas] = useState(0);

    const [movimientos, setMovimientos] = useState<any[]>([]);

    // ============================================================
    // OBTENER PAREJA
    // ============================================================

    useEffect(() => {
        navigation.setOptions({
            headerShown: false,
        });

        const uid = usuarioActual?.uid;

        if (!uid) {
            setLoading(false);
            return;
        }

        const userRef = ref(db, `usuarios/${uid}`);

        const unsubscribe = onValue(userRef, (snapshot) => {
            const data = snapshot.val();

            if (data?.idPareja) {
                setIdPareja(data.idPareja);
            } else {
                setIdPareja(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigation, usuarioActual]);

    // ============================================================
    // CARGAR DATOS
    // ============================================================

    useEffect(() => {
        if (!idPareja) {
            return;
        }

        const movimientosRef = ref(
            db,
            `parejas/${idPareja}/movimientos`
        );

        const ingresosRef = ref(
            db,
            `parejas/${idPareja}/ingresos`
        );

        const deudasRef = ref(
            db,
            `parejas/${idPareja}/deudas`
        );

        let movimientosData: any = null;
        let ingresosData: any = null;
        let deudasData: any = null;

        const procesarDatos = () => {
            let listaMovimientos: any[] = [];

            let ingresosAcc = 0;
            let gastosAcc = 0;
            let deudasAcc = 0;

            // ====================================================
            // MOVIMIENTOS
            // ====================================================

            if (movimientosData) {
                const listaMovimientosFirebase = Object.keys(
                    movimientosData
                ).map((key) => ({
                    id: key,
                    ...movimientosData[key],
                }));

                listaMovimientosFirebase.forEach((item) => {
                    const monto = Number(item.monto) || 0;

                    if (item.tipo === 'ingreso') {
                        ingresosAcc += monto;
                    }

                    if (
                        item.tipo === 'gasto' ||
                        item.tipo === 'gastos'
                    ) {
                        gastosAcc += monto;
                    }
                });

                listaMovimientos = [
                    ...listaMovimientos,
                    ...listaMovimientosFirebase,
                ];
            }

            // ====================================================
            // INGRESOS
            // ====================================================

            if (ingresosData) {
                const listaIngresos = Object.keys(
                    ingresosData
                ).map((key) => ({
                    id: `ingreso-${key}`,
                    ...ingresosData[key],
                    tipo: 'ingreso',
                }));

                listaIngresos.forEach((item) => {
                    const monto = Number(item.monto) || 0;

                    ingresosAcc += monto;
                });

                listaMovimientos = [
                    ...listaMovimientos,
                    ...listaIngresos,
                ];
            }

            // ====================================================
            // DEUDAS
            // ====================================================

            if (deudasData) {
                const listaDeudas = Object.keys(
                    deudasData
                ).map((key) => {
                    const deuda = deudasData[key];

                    // =================================================
                    // TARJETA REGISTRADA
                    // NO ES DEUDA
                    // =================================================

                    if (deuda.tipo === 'tarjeta') {
                        return {
                            id: `tarjeta-${key}`,
                            ...deuda,
                            tipo: 'tarjeta',
                            esTarjeta: true,
                            esDeuda: false,
                            monto: 0,
                            descripcion:
                                `${deuda.marcaTarjeta || 'Tarjeta'} - ${
                                    deuda.entidad || 'Banco'
                                }`,
                        };
                    }

                    // =================================================
                    // CONSUMO TARJETA
                    // SÍ ES DEUDA
                    // =================================================

                    if (deuda.tipo === 'consumoTarjeta') {
                        const montoConsumo =
                            Number(deuda.monto) || 0;

                        deudasAcc += montoConsumo;

                        return {
                            id: `consumo-${key}`,
                            ...deuda,
                            tipo: 'consumoTarjeta',
                            esTarjeta: true,
                            esDeuda: true,
                            monto: montoConsumo,
                            descripcion:
                                deuda.descripcion &&
                                deuda.descripcion !== 'N/A'
                                    ? deuda.descripcion
                                    : `Consumo ${
                                          deuda.tarjetaMarca ||
                                          'Tarjeta'
                                      } - ${
                                          deuda.tarjetaBanco || ''
                                      }`,
                        };
                    }

                    // =================================================
                    // DEUDA NORMAL
                    // =================================================

                    if (deuda.tipo === 'deuda') {
                        const montoOriginal =
                            Number(deuda.monto) || 0;

                        const pagosAsociados =
                            listaMovimientos.filter((mov) => {
                                if (
                                    mov.deudaId &&
                                    mov.deudaId === key
                                ) {
                                    return true;
                                }

                                const descripcionMovimiento =
                                    String(
                                        mov.descripcion ||
                                            mov.entidadDeuda ||
                                            ''
                                    ).toLowerCase();

                                const entidadDeuda =
                                    String(
                                        deuda.entidad || ''
                                    ).toLowerCase();

                                const categoriaMovimiento =
                                    String(
                                        mov.categoria || ''
                                    ).toLowerCase();

                                const categoriaDeuda =
                                    String(
                                        deuda.categoria || ''
                                    ).toLowerCase();

                                const esPago =
                                    String(
                                        mov.tipo || ''
                                    )
                                        .toLowerCase()
                                        .includes('pago');

                                return (
                                    (
                                        entidadDeuda &&
                                        descripcionMovimiento.includes(
                                            entidadDeuda
                                        )
                                    ) ||
                                    (
                                        categoriaDeuda &&
                                        categoriaMovimiento ===
                                            categoriaDeuda &&
                                        esPago
                                    )
                                );
                            });

                        const totalPagado =
                            pagosAsociados.reduce(
                                (total, movimiento) => {
                                    return (
                                        total +
                                        (Number(
                                            movimiento.monto
                                        ) || 0)
                                    );
                                },
                                0
                            );

                        const saldoPendiente = Math.max(
                            0,
                            montoOriginal - totalPagado
                        );

                        deudasAcc += saldoPendiente;

                        return {
                            id: `deuda-${key}`,
                            deudaId: key,
                            ...deuda,
                            tipo: 'deuda',
                            esDeuda: true,
                            esTarjeta: false,
                            monto: saldoPendiente,
                            montoRestante: saldoPendiente,
                            descripcion:
                                deuda.descripcion ||
                                `${deuda.categoria || 'Deuda'} - ${
                                    deuda.entidad || ''
                                }`,
                        };
                    }

                    return {
                        id: `otro-${key}`,
                        ...deuda,
                        tipo: deuda.tipo || 'otro',
                    };
                });

                const deudasParaActividad =
                    listaDeudas.filter(
                        (item) =>
                            item.tipo !== 'tarjeta'
                    );

                listaMovimientos = [
                    ...listaMovimientos,
                    ...deudasParaActividad,
                ];
            }

            // ====================================================
            // ORDENAR
            // ====================================================

            listaMovimientos.sort((a, b) => {
                const fechaA = new Date(
                    a.fechaRegistro ||
                        a.fecha ||
                        a.createdAt ||
                        0
                ).getTime();

                const fechaB = new Date(
                    b.fechaRegistro ||
                        b.fecha ||
                        b.createdAt ||
                        0
                ).getTime();

                return fechaB - fechaA;
            });

            // ====================================================
            // ACTUALIZAR
            // ====================================================

            setTotalIngresos(ingresosAcc);
            setTotalGastos(gastosAcc);
            setTotalDeudas(deudasAcc);
            setMovimientos(listaMovimientos);

            setLoading(false);
        };

        const unsubscribeMovimientos = onValue(
            movimientosRef,
            (snapshot) => {
                movimientosData = snapshot.val();
                procesarDatos();
            }
        );

        const unsubscribeIngresos = onValue(
            ingresosRef,
            (snapshot) => {
                ingresosData = snapshot.val();
                procesarDatos();
            }
        );

        const unsubscribeDeudas = onValue(
            deudasRef,
            (snapshot) => {
                deudasData = snapshot.val();
                procesarDatos();
            }
        );

        return () => {
            unsubscribeMovimientos();
            unsubscribeIngresos();
            unsubscribeDeudas();
        };
    }, [idPareja]);

    // ============================================================
    // BALANCE
    // ============================================================

    const balanceNeto =
        totalIngresos - totalGastos;

    return (
        <View style={styles.root}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/img/logov2.png')}
                            style={styles.logoHeader}
                            resizeMode="contain"
                        />
                    </View>

                    <View style={styles.headerInfo}>
                        <Text style={styles.welcomeText}>
                            FINANZAS EN PAREJA
                        </Text>

                        <Text style={styles.nameText}>
                            Dashboard Compartido
                        </Text>

                        <View style={styles.onlineRow}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>
                                Cuenta sincronizada
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ================================================= */}
                {/* TITULO */}
                {/* ================================================= */}

                <View style={styles.titleRow}>
                    <View>
                        <Text style={styles.dashboardHeaderTitle}>
                            Resumen financiero
                        </Text>

                        <Text style={styles.dashboardSubtitle}>
                            Tu situación financiera actual
                        </Text>
                    </View>

                    <View style={styles.monthBadge}>
                        <Text style={styles.monthBadgeText}>
                            HOY
                        </Text>
                    </View>
                </View>

                {/* ================================================= */}
                {/* BALANCE PRINCIPAL */}
                {/* ================================================= */}

                <View style={styles.mainDashboardCard}>
                    <View style={styles.balanceTopRow}>
                        <View style={styles.balanceIcon}>
                            <Text style={styles.balanceIconText}>
                                $
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.mainCardTitle}>
                                BALANCE NETO
                            </Text>

                            <Text style={styles.mainCardSubtitle}>
                                Ingresos − gastos
                            </Text>
                        </View>
                    </View>

                    <Text
                        style={[
                            styles.mainCardAmount,
                            balanceNeto < 0 &&
                                styles.textRed,
                        ]}
                    >
                        ${balanceNeto.toFixed(2)}
                    </Text>

                    <View style={styles.balanceLine}>
                        <View
                            style={[
                                styles.balanceLineProgress,
                                {
                                    width:
                                        balanceNeto > 0
                                            ? '75%'
                                            : '35%',
                                },
                            ]}
                        />
                    </View>

                    <Text style={styles.balanceFooter}>
                        {balanceNeto >= 0
                            ? '✓ Tienes un balance positivo'
                            : '⚠ Tus gastos superan tus ingresos'}
                    </Text>
                </View>

                {/* ================================================= */}
                {/* RESUMEN */}
                {/* ================================================= */}

                <View style={styles.dashboardGrid}>
                    {/* INGRESOS */}

                    <View
                        style={[
                            styles.dashCard,
                            styles.incomeCard,
                        ]}
                    >
                        <View
                            style={[
                                styles.dashIcon,
                                styles.incomeIcon,
                            ]}
                        >
                            <Text style={styles.dashIconText}>
                                ↗
                            </Text>
                        </View>

                        <Text style={styles.dashCardTitle}>
                            Ingresos
                        </Text>

                        <Text
                            style={
                                styles.dashCardIncome
                            }
                        >
                            +$
                            {totalIngresos.toFixed(
                                2
                            )}
                        </Text>
                    </View>

                    {/* GASTOS */}

                    <View
                        style={[
                            styles.dashCard,
                            styles.expenseCard,
                        ]}
                    >
                        <View
                            style={[
                                styles.dashIcon,
                                styles.expenseIcon,
                            ]}
                        >
                            <Text style={styles.dashIconText}>
                                ↘
                            </Text>
                        </View>

                        <Text style={styles.dashCardTitle}>
                            Gastos
                        </Text>

                        <Text
                            style={
                                styles.dashCardExpense
                            }
                        >
                            -$
                            {totalGastos.toFixed(
                                2
                            )}
                        </Text>
                    </View>

                    {/* DEUDAS */}

                    <View
                        style={[
                            styles.dashCard,
                            styles.debtCard,
                        ]}
                    >
                        <View
                            style={[
                                styles.dashIcon,
                                styles.debtIcon,
                            ]}
                        >
                            <Text style={styles.dashIconText}>
                                $
                            </Text>
                        </View>

                        <Text style={styles.dashCardTitle}>
                            Deudas
                        </Text>

                        <Text
                            style={
                                styles.dashCardDebt
                            }
                        >
                            $
                            {totalDeudas.toFixed(
                                2
                            )}
                        </Text>
                    </View>
                </View>

                {/* ================================================= */}
                {/* ACCIONES */}
                {/* ================================================= */}

                <Text style={styles.quickTitle}>
                    Acciones rápidas
                </Text>

                <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={
                            styles.actionButtonRapido
                        }
                        onPress={() =>
                            navigation.navigate(
                                'gastosRapidos'
                            )
                        }
                    >
                        <View
                            style={
                                styles.actionIconContainer
                            }
                        >
                            <Text
                                style={
                                    styles.actionIcon
                                }
                            >
                                ⚡
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.actionButtonText
                            }
                        >
                            Gastos
                        </Text>

                        <Text
                            style={
                                styles.actionButtonSmallText
                            }
                        >
                            Rápidos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={
                            styles.actionButtonSmall
                        }
                        onPress={() =>
                            navigation.navigate(
                                'Registros'
                            )
                        }
                    >
                        <View
                            style={
                                styles.actionIconContainerBlue
                            }
                        >
                            <Text
                                style={
                                    styles.actionIcon
                                }
                            >
                                📝
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.actionButtonText
                            }
                        >
                            Registros
                        </Text>

                        <Text
                            style={
                                styles.actionButtonSmallText
                            }
                        >
                            Movimientos
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={
                            styles.actionButtonDebt
                        }
                        onPress={() =>
                            navigation.navigate(
                                'deudas'
                            )
                        }
                    >
                        <View
                            style={
                                styles.actionIconContainerPurple
                            }
                        >
                            <Text
                                style={
                                    styles.actionIcon
                                }
                            >
                                💳
                            </Text>
                        </View>

                        <Text
                            style={
                                styles.actionButtonText
                            }
                        >
                            Deudas
                        </Text>

                        <Text
                            style={
                                styles.actionButtonSmallText
                            }
                        >
                            Obligaciones
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ================================================= */}
                {/* ACTIVIDAD */}
                {/* ================================================= */}

                <View style={styles.activityHeader}>
                    <View>
                        <Text style={styles.sectionTitle}>
                            Actividad reciente
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                            Últimos movimientos de la pareja
                        </Text>
                    </View>

                    <View style={styles.activityCount}>
                        <Text style={styles.activityCountText}>
                            {movimientos.length}
                        </Text>
                    </View>
                </View>

                {/* ================================================= */}
                {/* LOADING */}
                {/* ================================================= */}

                {loading ? (
                    <View style={styles.loadingCard}>
                        <ActivityIndicator
                            size="large"
                            color="#38BDF8"
                        />

                        <Text style={styles.loadingText}>
                            Sincronizando información...
                        </Text>
                    </View>
                ) : movimientos.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <View style={styles.emptyIcon}>
                            <Text style={styles.emptyIconText}>
                                $
                            </Text>
                        </View>

                        <Text style={styles.emptyTitle}>
                            Aún no hay movimientos
                        </Text>

                        <Text style={styles.emptyText}>
                            Empieza registrando tus ingresos,
                            gastos o deudas.
                        </Text>
                    </View>
                ) : (
                    movimientos.map((item) => {
                        const esIngreso =
                            item.tipo ===
                            'ingreso';

                        const esDeuda =
                            item.tipo ===
                                'deuda' ||
                            item.tipo ===
                                'consumoTarjeta';

                        const esConsumoTarjeta =
                            item.tipo ===
                            'consumoTarjeta';

                        return (
                            <View
                                key={item.id}
                                style={
                                    styles.transactionItem
                                }
                            >
                                {/* ICONO */}

                                <View
                                    style={[
                                        styles.transactionIcon,
                                        esIngreso
                                            ? styles.transactionIncome
                                            : esDeuda
                                            ? styles.transactionDebt
                                            : styles.transactionExpense,
                                    ]}
                                >
                                    <Text
                                        style={
                                            styles.transactionIconText
                                        }
                                    >
                                        {esIngreso
                                            ? '↗'
                                            : esDeuda
                                            ? '💳'
                                            : '↘'}
                                    </Text>
                                </View>

                                {/* INFO */}

                                <View
                                    style={
                                        styles.transactionInfo
                                    }
                                >
                                    <Text
                                        style={
                                            styles.transactionTitle
                                        }
                                        numberOfLines={2}
                                    >
                                        {item.descripcion ||
                                            'Movimiento'}
                                    </Text>

                                    {/* CONSUMO TARJETA */}

                                    {esConsumoTarjeta && (
                                        <Text
                                            style={
                                                styles.cardDetailText
                                            }
                                        >
                                            💳{' '}
                                            {item.tarjetaMarca ||
                                                'Tarjeta'}{' '}
                                            ·{' '}
                                            {item.tarjetaBanco ||
                                                ''}
                                        </Text>
                                    )}

                                    {/* DIFERIDO */}

                                    {esConsumoTarjeta &&
                                        item.diferido ===
                                            true && (
                                            <Text
                                                style={
                                                    styles.subDetailText
                                                }
                                            >
                                                📅 Diferido a{' '}
                                                {
                                                    item.numeroCuotas
                                                }{' '}
                                                cuotas
                                            </Text>
                                        )}

                                    {/* VALOR CUOTA CONSUMO */}

                                    {esConsumoTarjeta &&
                                        Number(
                                            item.cuotaPagar
                                        ) > 0 && (
                                            <Text
                                                style={
                                                    styles.cuotaText
                                                }
                                            >
                                                💰 Cuota: $
                                                {Number(
                                                    item.cuotaPagar
                                                ).toFixed(
                                                    2
                                                )}
                                            </Text>
                                        )}

                                    {/* CUOTA DEUDA */}

                                    {item.tipo ===
                                        'deuda' &&
                                        Number(
                                            item.cuotaPagar
                                        ) > 0 && (
                                            <Text
                                                style={
                                                    styles.subDetailText
                                                }
                                            >
                                                💰 Cuota: $
                                                {Number(
                                                    item.cuotaPagar
                                                ).toFixed(
                                                    2
                                                )}
                                            </Text>
                                        )}

                                    {/* AUTOR */}

                                    <Text
                                        style={
                                            styles.transactionAuthor
                                        }
                                    >
                                        Registrado por:{' '}
                                        {item.autor ||
                                            'Usuario'}
                                    </Text>
                                </View>

                                {/* MONTO */}

                                <View
                                    style={
                                        styles.amountContainer
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.transactionAmount,
                                            esIngreso
                                                ? styles.textGreen
                                                : esDeuda
                                                ? styles.textOrange
                                                : styles.textRed,
                                        ]}
                                    >
                                        {esIngreso
                                            ? `+$${Number(
                                                  item.monto
                                              ).toFixed(
                                                  2
                                              )}`
                                            : esDeuda
                                            ? `$${Number(
                                                  item.monto
                                              ).toFixed(
                                                  2
                                              )}`
                                            : `-$${Number(
                                                  item.monto
                                              ).toFixed(
                                                  2
                                              )}`}
                                    </Text>

                                    <Text
                                        style={
                                            styles.amountLabel
                                        }
                                    >
                                        {esIngreso
                                            ? 'Ingreso'
                                            : esDeuda
                                            ? 'Deuda'
                                            : 'Gasto'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}

                {/* ================================================= */}
                {/* FOOTER */}
                {/* ================================================= */}

                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Finanzas en Pareja
                    </Text>

                    <Text style={styles.footerSubText}>
                        Tu dinero, organizado entre los dos.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // ============================================================
    // GENERAL
    // ============================================================

    root: {
        flex: 1,
        backgroundColor: '#07111F',
    },

    scrollView: {
        flex: 1,
        backgroundColor: '#07111F',
    },

    container: {
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'web' ? 30 : 42,
        paddingBottom: 50,
    },

    // ============================================================
    // HEADER
    // ============================================================

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0D1B2A',
        borderRadius: 20,
        padding: 15,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#1E344A',
    },

    logoContainer: {
        width: 62,
        height: 62,
        borderRadius: 18,
        backgroundColor: '#13283D',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
        borderWidth: 1,
        borderColor: '#27445F',
    },

    logoHeader: {
        width: 50,
        height: 50,
    },

    headerInfo: {
        flex: 1,
    },

    welcomeText: {
        color: '#38BDF8',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 3,
    },

    nameText: {
        color: '#F8FAFC',
        fontSize: 19,
        fontWeight: '800',
    },

    onlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },

    onlineDot: {
        width: 7,
        height: 7,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        marginRight: 6,
    },

    onlineText: {
        color: '#64748B',
        fontSize: 10,
    },

    // ============================================================
    // TITULO
    // ============================================================

    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 13,
    },

    dashboardHeaderTitle: {
        color: '#F8FAFC',
        fontSize: 22,
        fontWeight: '800',
    },

    dashboardSubtitle: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 3,
    },

    monthBadge: {
        backgroundColor: '#132B42',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#245273',
    },

    monthBadgeText: {
        color: '#38BDF8',
        fontSize: 10,
        fontWeight: '800',
    },

    // ============================================================
    // BALANCE
    // ============================================================

    mainDashboardCard: {
        backgroundColor: '#10263A',
        borderRadius: 22,
        padding: 22,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#1D4968',
        overflow: 'hidden',
        shadowColor: '#0284C7',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.18,
        shadowRadius: 15,
        elevation: 7,
    },

    balanceTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    balanceIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        backgroundColor: '#164E63',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    balanceIconText: {
        color: '#67E8F9',
        fontSize: 23,
        fontWeight: '800',
    },

    mainCardTitle: {
        color: '#CBD5E1',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },

    mainCardSubtitle: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },

    mainCardAmount: {
        color: '#67E8F9',
        fontSize: 35,
        fontWeight: '900',
        marginTop: 18,
        marginBottom: 13,
    },

    balanceLine: {
        width: '100%',
        height: 5,
        backgroundColor: '#18354C',
        borderRadius: 10,
        overflow: 'hidden',
    },

    balanceLineProgress: {
        height: 5,
        backgroundColor: '#22D3EE',
        borderRadius: 10,
    },

    balanceFooter: {
        color: '#7DD3FC',
        fontSize: 11,
        marginTop: 10,
        fontWeight: '600',
    },

    // ============================================================
    // COLORES
    // ============================================================

    textRed: {
        color: '#FB7185',
    },

    textGreen: {
        color: '#34D399',
    },

    textOrange: {
        color: '#FB923C',
    },

    // ============================================================
    // DASH CARDS
    // ============================================================

    dashboardGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 22,
    },

    dashCard: {
        width: '31.5%',
        backgroundColor: '#0D1B2A',
        borderRadius: 17,
        padding: 13,
        borderWidth: 1,
        borderColor: '#1E344A',
    },

    incomeCard: {
        borderBottomWidth: 3,
        borderBottomColor: '#10B981',
    },

    expenseCard: {
        borderBottomWidth: 3,
        borderBottomColor: '#F43F5E',
    },

    debtCard: {
        borderBottomWidth: 3,
        borderBottomColor: '#F97316',
    },

    dashIcon: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 9,
    },

    incomeIcon: {
        backgroundColor: '#063B30',
    },

    expenseIcon: {
        backgroundColor: '#451322',
    },

    debtIcon: {
        backgroundColor: '#47220C',
    },

    dashIconText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    dashCardTitle: {
        color: '#64748B',
        fontSize: 11,
        marginBottom: 5,
    },

    dashCardIncome: {
        color: '#34D399',
        fontSize: 14,
        fontWeight: '800',
    },

    dashCardExpense: {
        color: '#FB7185',
        fontSize: 14,
        fontWeight: '800',
    },

    dashCardDebt: {
        color: '#FB923C',
        fontSize: 14,
        fontWeight: '800',
    },

    // ============================================================
    // ACCIONES
    // ============================================================

    quickTitle: {
        color: '#E2E8F0',
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 10,
    },

    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },

    actionButtonRapido: {
        flex: 1,
        backgroundColor: '#7C2D12',
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
        marginHorizontal: 3,
        borderWidth: 1,
        borderColor: '#C2410C',
    },

    actionButtonSmall: {
        flex: 1,
        backgroundColor: '#123B63',
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
        marginHorizontal: 3,
        borderWidth: 1,
        borderColor: '#2563A8',
    },

    actionButtonDebt: {
        flex: 1,
        backgroundColor: '#31215A',
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
        marginHorizontal: 3,
        borderWidth: 1,
        borderColor: '#6941A5',
    },

    actionIconContainer: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: '#EA580C',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 7,
    },

    actionIconContainerBlue: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 7,
    },

    actionIconContainerPurple: {
        width: 34,
        height: 34,
        borderRadius: 11,
        backgroundColor: '#7C3AED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 7,
    },

    actionIcon: {
        fontSize: 16,
    },

    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },

    actionButtonSmallText: {
        color: '#94A3B8',
        fontSize: 9,
        marginTop: 2,
    },

    // ============================================================
    // ACTIVIDAD
    // ============================================================

    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    sectionTitle: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '800',
    },

    sectionSubtitle: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 3,
    },

    activityCount: {
        minWidth: 31,
        height: 31,
        borderRadius: 10,
        backgroundColor: '#172B40',
        borderWidth: 1,
        borderColor: '#294762',
        alignItems: 'center',
        justifyContent: 'center',
    },

    activityCountText: {
        color: '#38BDF8',
        fontSize: 12,
        fontWeight: '800',
    },

    // ============================================================
    // LOADING
    // ============================================================

    loadingCard: {
        backgroundColor: '#0D1B2A',
        borderRadius: 18,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E344A',
    },

    loadingText: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 12,
    },

    // ============================================================
    // EMPTY
    // ============================================================

    emptyCard: {
        backgroundColor: '#0D1B2A',
        borderRadius: 18,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1E344A',
    },

    emptyIcon: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#132B42',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    emptyIconText: {
        color: '#38BDF8',
        fontSize: 28,
        fontWeight: '900',
    },

    emptyTitle: {
        color: '#E2E8F0',
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 5,
    },

    emptyText: {
        color: '#64748B',
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 19,
    },

    // ============================================================
    // TRANSACCIONES
    // ============================================================

    transactionItem: {
        backgroundColor: '#0D1B2A',
        borderRadius: 17,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 9,
        borderWidth: 1,
        borderColor: '#1B3044',
    },

    transactionIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    transactionIncome: {
        backgroundColor: '#063B30',
    },

    transactionExpense: {
        backgroundColor: '#451322',
    },

    transactionDebt: {
        backgroundColor: '#47220C',
    },

    transactionIconText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },

    transactionInfo: {
        flex: 1,
        paddingRight: 5,
    },

    transactionTitle: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '700',
    },

    cardDetailText: {
        color: '#A78BFA',
        fontSize: 11,
        marginTop: 4,
        fontWeight: '600',
    },

    subDetailText: {
        color: '#38BDF8',
        fontSize: 11,
        marginTop: 3,
        fontWeight: '600',
    },

    cuotaText: {
        color: '#34D399',
        fontSize: 11,
        marginTop: 3,
        fontWeight: '700',
    },

    transactionAuthor: {
        color: '#475569',
        fontSize: 10,
        marginTop: 5,
    },

    amountContainer: {
        alignItems: 'flex-end',
        minWidth: 70,
    },

    transactionAmount: {
        fontSize: 14,
        fontWeight: '900',
    },

    amountLabel: {
        color: '#475569',
        fontSize: 9,
        marginTop: 3,
    },

    // ============================================================
    // FOOTER
    // ============================================================

    footer: {
        alignItems: 'center',
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#16283A',
    },

    footerText: {
        color: '#334155',
        fontSize: 12,
        fontWeight: '800',
    },

    footerSubText: {
        color: '#26384A',
        fontSize: 10,
        marginTop: 3,
    },
});