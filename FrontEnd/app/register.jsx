import { useState } from "react";
import { Link } from 'expo-router';
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import Input from '@/components/inputs/Inputs';
import colors from '@/assets/constants/colors';

export default function Register() {
    const [email, setEmail] =  useState('');
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] =  useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const sendRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');

            return;
        }
        try {
            const response = await fetch('http://ikdeksmp.fr:12000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email,
                    pseudo,
                    password,
                    player_level: 1,
                    xp: 0,
                    bio_token: '',
                 })
            });
            const data = await response.json();

            if (response.ok) {
                Alert.alert('Succès', 'Inscription réussie');
            } else {
                Alert.alert('Erreur', data.message || 'Échec de l\'inscription');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue lors de l\'inscription');
        }
    };

    return (
        <View style={styles.background}>
            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>Créez votre compte pour commencer à jouer !</Text>
            <View style={styles.container}>
                <Input 
                    label="Email"
                    value={email}
                    setValue={setEmail}
                    placeholder="Entrez votre email"
                    keyboardType="email-address"
                />
                <Input
                    label="Nom d'utilisateur"
                    value={pseudo}
                    setValue={setPseudo}
                    placeholder="Entrez votre nom d'utilisateur"
                    autoCapitalize="words"
                />
                <Input
                    label="Mot de passe"
                    value={password}
                    setValue={setPassword}
                    placeholder="Entrez votre mot de passe"
                    secureTextEntry={true}            
                />
                <Input
                    label="Confirmer le mot de passe"
                    value={confirmPassword}
                    setValue={setConfirmPassword}
                    placeholder="Confirmez votre mot de passe"
                    secureTextEntry={true}
                />
                <Pressable style={styles.registerButton} onPress={sendRegister}>
                    <Text style={styles.buttonText}>Créer un compte</Text>
                </Pressable>

                <View style={styles.socialTextAndHrContainer}>
                    <View style={styles.hr} />
                        <View style={styles.socialTextContainer}>
                            <Text style={styles.socialText}>Ou continuer avec</Text>
                        </View>
                    <View style={styles.hr} />
                </View>

                <Pressable style={styles.socialButton}>
                    <Text style={styles.socialButtonText}>Connexion avec Google (Désactivé pour l'instant)</Text>
                </Pressable>
                {/** TODO: ajouter "Connexion avec Google" logique */}
            </View>
            <Text style={styles.linkText}>Vous avez déjà un compte ? <Link style={styles.link} href="/login">Se connecter</Link></Text>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: colors.blanc,
    },
    container: {
        width: '80%',
        padding: 20,
        backgroundColor: colors.blancJauni,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: colors.marronCuir + '80',
        boxShadow: '0 4px 8px ' + colors.marronCuir + 'BB',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        color: colors.marronCuir,
    },
    registerButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 20,
        marginBottom: 10,
        backgroundColor: colors.marronCuir,
        borderRadius: 10,
    },
    buttonText: {
        color: colors.blanc,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    socialTextAndHrContainer: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
        alignSelf: 'center',
    },
    socialTextContainer: {
        backgroundColor: colors.marronCuir + '40',
        borderRadius: 10,
        paddingVertical: 5,
        width: '40%',
        display: 'flex',
        alignSelf: 'center',
    },
    hr: {
        borderBottomColor: colors.marronCuir,
        borderBottomWidth: 1,
        marginVertical: 10,
        flex: 1,
    },
    socialText: {
        fontSize: 10,
        textAlign: 'center',
        color: colors.marronCuir,
    }, 
    socialButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 10,
        backgroundColor: colors.blanc + '80',
        borderRadius: 10,
    },
    socialButtonText: {
        color: colors.noir,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    linkText: {
        marginTop: 20,
        fontSize: 14,
        color: colors.marronCuir,
    },
    link: {
        color: colors.marronCuir,
        fontWeight: 'bold',
    },
});