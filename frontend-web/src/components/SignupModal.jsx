import React from 'react';
import { Modal } from 'antd';
import SignupForm from './SignupForm';

export default function SignupModal({ visible, onClose, onSignup, onSwitchToLogin }) {
  
  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="Create Account"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={450}
      centered
    >
      <SignupForm
        onSignup={onSignup}
        onSwitchToLogin={() => {
            handleCancel();
            onSwitchToLogin();
        }}
      />
    </Modal>
  );
}
