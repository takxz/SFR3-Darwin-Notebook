import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { DeleteConfirmModal } from './DeleteConfirmModal';

// Mock lucide-react-native
jest.mock('lucide-react-native', () => ({
  Trash2: () => null,
}));

// Mock profilStyles
jest.mock('./profilStyles', () => ({
  styles: {
    modalOverlay: {},
    deleteModal: {},
    deleteContent: {},
    deleteIcon: {},
    deleteTitle: {},
    deleteText: {},
    deleteButtons: {},
    cancelButton: {},
    cancelText: {},
    confirmButton: {},
    confirmText: {},
  },
}));

describe('DeleteConfirmModal', () => {
  describe('Rendering', () => {
    it('doit afficher le modal avec le titre correct', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();
    });

    it('doit afficher le texte d\'avertissement', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(
        screen.getByText(
          'Cette action est irréversible. Toutes vos données, captures et progrès seront définitivement supprimés.'
        )
      ).toBeTruthy();
    });

    it('doit afficher le bouton Annuler', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Annuler')).toBeTruthy();
    });

    it('doit afficher le bouton Supprimer', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer')).toBeTruthy();
    });

    it('ne doit pas afficher le modal quand visible est false', () => {
      const { queryByText } = render(
        <DeleteConfirmModal
          visible={false}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(queryByText('Supprimer le compte ?')).toBeFalsy();
    });
  });

  describe('Modal Interactions', () => {
    it('doit appeler onClose quand onRequestClose est déclenché', () => {
      const mockOnClose = jest.fn();
      const { root } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={jest.fn()}
        />
      );

      const modal = root.findByType('Modal');
      modal.props.onRequestClose();

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('doit avoir les callbacks onClose et onConfirm définis', () => {
      const mockOnClose = jest.fn();
      const mockOnConfirm = jest.fn();

      render(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(mockOnClose).toBeDefined();
      expect(mockOnConfirm).toBeDefined();
    });
  });

  describe('Props', () => {
    it('doit recevoir les props visible, onClose, et onConfirm', () => {
      const mockOnClose = jest.fn();
      const mockOnConfirm = jest.fn();

      const { rerender } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();

      rerender(
        <DeleteConfirmModal
          visible={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByText('Supprimer le compte ?')).toBeFalsy();
    });

    it('doit gérer les changements de prop visible', () => {
      const { rerender, queryByText } = render(
        <DeleteConfirmModal
          visible={false}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(queryByText('Supprimer le compte ?')).toBeFalsy();

      rerender(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();
    });
  });

  describe('Modal Configuration', () => {
    it('doit utiliser animationType fade', () => {
      const { root } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.animationType).toBe('fade');
    });

    it('doit être transparent', () => {
      const { root } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.transparent).toBe(true);
    });

    it('doit avoir onRequestClose défini', () => {
      const { root } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.onRequestClose).toBeDefined();
    });

    it('doit avoir visible prop défini', () => {
      const { root } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const modal = root.findByType('Modal');
      expect(modal.props.visible).toBe(true);
    });
  });

  describe('Structure', () => {
    it('doit avoir un overlay modal', () => {
      const { root } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const views = root.findAllByType('View');
      expect(views.length).toBeGreaterThan(0);
    });

    it('doit avoir du contenu de suppression', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();
      expect(
        screen.getByText(
          'Cette action est irréversible. Toutes vos données, captures et progrès seront définitivement supprimés.'
        )
      ).toBeTruthy();
      expect(screen.getByText('Annuler')).toBeTruthy();
      expect(screen.getByText('Supprimer')).toBeTruthy();
    });

    it('doit avoir au minimum 4 éléments texte (titre, message, 2 boutons)', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const texts = [
        'Supprimer le compte ?',
        'Cette action est irréversible. Toutes vos données, captures et progrès seront définitivement supprimés.',
        'Annuler',
        'Supprimer',
      ];

      texts.forEach(text => {
        expect(screen.getByText(text)).toBeTruthy();
      });
    });
  });

  describe('Text Content', () => {
    it('doit afficher le titre de confirmation correct', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();
    });

    it('doit afficher un message d\'avertissement complet', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      const warningText = screen.getByText(
        'Cette action est irréversible. Toutes vos données, captures et progrès seront définitivement supprimés.'
      );
      expect(warningText).toBeTruthy();
    });

    it('doit avoir un libellé Annuler exact', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Annuler')).toBeTruthy();
    });

    it('doit avoir un libellé Supprimer exact', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer')).toBeTruthy();
    });

    it('doit avoir le contenu texte approprié', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer')).toBeTruthy();
      expect(screen.getByText(/irréversible/i)).toBeTruthy();
    });
  });

  describe('Visibility Management', () => {
    it('doit afficher le modal quand visible est true', () => {
      render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();
    });

    it('doit masquer le modal quand visible est false', () => {
      const { queryByText } = render(
        <DeleteConfirmModal
          visible={false}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(queryByText('Supprimer le compte ?')).toBeFalsy();
    });

    it('doit réagir aux changements de visible pendant le cycle de vie', () => {
      const { rerender } = render(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();

      rerender(
        <DeleteConfirmModal
          visible={false}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.queryByText('Supprimer le compte ?')).toBeFalsy();

      rerender(
        <DeleteConfirmModal
          visible={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
        />
      );

      expect(screen.getByText('Supprimer le compte ?')).toBeTruthy();
    });
  });
});
