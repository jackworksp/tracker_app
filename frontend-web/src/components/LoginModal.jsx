import React from 'react';
import { Modal } from 'antd';
import LoginForm from './LoginForm';

export default function LoginModal({ visible, onClose, onLogin, onSwitchToSignup }) {
  
  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="Welcome Back"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={450}
      centered
    >
      <LoginForm 
        onLogin={async (values) => {
            await onLogin(values);
            // Modal handling of success/closure should be done by parent or here if needed, 
            // but the form handles the submit logic. 
            // Actually, based on previous logic, onLogin in App.js closes the modal.
            // But LoginForm doesn't close the modal. 
            // The previous logic had: form.resetFields() and message.success('Login successful!') inside handleSubmit.
            // LoginForm has that now.
        }}
        onSwitchToSignup={() => {
            handleCancel();
            onSwitchToSignup();
        }}
      />
    </Modal>
  );
}
