import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function SeleccionarTemaScreen({ navigation }: any) {
    const { colors, cambiarTema, temas } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.veryLight }]}>
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.headerText}>
                    <Text style={styles.title}>Personalizar aplicación</Text>
                    <Text style={styles.subtitle}>Elige el color que prefieras</Text>
                </View>
            </View>

<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

    <View style={[styles.sectionBadge, { backgroundColor: colors.light }]}>
        <Ionicons name="color-palette" size={16} color={colors.primary} />
        <Text style={[styles.sectionBadgeText, { color: colors.primary }]}>
            Apariencia
        </Text>
    </View>

    {/* VISTA PREVIA ARRIBA */}
    <Text style={[styles.sectionTitle, { color: colors.dark }]}>
        Vista previa
    </Text>

    <Text style={styles.previewHint}>
        Así se verán los elementos principales de tu app.
    </Text>

    <View style={[styles.previewCard, { borderColor: colors.light }]}>
        <View style={[styles.previewHeader, { backgroundColor: colors.primary }]}>
            <View style={styles.previewHeaderDot} />
            <Text style={styles.previewHeaderText}>PERFIL</Text>
            <View style={styles.previewHeaderDot} />
        </View>

        <View style={styles.previewBody}>
            <View style={[styles.previewAvatar, { backgroundColor: colors.light }]}>
                <Ionicons name="person" size={28} color={colors.primary} />
            </View>

            <Text style={styles.previewLabel}>Ejemplo de botón</Text>

            <View
                style={[
                    styles.previewButton,
                    { backgroundColor: colors.primary },
                ]}
            >
                <Text style={styles.previewButtonText}>Guardar</Text>
            </View>
        </View>
    </View>

    {/* COLORES ABAJO */}
    <Text style={[styles.sectionTitle, { color: colors.dark, marginTop: 28 }]}>
        Color de la aplicación
    </Text>

    <Text style={styles.description}>
        Selecciona un color para personalizar el perfil de tu aplicación.
        El cambio se aplica al instante.
    </Text>

    <View style={styles.colorsGrid}>
        {temas.map(tema => {
            const seleccionado = colors.id === tema.id;

            return (
                <TouchableOpacity
                    key={tema.id}
                    style={[
                        styles.colorCard,
                        seleccionado && {
                            borderColor: tema.primary,
                            borderWidth: 2,
                            backgroundColor: colors.veryLight,
                            transform: [{ scale: 1.02 }],
                        },
                    ]}
                    onPress={() => cambiarTema(tema)}
                    activeOpacity={0.85}
                >
                    <View
                        style={[
                            styles.colorCircle,
                            { backgroundColor: tema.primary },
                            seleccionado && styles.colorCircleSelected,
                        ]}
                    >
                        {seleccionado && (
                            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                        )}
                    </View>

                    <Text
                        style={[
                            styles.colorName,
                            seleccionado && {
                                color: tema.primary,
                                fontWeight: '800',
                            },
                        ]}
                    >
                        {tema.name}
                    </Text>
                </TouchableOpacity>
            );
        })}
    </View>

    <TouchableOpacity
        style={[
            styles.btnRegresar,
            {
                borderColor: colors.light,
                backgroundColor: '#FFFFFF',
            },
        ]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
    >
        <Ionicons name="arrow-back" size={18} color={colors.primary} />
        <Text style={[styles.btnRegresarText, { color: colors.primary }]}>
            Volver a Perfil
        </Text>
    </TouchableOpacity>

</ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    header: {
        minHeight: 115,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 48 : 52,
        paddingBottom: 22,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },

    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },

    headerText: {
        marginLeft: 14,
        flex: 1,
    },

    title: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    subtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        marginTop: 4,
        lineHeight: 17,
    },

    content: {
        padding: 22,
        paddingBottom: 40,
    },

    sectionBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },

    sectionBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 7,
    },

    description: {
        color: '#737A77',
        fontSize: 13,
        lineHeight: 21,
        marginBottom: 22,
    },

    colorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 30,
    },

    colorCard: {
        width: '31%',
        minHeight: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#E4E7E6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },

    colorCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },

    colorCircleSelected: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },

    colorName: {
        color: '#303534',
        fontSize: 12,
        fontWeight: '600',
    },

    previewHint: {
        color: '#737A77',
        fontSize: 12,
        marginBottom: 12,
        lineHeight: 18,
    },

    previewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },

    previewHeader: {
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    previewHeaderDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.45)',
    },

    previewHeaderText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.2,
    },

    previewBody: {
        padding: 22,
        alignItems: 'center',
    },

    previewAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },

    previewLabel: {
        color: '#555C59',
        fontSize: 13,
        marginBottom: 14,
        fontWeight: '600',
    },

    previewButton: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },

    previewButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    btnRegresar: {
        marginTop: 26,
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },

    btnRegresarText: {
        fontSize: 14,
        fontWeight: '800',
        marginLeft: 7,
    },
});