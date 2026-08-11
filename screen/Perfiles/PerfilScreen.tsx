import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, Clipboard } from 'react-native'
import React, { useState, useEffect } from 'react'
import { auth, db } from '../../firebase/FirebaseConfig';
import { ref, onValue, update } from 'firebase/database';

export default function PerfilScreen({ navigation }: any) {
    const usuarioActual = auth.currentUser;
    const [data, setData] = useState({ nombre: '', apellido: '', correo: '', genero: '', idPareja: '' });
    const [nombreParejaVinculada, setNombreParejaVinculada] = useState('Buscando pareja vinculada...');
    
    // Estados para la vinculación posterior desde el perfil
    const [codigoNuevo, setCodigoNuevo] = useState('');
    const [modoVincular, setModoVincular] = useState(false);

    useEffect(() => {
        if (usuarioActual) {
            const perfilRef = ref(db, `usuarios/${usuarioActual.uid}`);
            onValue(perfilRef, (snapshot) => {
                const val = snapshot.val();
                if (val) {
                    setData(val);
                    
                    // Buscar en todos los usuarios si hay alguien más con el mismo idPareja
                    const usuariosRef = ref(db, 'usuarios');
                    onValue(usuariosRef, (snapUsuarios) => {
                        const allUsers = snapUsuarios.val();
                        if (allUsers) {
                            let encontrado = false;
                            Object.keys(allUsers).forEach((uidKey) => {
                                const usuarioItem = allUsers[uidKey];
                                if (uidKey !== usuarioActual.uid && usuarioItem.idPareja === val.idPareja) {
                                    setNombreParejaVinculada(`${usuarioItem.nombre} ${usuarioItem.apellido}`);
                                    encontrado = true;
                                }
                            });
                            if (!encontrado) {
                                setNombreParejaVinculada('Aún nadie se ha unido con este código');
                            }
                        }
                    });
                }
            });
        }
    }, [usuarioActual]);

    function copiarCodigo() {
        Clipboard.setString(data.idPareja);
        Alert.alert("Copiado", "Tu código ha sido copiado al portapapeles.");
    }

    // Guardar el nuevo código de pareja ya creada la cuenta
    function guardarNuevoCodigoPareja() {
        if (!codigoNuevo.trim()) {
            Alert.alert("Error", "Por favor ingresa un código válido.");
            return;
        }

        if (usuarioActual) {
            const codigoLimpio = codigoNuevo.trim().toUpperCase();
            update(ref(db, `usuarios/${usuarioActual.uid}`), {
                idPareja: codigoLimpio
            })
            .then(() => {
                Alert.alert("¡Éxito!", "Te has vinculado correctamente con el nuevo código.");
                setModoVincular(false);
                setCodigoNuevo('');
            })
            .catch((error) => {
                Alert.alert("Error", error.message);
            });
        }
    }

    // Función segura para cerrar sesión y redirigir al Login
    function cerrarSesion() {
        auth.signOut()
            .then(() => {
                // Redirige al login y limpia el historial de navegación para que no pueda volver atrás
                navigation.replace('login');
            })
            .catch((error) => {
                Alert.alert("Error", "No se pudo cerrar sesión: " + error.message);
            });
    }

    return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
            <Text style={styles.titulo}>Mi Perfil</Text>
            
            {/* TARJETA DE CÓDIGO DE CONEXIÓN */}
            <View style={styles.roleCard}>
                <Text style={styles.roleTitle}>Tu Código de Conexión</Text>
                <Text style={styles.roleName}>{data.idPareja}</Text>
                <TouchableOpacity style={styles.copiarBtn} onPress={copiarCodigo}>
                    <Text style={styles.copiarText}>📋 Copiar código para compartir</Text>
                </TouchableOpacity>
            </View>

            {/* SECCIÓN SÚPER VISIBLE PARA VINCULAR PAREJA */}
            <View style={styles.vincularCardDestacada}>
                <Text style={styles.vincularCardTitulo}>💍 ¿Quieres unirte al código de tu pareja?</Text>
                <Text style={styles.vincularCardSub}>Si ya tienes un código creado por tu pareja, pégalo aquí para sincronizar sus datos.</Text>

                {!modoVincular ? (
                    <TouchableOpacity style={styles.btnAbrirVincular} onPress={() => setModoVincular(true)}>
                        <Text style={styles.btnAbrirVincularText}>🔗 Registrar Código de Pareja</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.vincularBox}>
                        <TextInput 
                            style={styles.inputVinculo}
                            placeholder="Ej. ABC123"
                            placeholderTextColor="#94A3B8"
                            value={codigoNuevo}
                            onChangeText={setCodigoNuevo}
                            autoCapitalize="characters"
                        />
                        <View style={styles.rowBotonesVinculo}>
                            <TouchableOpacity style={styles.btnGuardarVinculo} onPress={guardarNuevoCodigoPareja}>
                                <Text style={styles.btnGuardarVinculoText}>Guardar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnCancelarVinculo} onPress={() => setModoVincular(false)}>
                                <Text style={styles.btnCancelarVinculoText}>Cancelar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* TARJETA DE PAREJA VINCULADA */}
            <View style={styles.vinculoCard}>
                <Text style={styles.labelVinculo}>💍 Pareja Vinculada:</Text>
                <Text style={styles.valueVinculo}>{nombreParejaVinculada}</Text>
            </View>

            <Text style={styles.sectionTitle}>Datos Personales</Text>
            <View style={styles.infoBox}><Text style={styles.label}>Nombre completo</Text><Text style={styles.value}>{data.nombre} {data.apellido}</Text></View>
            <View style={styles.infoBox}><Text style={styles.label}>Género</Text><Text style={styles.value}>{data.genero}</Text></View>
            <View style={styles.infoBox}><Text style={styles.label}>Correo</Text><Text style={styles.value}>{data.correo}</Text></View>

            <TouchableOpacity style={styles.secondaryButton} onPress={cerrarSesion}>
                <Text style={styles.secondaryButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scrollView: { 
        flex: 1, 
        backgroundColor: '#0F172A' 
    },
    container: { 
        padding: 25, 
        paddingTop: 40 
    },
    titulo: { 
        textAlign: 'center', 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#38BDF8', 
        marginBottom: 20 
    },
    roleCard: { 
        backgroundColor: '#1E293B', 
        borderRadius: 14, 
        padding: 16, 
        alignItems: 'center', 
        marginBottom: 15, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    roleTitle: { 
        color: '#94A3B8', 
        fontSize: 12 
    },
    roleName: { 
        color: '#38BDF8', 
        fontSize: 22, 
        fontWeight: 'bold', 
        marginVertical: 8 
    },
    copiarBtn: { 
        backgroundColor: '#38BDF8', 
        padding: 8, 
        borderRadius: 8 
    },
    copiarText: { 
        color: '#0F172A', 
        fontWeight: 'bold', 
        fontSize: 12 
    },
    vincularCardDestacada: { 
        backgroundColor: '#1E3A8A', 
        borderRadius: 14, 
        padding: 18, 
        marginBottom: 15, 
        borderWidth: 1.5, 
        borderColor: '#60A5FA', 
        alignItems: 'center' 
    },
    vincularCardTitulo: { 
        color: '#FFFFFF', 
        fontSize: 15, 
        fontWeight: 'bold', 
        textAlign: 'center', 
        marginBottom: 6 
    },
    vincularCardSub: { 
        color: '#93C5FD', 
        fontSize: 12, 
        textAlign: 'center', 
        marginBottom: 14 
    },
    btnAbrirVincular: { 
        backgroundColor: '#EA580C', 
        width: '100%', 
        paddingVertical: 12, 
        borderRadius: 10, 
        alignItems: 'center' 
    },
    btnAbrirVincularText: { 
        color: '#FFFFFF', 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    vincularBox: { 
        width: '100%', 
        marginTop: 5 
    },
    inputVinculo: { 
        backgroundColor: '#0F172A', 
        borderWidth: 1, 
        borderColor: '#60A5FA', 
        borderRadius: 8, 
        padding: 12, 
        color: '#F8FAFC', 
        marginBottom: 10, 
        fontSize: 15, 
        textAlign: 'center' 
    },
    rowBotonesVinculo: { 
        flexDirection: 'row', 
        justifyContent: 'space-between' 
    },
    btnGuardarVinculo: { 
        backgroundColor: '#EA580C', 
        flex: 0.48, 
        padding: 11, 
        borderRadius: 8, 
        alignItems: 'center' 
    },
    btnGuardarVinculoText: { 
        color: '#FFFFFF', 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    btnCancelarVinculo: { 
        backgroundColor: '#334155', 
        flex: 0.48, 
        padding: 11, 
        borderRadius: 8, 
        alignItems: 'center' 
    },
    btnCancelarVinculoText: { 
        color: '#F8FAFC', 
        fontWeight: 'bold', 
        fontSize: 13 
    },
    vinculoCard: { 
        backgroundColor: '#1E293B', 
        borderRadius: 12, 
        padding: 14, 
        marginBottom: 20, 
        borderWidth: 1, 
        borderColor: '#334155', 
        alignItems: 'center' 
    },
    labelVinculo: { 
        color: '#94A3B8', 
        fontSize: 12, 
        fontWeight: '600' 
    },
    valueVinculo: { 
        color: '#38BDF8', 
        fontSize: 16, 
        fontWeight: 'bold', 
        marginTop: 4 
    },
    sectionTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: '#F8FAFC', 
        marginBottom: 12 
    },
    infoBox: { 
        backgroundColor: '#1E293B', 
        padding: 14, 
        borderRadius: 10, 
        marginBottom: 10, 
        borderWidth: 1, 
        borderColor: '#334155' 
    },
    label: { 
        color: '#94A3B8', 
        fontSize: 11 
    },
    value: { 
        color: '#F8FAFC', 
        fontSize: 15, 
        fontWeight: '600' 
    },
    secondaryButton: { 
        marginTop: 20, 
        padding: 14, 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: '#EF4444', 
        borderRadius: 10 
    },
    secondaryButtonText: { 
        color: '#EF4444', 
        fontWeight: '600' 
    }
})