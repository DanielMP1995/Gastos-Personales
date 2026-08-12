import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
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

    useEffect(() => {
        navigation.setOptions({ headerShown: false });

        const uid = usuarioActual?.uid;
        if (!uid) return;

        const userRef = ref(db, `usuarios/${uid}`);
        const unsubUser = onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.idPareja) {
                setIdPareja(data.idPareja);
            } else {
                setLoading(false);
            }
        });

        return () => unsubUser();
    }, [usuarioActual]);

    useEffect(() => {
        if (!idPareja) return;

        const movimientosRef = ref(db, `parejas/${idPareja}/movimientos`);
        const ingresosRef = ref(db, `parejas/${idPareja}/ingresos`);
        const deudasRef = ref(db, `parejas/${idPareja}/deudas`);

        let movimientosData: any = null;
        let ingresosData: any = null;
        let deudasData: any = null;

        function procesarDatos() {
            let listaMovimientos: any[] = [];
            let ingresosAcc = 0;
            let gastosAcc = 0;
            let deudasAcc = 0;

            if (movimientosData) {
                const listaMov = Object.keys(movimientosData).map((key) => ({
                    id: key,
                    ...movimientosData[key]
                }));

                listaMov.forEach((item) => {
                    const monto = Number(item.monto) || 0;
                    if (item.tipo === 'ingreso') {
                        ingresosAcc += monto;
                    } else if (item.tipo === 'gasto' || item.tipo === 'gastos') {
                        gastosAcc += monto;
                    }
                });
                listaMovimientos = [...listaMovimientos, ...listaMov];
            }

            if (ingresosData) {
                const listaIng = Object.keys(ingresosData).map((key) => ({
                    id: key,
                    ...ingresosData[key],
                    tipo: 'ingreso'
                }));

                listaIng.forEach((item) => {
                    const monto = Number(item.monto) || 0;
                    ingresosAcc += monto;
                });
                listaMovimientos = [...listaMovimientos, ...listaIng];
            }

            if (deudasData) {
                const listaDeudas = Object.keys(deudasData).map((key) => {
                    const deuda = deudasData[key];
                    const montoOriginal = Number(deuda.monto) || 0;

                    const pagosAsociados = listaMovimientos.filter(mov => {
                        if (mov.deudaId && mov.deudaId === key) return true;
                        const desc = (mov.descripcion || mov.entidadDeuda || '').toLowerCase();
                        const ent = (deuda.entidad || '').toLowerCase();
                        return (ent && desc.includes(ent)) || (mov.categoria === deuda.categoria && mov.tipo?.includes('pago'));
                    });

                    const totalPagado = pagosAsociados.reduce((sum, mov) => sum + (Number(mov.monto) || 0), 0);
                    const saldoPendiente = Math.max(0, montoOriginal - totalPagado);

                    deudasAcc += saldoPendiente;

                    return {
                        id: key,
                        ...deuda,
                        tipo: 'deuda',
                        montoRestante: saldoPendiente,
                        descripcion: deuda.descripcion || `${deuda.categoria || 'Deuda'} - ${deuda.entidad || ''}`
                    };
                });

                listaMovimientos = [...listaMovimientos, ...listaDeudas];
            }

            listaMovimientos.sort((a, b) => new Date(b.fechaRegistro || b.fecha || 0).getTime() - new Date(a.fechaRegistro || a.fecha || 0).getTime());

            setMovimientos(listaMovimientos);
            setTotalIngresos(ingresosAcc);
            setTotalGastos(gastosAcc);
            setTotalDeudas(deudasAcc);
            setLoading(false);
        }

        const unsubMovimientos = onValue(movimientosRef, (snapshot) => {
            movimientosData = snapshot.val();
            procesarDatos();
        });

        const unsubIngresos = onValue(ingresosRef, (snapshot) => {
            ingresosData = snapshot.val();
            procesarDatos();
        });

        const unsubDeudas = onValue(deudasRef, (snapshot) => {
            deudasData = snapshot.val();
            procesarDatos();
        });

        return () => {
            unsubMovimientos();
            unsubIngresos();
            unsubDeudas();
        };
    }, [idPareja]);

    const balanceNeto = totalIngresos - totalGastos;

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Image
                    source={require('../../assets/img/logov2.png')}
                    style={styles.logoHeader}
                    resizeMode="contain"
                />
                <View>
                    <Text style={styles.welcomeText}>Finanzas en Pareja</Text>
                    <Text style={styles.nameText}>Dashboard Compartido</Text>
                </View>
            </View>

            <Text style={styles.dashboardHeaderTitle}>Dashboard General del Mes</Text>

            <View style={styles.mainDashboardCard}>
                <Text style={styles.mainCardTitle}>Balance Neto Disponible</Text>
                <Text style={[styles.mainCardAmount, balanceNeto < 0 && styles.textRed]}>
                    ${balanceNeto.toFixed(2)}
                </Text>
                <Text style={styles.mainCardSubtitle}>Ingresos menos Gastos unificados</Text>
            </View>

            <View style={styles.dashboardGrid}>
                <View style={[styles.dashCard, { borderTopColor: '#10B981' }]}>
                    <Text style={styles.dashCardTitle}>Ingresos</Text>
                    <Text style={styles.dashCardIncome}>+${totalIngresos.toFixed(2)}</Text>
                </View>

                <View style={[styles.dashCard, { borderTopColor: '#EF4444' }]}>
                    <Text style={styles.dashCardTitle}>Gastos</Text>
                    <Text style={styles.dashCardExpense}>-${totalGastos.toFixed(2)}</Text>
                </View>

                <View style={[styles.dashCard, { borderTopColor: '#EA580C' }]}>
                    <Text style={styles.dashCardTitle}>Deudas</Text>
                    <Text style={styles.dashCardDebt}>-${totalDeudas.toFixed(2)}</Text>
                </View>
            </View>

            <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                    style={styles.actionButtonRapido}
                    onPress={() => navigation.navigate('gastosRapidos')}
                >
                    <Text style={styles.actionButtonText}>⚡ Gastos Rápidos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.actionButtonSmall}
                    onPress={() => navigation.navigate('Registros')}
                >
                    <Text style={styles.actionButtonText}> Registro Nuevos Movimientos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButtonSmall]} // Puedes quitar buttonInactive si quieres que resalte
                    onPress={() => navigation.navigate('deudas')}
                >
                    <Text style={styles.actionButtonText}>💳 Registro de Deudas</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Actividad Reciente en Pareja</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 20 }} />
            ) : movimientos.length === 0 ? (
                <Text style={styles.emptyText}>Aún no hay registros en esta pareja. ¡Empieza agregando uno!</Text>
            ) : (
                movimientos.map((item) => {
                    const esIngreso = item.tipo === 'ingreso';
                    const esDeuda = item.tipo === 'deuda';
                    return (
                        <View key={item.id} style={styles.transactionItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.transactionTitle}>{item.descripcion}</Text>
                                {esDeuda && item.cuotaPagar > 0 && (
                                    <Text style={styles.subDetailText}>Cuota: ${Number(item.cuotaPagar).toFixed(2)}</Text>
                                )}
                                <Text style={styles.transactionAuthor}>Registrado por: {item.autor || 'Usuario'}</Text>
                            </View>
                            <Text style={[styles.transactionAmount, esIngreso ? styles.textGreen : (esDeuda ? styles.textOrange : styles.textRed)]}>
                                {esIngreso ? `+$${Number(item.monto).toFixed(2)}` : (esDeuda ? `$${Number(item.monto).toFixed(2)}` : `-$${Number(item.monto).toFixed(2)}`)}
                            </Text>
                        </View>
                    );
                })
            )}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: { flex: 1, backgroundColor: '#0F172A' },
    container: { paddingHorizontal: 25, paddingTop: 40, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    logoHeader: { width: 60, height: 60, marginRight: 15 },
    welcomeText: { color: '#94A3B8', fontSize: 13 },
    nameText: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
    dashboardHeaderTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '700', marginBottom: 12 },
    mainDashboardCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 14, shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
    mainCardTitle: { color: '#94A3B8', fontSize: 13, marginBottom: 6 },
    mainCardAmount: { color: '#38BDF8', fontSize: 28, fontWeight: 'bold', marginBottom: 2 },
    mainCardSubtitle: { color: '#64748B', fontSize: 11 },
    textRed: { color: '#EF4444' },
    textGreen: { color: '#10B981' },
    textOrange: { color: '#EA580C' },
    dashboardGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    dashCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 12, width: '31%', borderWidth: 1, borderColor: '#334155', borderTopWidth: 4, alignItems: 'center' },
    dashCardTitle: { color: '#94A3B8', fontSize: 12, marginBottom: 6 },
    dashCardIncome: { color: '#10B981', fontSize: 14, fontWeight: '600' },
    dashCardExpense: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
    dashCardDebt: { color: '#EA580C', fontSize: 14, fontWeight: '600' },
    actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    actionButtonRapido: { flex: 1, backgroundColor: '#EA580C', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#EA580C' },
    actionButtonSmall: { flex: 1, backgroundColor: '#1D4ED8', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#3B82F6' },
    buttonInactive: { backgroundColor: '#1E293B', borderColor: '#334155' },
    actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    sectionTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    emptyText: { color: '#64748B', textAlign: 'center', marginTop: 10, fontSize: 14 },
    transactionItem: { backgroundColor: '#1E293B', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    transactionTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '500' },
    subDetailText: { color: '#38BDF8', fontSize: 12, marginTop: 2 },
    transactionAuthor: { color: '#64748B', fontSize: 11, marginTop: 2 },
    transactionAmount: { fontSize: 15, fontWeight: '600' }
})