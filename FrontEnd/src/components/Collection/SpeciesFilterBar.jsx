import { View, Text, Pressable, StyleSheet } from 'react-native';

export function SpeciesFilterBar({ options, selectedKey, onSelect }) {
    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                {options.map((option) => {
                    const isSelected = option.key === selectedKey;

                    return (
                        <Pressable
                            key={option.key}
                            onPress={() => onSelect(option.key)}
                            style={[styles.tab, isSelected && styles.selectedTab]}
                        >
                            <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 8,
        backgroundColor: 'transparent',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6dccb',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#d8c5a7',
        padding: 4,
        gap: 4,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        minHeight: 38,
    },
    selectedTab: {
        backgroundColor: '#9b5a2f',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#b2875e',
    },
    selectedLabel: {
        color: '#fff8ec',
    },
});