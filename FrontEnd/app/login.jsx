import {useState} from 'react';
import { View, Alert, StyleSheet, Button } from 'react-native';
import Input from '../src/components/inputs/Inputs';

export default function LogIn() {
    const [email, setEmail] =  useState('');
    const [password, setPassword] =  useState('');

    const sendLogin = async () => {
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
                Alert.alert('Succès', 'Connexion réussie');
            } else {
                Alert.alert('Erreur', data.message || 'Échec de la connexion');
            }
        } catch (error) {
            Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
        }
    };

    return (
        <View>
            <View>
                <View>
                    <Input
                        label="Email"
                        value={email}
                        setValue={setEmail}
                        placeholder="Entrez votre email"
                        keyboardType="email-address"
                    />
                </View>
                <View>
                    <Input
                        label="Mot de passe"
                        value={password}
                        setValue={setPassword}
                        placeholder="Entrez votre mot de passe"
                        secureTextEntry={true}
                    />
                </View>
                <View>
                    <Button title="Se connecter" onPress={sendLogin} />
                </View>
            </View>
        </View>
    )
}