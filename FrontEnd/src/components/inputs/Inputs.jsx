import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function Input({
    label, 
    placeholder, 
    value, 
    setValue, 
    secureTextEntry, 
    keyboardType = 'default', 
}) {
    return (
        <View>
            <Text>{label}</Text>
            <TextInput 
                placeholder={placeholder}
                value={value}
                onChangeText={setValue}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize='none'
            />
        </View>
    );
}