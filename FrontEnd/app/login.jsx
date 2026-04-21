import { useEffect, useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import Input from '@/components/inputs/Inputs';
import colors from '@/assets/constants/colors';
import { getToken, saveToken } from '@/utils/auth';
import fr from '@/assets/locales/fr.json';

export default function LogIn() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const checkToken = async () => {
            const token = await getToken();
            if (token) router.replace('/');
        };

        checkToken();
    }, [router]);

    const sendLogin = async () => {
        // Validation des champs
        if (!email.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre email');
            return;
        }
        if (!password.trim()) {
            Alert.alert('Erreur', 'Veuillez entrer votre mot de passe');
            return;
        }

        try {
            const response = await fetch('http://ikdeksmp.fr:12000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                const token = data?.token ?? data?.accessToken ?? data?.access_token;
                if (token) {
                    await saveToken(token);
                    Alert.alert('Succès', fr.loginScreen.success_message);
                    router.replace('/');
                } else {
                    Alert.alert('Erreur', 'Token non reçu du serveur');
                }
            } else if (response.status === 401) {
                Alert.alert('Erreur', 'Email ou mot de passe incorrect');
            } else if (response.status === 429) {
                Alert.alert('Erreur', 'Trop de tentatives. Veuillez réessayer plus tard');
            } else if (response.status >= 500) {
                Alert.alert('Erreur', 'Erreur serveur. Veuillez réessayer plus tard');
            } else {
                Alert.alert('Erreur', data.message || fr.loginScreen.error_message);
            }
        } catch (error) {
            if (error.message.includes('Network') || error.message.includes('Failed')) {
                Alert.alert('Erreur', 'Erreur de connexion réseau. Vérifiez votre connexion internet');
            } else if (error.message.includes('timeout')) {
                Alert.alert('Erreur', 'La requête a expiré. Veuillez réessayer');
            } else {
                Alert.alert('Erreur', fr.loginScreen.server_error_message);
            }
        }
    };

    return (
        <View style={styles.background}>
            <Text style={styles.title}>{fr.loginScreen.header_title}</Text>
            <Text style={styles.subtitle}>{fr.loginScreen.header_subtitle}</Text>
            <View style={styles.container}>
                <Input
                    label={fr.loginScreen.email_placeholder}
                    value={email}
                    setValue={setEmail}
                    placeholder={fr.loginScreen.email_placeholder}
                    keyboardType="email-address"
                />
                <Input
                    label={fr.loginScreen.password_placeholder}
                    value={password}
                    setValue={setPassword}
                    placeholder={fr.loginScreen.password_placeholder}
                    secureTextEntry={true}
                />
                {/** TODO: ajouter "Mot de passe oublié?" lien et logique */}

                <View>
                    <Pressable style={styles.loginButton} onPress={sendLogin}>
                        <Text style={styles.buttonText}>{fr.loginScreen.login_button}</Text>
                    </Pressable>
                </View>

                <View style={styles.socialTextAndHrContainer}>
                    <View style={styles.hr} />
                        <View style={styles.socialTextContainer}>
                            <Text style={styles.socialText}>{fr.loginScreen.social_login_desc}</Text>
                        </View>
                    <View style={styles.hr} />
                </View>

                <Pressable style={styles.socialButton}>
                    <Text style={styles.socialButtonText}>{fr.loginScreen.social_google}</Text>
                </Pressable>
                {/** TODO: ajouter "Connexion avec Google" logique */}
            </View>
            <Text style={styles.linkText}>{fr.loginScreen.register_prompt}<Link style={styles.link} href="/register"> {fr.loginScreen.register_link}</Link></Text>
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
    loginButton: {
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