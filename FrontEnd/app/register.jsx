import { useState } from "react";
import { Link } from 'expo-router';
import { View, Text, Alert, StyleSheet, Button } from 'react-native';
import Input from '../src/components/inputs/Inputs';

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
            <View style={styles.container}>
                <Text style={styles.title}>Bienvenue</Text>
                <Text style={styles.subtitle}>Créez votre compte pour commencer à jouer !</Text>
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
                <Button style={styles.registerButton} title="Créer un compte" onPress={sendRegister} />

                <Text style={styles.socialText}>Ou continuer avec</Text>

                <Button style={styles.socialButton} title="Continuer avec Google" />
                <Button style={styles.socialButton} title="Continuer avec Apple ID" />
            </View>
                <Text style={styles.linkText}>Vous avez déjà un compte ? <Link href="/login">Se connecter</Link></Text>
        </View>
    )
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        backgroundColor: '#f0f0f0',
    },
    container: {
        width: '80%',
        padding: 20,
        backgroundColor: 'white',
        textAlign: 'center',
    },

});