import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DescriptionEditModal } from './DescriptionEditModal';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  X: () => null,
}));

// Mock profilStyles
jest.mock('./profilStyles', () => ({
  styles: {
    modalOverlay: {},
    descriptionModal: {},
    descriptionModalHeader: {},
    descriptionModalTitle: {},
    closeButton: {},
    descriptionModalContent: {},
    descriptionLabel: {},
    descriptionInput: {},
    charCount: {},
    saveButton: {},
    saveButtonText: {},
  },
}));

describe('DescriptionEditModal', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    description: 'Test description',
    onDescriptionChange: jest.fn(),
    onSave: jest.fn(),
    isSaving: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('doit afficher le modal avec le titre correct', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('Modifier la description')).toBeTruthy();
    });

    it('doit afficher le label "Votre description"', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('Votre description')).toBeTruthy();
    });

    it('doit afficher le placeholder du TextInput', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      const textInput = screen.getByDisplayValue('Test description');
      expect(textInput.props.placeholder).toBe('Écris ta description ici...');
    });

    it('doit afficher le compteur de caractères', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('16/150')).toBeTruthy();
    });

    it('doit afficher le bouton Enregistrer', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('Enregistrer')).toBeTruthy();
    });

    it('ne doit pas afficher le modal quand visible est false', () => {
      const { queryByText } = render(
        <DescriptionEditModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Modifier la description')).toBeFalsy();
    });

    it('doit afficher le texte "Enregistrement..." lors de isSaving=true', () => {
      render(<DescriptionEditModal {...defaultProps} isSaving={true} />);

      expect(screen.getByText('Enregistrement...')).toBeTruthy();
    });
  });

  describe('TextInput Interactions', () => {
    it('doit afficher la description actuelle dans le TextInput', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      const textInput = screen.getByDisplayValue('Test description');
      expect(textInput.props.value).toBe('Test description');
    });

    it('doit appeler onDescriptionChange quand le texte change', () => {
      const mockOnDescriptionChange = jest.fn();
      render(
        <DescriptionEditModal
          {...defaultProps}
          onDescriptionChange={mockOnDescriptionChange}
        />
      );

      const textInput = screen.getByDisplayValue('Test description');
      fireEvent.changeText(textInput, 'Nouvelle description');

      expect(mockOnDescriptionChange).toHaveBeenCalledWith('Nouvelle description');
    });

    it('doit gérer la description vide', () => {
      const mockOnDescriptionChange = jest.fn();
      render(
        <DescriptionEditModal
          {...defaultProps}
          description=""
          onDescriptionChange={mockOnDescriptionChange}
        />
      );

      expect(screen.getByText('0/150')).toBeTruthy();
    });

    it('doit afficher le bon compteur de caractères', () => {
      render(
        <DescriptionEditModal
          {...defaultProps}
          description="Ceci est un test"
        />
      );

      expect(screen.getByText('16/150')).toBeTruthy();
    });

    it('doit afficher 150/150 pour une description maximale', () => {
      const maxDescription = 'a'.repeat(150);
      render(
        <DescriptionEditModal
          {...defaultProps}
          description={maxDescription}
        />
      );

      expect(screen.getByText('150/150')).toBeTruthy();
    });
  });

  describe('Button Interactions', () => {
    it('doit appeler onSave quand le modal est en mode normal', () => {
      const mockOnSave = jest.fn();
      render(
        <DescriptionEditModal {...defaultProps} onSave={mockOnSave} />
      );

      expect(screen.getByText('Enregistrer')).toBeTruthy();
    });

    it('doit montrer le texte "Enregistrement..." lors de isSaving=true', () => {
      render(<DescriptionEditModal {...defaultProps} isSaving={true} />);

      expect(screen.getByText('Enregistrement...')).toBeTruthy();
    });

    it('doit afficher le bouton Enregistrer', () => {
      render(<DescriptionEditModal {...defaultProps} isSaving={false} />);

      expect(screen.getByText('Enregistrer')).toBeTruthy();
    });
  });

  describe('Props Management', () => {
    it('doit recevoir et utiliser la prop description', () => {
      render(
        <DescriptionEditModal
          {...defaultProps}
          description="Ma description personnelle"
        />
      );

      expect(screen.getByDisplayValue('Ma description personnelle')).toBeTruthy();
    });

    it('doit gérer les changements de prop description', () => {
      const { rerender } = render(
        <DescriptionEditModal
          {...defaultProps}
          description="Description 1"
        />
      );

      expect(screen.getByDisplayValue('Description 1')).toBeTruthy();

      rerender(
        <DescriptionEditModal
          {...defaultProps}
          description="Description 2"
        />
      );

      expect(screen.getByDisplayValue('Description 2')).toBeTruthy();
    });

    it('doit gérer les changements de prop isSaving', () => {
      const { rerender } = render(
        <DescriptionEditModal {...defaultProps} isSaving={false} />
      );

      expect(screen.getByText('Enregistrer')).toBeTruthy();

      rerender(<DescriptionEditModal {...defaultProps} isSaving={true} />);

      expect(screen.getByText('Enregistrement...')).toBeTruthy();
    });

    it('doit gérer les changements de prop visible', () => {
      const { rerender, queryByText } = render(
        <DescriptionEditModal {...defaultProps} visible={false} />
      );

      expect(queryByText('Modifier la description')).toBeFalsy();

      rerender(<DescriptionEditModal {...defaultProps} visible={true} />);

      expect(screen.getByText('Modifier la description')).toBeTruthy();
    });
  });

  describe('Modal Configuration', () => {
    it('doit utiliser animationType slide', () => {
      const { root } = render(
        <DescriptionEditModal {...defaultProps} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.animationType).toBe('slide');
    });

    it('doit être transparent', () => {
      const { root } = render(
        <DescriptionEditModal {...defaultProps} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.transparent).toBe(true);
    });

    it('doit avoir onRequestClose défini', () => {
      const mockOnClose = jest.fn();
      const { root } = render(
        <DescriptionEditModal {...defaultProps} onClose={mockOnClose} />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.onRequestClose).toBeDefined();
    });

    it('doit appeler onClose lors de onRequestClose', () => {
      const mockOnClose = jest.fn();
      const { root } = render(
        <DescriptionEditModal {...defaultProps} onClose={mockOnClose} />
      );

      const modal = root.findByType('Modal');
      modal.props.onRequestClose();

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('TextInput Configuration', () => {
    it('doit avoir multiline=true', () => {
      const { root } = render(
        <DescriptionEditModal {...defaultProps} />
      );

      const textInput = root.findByType('TextInput');
      expect(textInput.props.multiline).toBe(true);
    });

    it('doit avoir maxLength=150', () => {
      const { root } = render(
        <DescriptionEditModal {...defaultProps} />
      );

      const textInput = root.findByType('TextInput');
      expect(textInput.props.maxLength).toBe(150);
    });

    it('doit avoir le placeholder correct', () => {
      const { root } = render(
        <DescriptionEditModal {...defaultProps} />
      );

      const textInput = root.findByType('TextInput');
      expect(textInput.props.placeholder).toBe('Écris ta description ici...');
    });

    it('doit avoir placeholderTextColor défini', () => {
      const { root } = render(
        <DescriptionEditModal {...defaultProps} />
      );

      const textInput = root.findByType('TextInput');
      expect(textInput.props.placeholderTextColor).toBe('#8B5E3C');
    });
  });

  describe('Character Count Logic', () => {
    it('doit compter 0 caractères pour une description vide', () => {
      render(<DescriptionEditModal {...defaultProps} description="" />);

      expect(screen.getByText('0/150')).toBeTruthy();
    });

    it('doit compter correctement les caractères', () => {
      const testCases = [
        { description: 'a', expected: '1/150' },
        { description: 'ab', expected: '2/150' },
        { description: 'abc', expected: '3/150' },
        { description: 'a'.repeat(50), expected: '50/150' },
        { description: 'a'.repeat(100), expected: '100/150' },
        { description: 'a'.repeat(150), expected: '150/150' },
      ];

      testCases.forEach(({ description, expected }) => {
        const { unmount } = render(
          <DescriptionEditModal
            {...defaultProps}
            description={description}
          />
        );

        expect(screen.getByText(expected)).toBeTruthy();
        unmount();
      });
    });

    it('doit gérer les caractères spéciaux dans le compteur', () => {
      render(
        <DescriptionEditModal
          {...defaultProps}
          description="Hello, World!"
        />
      );

      expect(screen.getByText('13/150')).toBeTruthy();
    });
  });

  describe('Structure', () => {
    it('doit avoir un header avec titre', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('Modifier la description')).toBeTruthy();
    });

    it('doit avoir du contenu avec label et input', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('Votre description')).toBeTruthy();
      expect(screen.getByDisplayValue('Test description')).toBeTruthy();
    });

    it('doit avoir un bouton de sauvegarde', () => {
      render(<DescriptionEditModal {...defaultProps} />);

      expect(screen.getByText('Enregistrer')).toBeTruthy();
    });
  });
});
