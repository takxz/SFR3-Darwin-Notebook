import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Input from './Inputs';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/assets/constants/colors', () => ({
    default: { noir: '#000000', blanc: '#FFFFFF' },
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Input', () => {
    describe('Rendu de base', () => {
        it('doit se rendre sans erreur', () => {
            expect(() =>
                render(<Input label="Email" placeholder="email@test.com" value="" setValue={jest.fn()} />)
            ).not.toThrow();
        });

        it('doit afficher le label', () => {
            render(<Input label="Email" placeholder="" value="" setValue={jest.fn()} />);
            expect(screen.getByText('Email')).toBeTruthy();
        });

        it('doit afficher le placeholder', () => {
            render(<Input label="Email" placeholder="Entrez votre email" value="" setValue={jest.fn()} />);
            expect(screen.getByPlaceholderText('Entrez votre email')).toBeTruthy();
        });

        it('doit afficher la valeur courante', () => {
            render(<Input label="Email" placeholder="" value="test@example.com" setValue={jest.fn()} />);
            expect(screen.getByDisplayValue('test@example.com')).toBeTruthy();
        });
    });

    describe('Props', () => {
        it('doit passer secureTextEntry au TextInput', () => {
            const { UNSAFE_getByType } = render(
                <Input label="Mot de passe" placeholder="" value="" setValue={jest.fn()} secureTextEntry={true} />
            );
            const { TextInput } = require('react-native');
            const input = UNSAFE_getByType(TextInput);
            expect(input.props.secureTextEntry).toBe(true);
        });

        it('ne doit pas masquer le texte par défaut (secureTextEntry undefined)', () => {
            const { UNSAFE_getByType } = render(
                <Input label="Email" placeholder="" value="" setValue={jest.fn()} />
            );
            const { TextInput } = require('react-native');
            const input = UNSAFE_getByType(TextInput);
            expect(input.props.secureTextEntry).toBeFalsy();
        });

        it('doit passer keyboardType au TextInput', () => {
            const { UNSAFE_getByType } = render(
                <Input label="Téléphone" placeholder="" value="" setValue={jest.fn()} keyboardType="phone-pad" />
            );
            const { TextInput } = require('react-native');
            const input = UNSAFE_getByType(TextInput);
            expect(input.props.keyboardType).toBe('phone-pad');
        });

        it('doit utiliser keyboardType "default" par défaut', () => {
            const { UNSAFE_getByType } = render(
                <Input label="Texte" placeholder="" value="" setValue={jest.fn()} />
            );
            const { TextInput } = require('react-native');
            const input = UNSAFE_getByType(TextInput);
            expect(input.props.keyboardType).toBe('default');
        });

        it('doit passer autoCapitalize au TextInput', () => {
            const { UNSAFE_getByType } = render(
                <Input label="Nom" placeholder="" value="" setValue={jest.fn()} autoCapitalize="words" />
            );
            const { TextInput } = require('react-native');
            const input = UNSAFE_getByType(TextInput);
            expect(input.props.autoCapitalize).toBe('words');
        });

        it('doit utiliser autoCapitalize "none" par défaut', () => {
            const { UNSAFE_getByType } = render(
                <Input label="Email" placeholder="" value="" setValue={jest.fn()} />
            );
            const { TextInput } = require('react-native');
            const input = UNSAFE_getByType(TextInput);
            expect(input.props.autoCapitalize).toBe('none');
        });
    });

    describe('Interaction', () => {
        it('doit appeler setValue avec la nouvelle valeur lors de la saisie', () => {
            const setValue = jest.fn();
            render(<Input label="Email" placeholder="" value="" setValue={setValue} />);
            fireEvent.changeText(screen.getByPlaceholderText(''), 'nouveau@email.com');
            expect(setValue).toHaveBeenCalledWith('nouveau@email.com');
        });

        it('doit appeler setValue une seule fois par changement', () => {
            const setValue = jest.fn();
            render(<Input label="Email" placeholder="email" value="" setValue={setValue} />);
            fireEvent.changeText(screen.getByPlaceholderText('email'), 'test');
            expect(setValue).toHaveBeenCalledTimes(1);
        });
    });
});
