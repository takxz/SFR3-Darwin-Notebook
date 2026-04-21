import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import colors from '@/assets/constants/colors';

export default function Input({
    label, 
    placeholder, 
    value, 
    setValue, 
    secureTextEntry, 
    keyboardType = 'default', 
    autoCapitalize = 'none',
}) {
    return (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput 
                placeholder={placeholder}
                value={value}
                onChangeText={setValue}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize}
                style={styles.input}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    inputContainer: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.noir + '80',
        borderRadius: 15,
        ...Platform.select({
            ios: {
                shadowColor: colors.noir,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
            web: {
                boxShadow: '0 0px 4px ' + colors.noir + 'A0',
            }
        }),
        padding: 10,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: colors.blanc + '80',
    },
});