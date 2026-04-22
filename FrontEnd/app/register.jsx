import { useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import Input from '@/components/inputs/Inputs';
import colors from '@/assets/constants/colors';
import { saveToken, getToken } from '@/utils/auth';
import fr from '@/assets/locales/fr.json';

export default function Register() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const checkToken = async () => {
            const token = await getToken();
            if (token) {
                router.replace('/');
            }
        };

        checkToken();
    }, [router]);

    const sendRegister = async () => {
        // Validation des champs vides
        if (!email.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre email');
            return;
        }
        if (!pseudo.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un pseudo');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer un mot de passe');
            return;
        }
        if (!confirmPassword.trim()) {
            Alert.alert('Erreur', 'Veuillez confirmer votre mot de passe');
            return;
        }

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
                const token = data?.token ?? data?.accessToken ?? data?.access_token;
                if (token) {
                    await saveToken(token);
                    Alert.alert('Succès', fr.registerScreen.success_message);
                    router.replace('/');
                } else {
                    Alert.alert('Erreur', 'Token non reçu du serveur');
                }
            } else if (response.status === 409) {
                Alert.alert('Erreur', 'Cet email est déjà utilisé');
            } else if (response.status === 410) {
                Alert.alert('Erreur', 'Ce pseudo est déjà utilisé');
            } else if (response.status === 429) {
                Alert.alert('Erreur', 'Trop de tentatives. Veuillez réessayer plus tard');
            } else if (response.status >= 500) {
                Alert.alert('Erreur', 'Erreur serveur. Veuillez réessayer plus tard');
            } else {
                Alert.alert('Erreur', data.message || fr.registerScreen.error_message + ' (Code: ' + response.status + ')');
            }
        } catch (error) {
            if (error.message.includes('Network') || error.message.includes('Failed')) {
                Alert.alert('Erreur', 'Erreur de connexion réseau. Vérifiez votre connexion internet');
            } else if (error.message.includes('timeout')) {
                Alert.alert('Erreur', 'La requête a expiré. Veuillez réessayer');
            } else {
                Alert.alert('Erreur', fr.registerScreen.server_error_message);
            }
        }
    };

    return (
        <View style={styles.background}>
            <Text style={styles.title}>{fr.registerScreen.header_title}</Text>
            <Text style={styles.subtitle}>{fr.registerScreen.header_subtitle}</Text>
            <View style={styles.container}>
                <Input 
                    label={fr.registerScreen.email_placeholder}
                    value={email}
                    setValue={setEmail}
                    placeholder={fr.registerScreen.email_placeholder}
                    keyboardType="email-address"
                />
                <Input
                    label={fr.registerScreen.pseudo_placeholder}
                    value={pseudo}
                    setValue={setPseudo}
                    placeholder={fr.registerScreen.pseudo_placeholder}
                    autoCapitalize="words"
                />
                <Input
                    label={fr.registerScreen.password_placeholder}
                    value={password}
                    setValue={setPassword}
                    placeholder={fr.registerScreen.password_placeholder}
                    secureTextEntry={true}            
                />
                <Input
                    label={fr.registerScreen.confirm_password_placeholder}
                    value={confirmPassword}
                    setValue={setConfirmPassword}
                    placeholder={fr.registerScreen.confirm_password_placeholder}
                    secureTextEntry={true}
                />
                <Pressable style={styles.registerButton} onPress={sendRegister}>
                    <Text style={styles.buttonText}>{fr.registerScreen.register_button}</Text>
                </Pressable>

                <View style={styles.socialTextAndHrContainer}>
                    <View style={styles.hr} />
                        <View style={styles.socialTextContainer}>
                            <Text style={styles.socialText}>{fr.registerScreen.social_login_desc}</Text>
                        </View>
                    <View style={styles.hr} />
                </View>

                <Pressable style={styles.socialButton}>
                    <Text style={styles.socialButtonText}>{fr.registerScreen.social_google}</Text>
                </Pressable>
                {/** TODO: ajouter "Connexion avec Google" logique */}
            </View>
            <Text style={styles.linkText}>{fr.registerScreen.login_prompt} <Link style={styles.link} href="/login"> {fr.registerScreen.login_link}</Link></Text>
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