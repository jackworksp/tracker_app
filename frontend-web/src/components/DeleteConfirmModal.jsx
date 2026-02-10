import React from 'react';
import { Modal, Button, H3, Paragraph } from '../design-system';
import { AlertTriangle } from 'lucide-react';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({
  visible,
  title = 'Delete Item?',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  onConfirm,
  onCancel,
  itemName = ''
}) => {
  return (
    <Modal
      isOpen={visible}
      onClose={onCancel}
      title={null}
      size="sm"
    >
      <div className="delete-confirm-content">
        <div className="delete-icon">
          <AlertTriangle size={48} color="var(--nds-state-error, #eb5757)" />
        </div>
        <H3>{title}</H3>
        <Paragraph className="delete-message">{message}</Paragraph>
        {itemName && (
          <div className="delete-item-name">
            <Paragraph>"{itemName}"</Paragraph>
          </div>
        )}
        <div className="delete-actions">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
