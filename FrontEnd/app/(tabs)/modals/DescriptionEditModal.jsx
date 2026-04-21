import { View, Text, TextInput, Pressable, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { styles } from '../profile.styles';

export function DescriptionEditModal({
  visible,
  onClose,
  description,
  onDescriptionChange,
  onSave,
  isSaving,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.descriptionModal}>
          {/* Modal Header */}
          <View style={styles.descriptionModalHeader}>
            <Text style={styles.descriptionModalTitle}>Modifier la description</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#97572B" />
            </Pressable>
          </View>

          {/* Modal Content */}
          <View style={styles.descriptionModalContent}>
            <Text style={styles.descriptionLabel}>Votre description</Text>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={onDescriptionChange}
              placeholder="Écris ta description ici..."
              placeholderTextColor="#8B5E3C"
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{description.length}/150</Text>

            <Pressable
              style={styles.saveButton}
              onPress={onSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
