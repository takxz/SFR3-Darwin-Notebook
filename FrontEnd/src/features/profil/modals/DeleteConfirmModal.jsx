import { View, Text, Pressable, Modal } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { styles } from './profilStyles';
import fr from '@/assets/locales/fr.json';

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
            <Text style={styles.deleteTitle}>{fr.deleteConfirmModal.title}</Text>
            <Text style={styles.deleteText}>{fr.deleteConfirmModal.message}</Text>
            <View style={styles.deleteButtons}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>{fr.deleteConfirmModal.cancel}</Text>
              </Pressable>
              <Pressable onPress={onConfirm} style={styles.confirmButton}>
                <Text style={styles.confirmText}>{fr.deleteConfirmModal.confirm}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
