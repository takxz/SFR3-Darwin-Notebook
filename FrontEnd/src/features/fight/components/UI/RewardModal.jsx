import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Trophy, Star, Coins, PawPrint } from 'lucide-react-native';
import colors from '@/assets/constants/colors.json';

export const RewardModal = ({ visible, rewards, onClose }) => {
    if (!rewards) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, !rewards.isWinner && styles.modalContainerDefeat]}>
                    {/* Header with Trophy or Skull/Flag */}
                    <View style={styles.header}>
                        <View style={[styles.trophyCircle, !rewards.isWinner && styles.defeatCircle]}>
                            {rewards.isWinner ? (
                                <Trophy size={40} color={colors.orangeDuel} />
                            ) : (
                                <View style={{ opacity: 0.6 }}>
                                    <Trophy size={40} color={colors.marronCuir} />
                                </View>
                            )}
                        </View>
                        <Text style={[styles.title, !rewards.isWinner && styles.titleDefeat]}>
                            {rewards.isWinner ? "VICTOIRE !" : "DÉFAITE"}
                        </Text>
                    </View>

                    <Text style={styles.subtitle}>
                        {rewards.isWinner 
                            ? "Félicitations Explorateur ! Voici vos récompenses :" 
                            : "Le combat était rude... Voici tout de même vos gains :"}
                    </Text>

                    {/* Reward Rows */}
                    <View style={styles.rewardsList}>
                        <View style={styles.rewardItem}>
                            <View style={styles.iconContainer}>
                                <Star size={24} color={colors.marronCuir} fill={colors.marronCuir} />
                            </View>
                            <View style={styles.rewardTextContainer}>
                                <Text style={styles.rewardValue}>+{rewards.xp} XP</Text>
                                <Text style={styles.rewardLabel}>Points d'Expérience</Text>
                            </View>
                        </View>

                        {rewards.playerLeveledUp && (
                            <View style={[styles.rewardItem, styles.levelUpItem]}>
                                <View style={[styles.iconContainer, { backgroundColor: '#4ade8020' }]}>
                                    <Star size={24} color="#22c55e" fill="#22c55e" />
                                </View>
                                <View style={styles.rewardTextContainer}>
                                    <Text style={[styles.rewardValue, { color: '#16a34a' }]}>NIVEAU SUPÉRIEUR !</Text>
                                    <Text style={styles.rewardLabel}>Vous êtes maintenant Niveau {rewards.newPLevel}</Text>
                                </View>
                            </View>
                        )}

                        {rewards.creatureLeveledUp && (
                            <View style={[styles.rewardItem, styles.levelUpItem]}>
                                <View style={[styles.iconContainer, { backgroundColor: '#3b82f620' }]}>
                                    <PawPrint size={24} color="#2563eb" />
                                </View>
                                <View style={styles.rewardTextContainer}>
                                    <Text style={[styles.rewardValue, { color: '#1d4ed8' }]}>ANIMAL LEVEL UP !</Text>
                                    <Text style={styles.rewardLabel}>Votre compagnon est Niveau {rewards.newCLevel}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.rewardItem}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.orangeDuel + '20' }]}>
                                <Coins size={24} color={colors.orangeDuel} />
                            </View>
                            <View style={styles.rewardTextContainer}>
                                <Text style={styles.rewardValue}>+{rewards.bioTokens}</Text>
                                <Text style={styles.rewardLabel}>BioTokens</Text>
                            </View>
                        </View>
                    </View>

                    {/* Button */}
                    <Pressable 
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.button,
                            pressed && styles.buttonPressed
                        ]}
                    >
                        <Text style={styles.buttonText}>CONTINUER</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '90%',
        backgroundColor: colors.blancJauni,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.marronCuir,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    trophyCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.marronCuir + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 2,
        borderColor: colors.orangeDuel,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.marronCuir,
        letterSpacing: 2,
        fontFamily: 'serif', // Matches notebook style
    },
    subtitle: {
        fontSize: 16,
        color: colors.marronCuir + 'CC',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'serif',
    },
    rewardsList: {
        width: '100%',
        marginBottom: 30,
    },
    rewardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF80',
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.marronCuir + '20',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.marronCuir + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rewardTextContainer: {
        flex: 1,
    },
    rewardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.marronCuir,
    },
    rewardLabel: {
        fontSize: 12,
        color: colors.marronCuir + '99',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    button: {
        backgroundColor: colors.marronCuir,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '100%',
        alignItems: 'center',
        shadowColor: colors.marronCuir,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonText: {
        color: colors.blancJauni,
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    levelUpItem: {
        borderColor: '#4ade80',
        backgroundColor: '#f0fdf4',
    },
    modalContainerDefeat: {
        borderColor: colors.marronCuir + '50',
    },
    defeatCircle: {
        borderColor: colors.marronCuir + '30',
        backgroundColor: colors.marronCuir + '05',
    },
    titleDefeat: {
        color: colors.marronCuir + '80',
    },
});
