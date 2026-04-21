import { View, Text, Pressable, Modal } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { styles } from '../profile.styles';

export function DeleteConfirmModal({ visible, onClose, onConfirm }) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.deleteModal}>
          <View style={styles.deleteContent}>
            <View style={styles.deleteIcon}>
              <Trash2 size={32} color="#B01E28" />
            </View>
            <Text style={styles.deleteTitle}>Supprimer le compte ?</Text>
            <Text style={styles.deleteText}>
              Cette action est irréversible. Toutes vos données, captures et progrès seront définitivement supprimés.
            </Text>
            <View style={styles.deleteButtons}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable onPress={onConfirm} style={styles.confirmButton}>
                <Text style={styles.confirmText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
