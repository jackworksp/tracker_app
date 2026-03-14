import React, { useState } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { Lock, Fingerprint, Shield, ChevronRight } from 'lucide-react';
import './SecuritySettings.css';

/* ─── Inline toggle component ──────────────────────────────────────────── */
const SecToggle = ({ checked, onChange, disabled }) => (
  <button
    className={`sec-toggle${checked ? ' sec-toggle--on' : ''}`}
    onClick={() => onChange(!checked)}
    disabled={disabled}
    role="switch"
    aria-checked={checked}
    type="button"
  >
    <span className="sec-toggle-thumb" />
  </button>
);

/* ─── PIN modal ─────────────────────────────────────────────────────────── */
const PinModal = ({ open, step, pinInput, confirmPinInput, currentPinInput, onChangePinInput, onChangeConfirmPinInput, onChangeCurrentPinInput, onSubmit, onClose }) => {
  if (!open) return null;

  const title =
    step === 'verify_old' ? 'Enter Current PIN' :
    step === 'confirm'    ? 'Confirm PIN'        :
                            'Set New PIN';

  const okLabel =
    step === 'confirm' ? 'Save' : 'Next';

  const hint =
    step === 'verify_old' ? 'Please enter your current PIN to continue.'   :
    step === 'confirm'    ? 'Re-enter your PIN to confirm.'                 :
                            'Enter a 4-digit PIN to secure your app.';

  const inputValue =
    step === 'verify_old' ? currentPinInput :
    step === 'confirm'    ? confirmPinInput  :
                            pinInput;

  const handleChange = (e) => {
    if (step === 'verify_old') onChangeCurrentPinInput(e.target.value);
    else if (step === 'confirm') onChangeConfirmPinInput(e.target.value);
    else onChangePinInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="sec-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sec-modal" role="dialog" aria-modal="true" aria-labelledby="sec-modal-title">
        <h2 id="sec-modal-title" className="sec-modal-title">{title}</h2>

        <div className="sec-modal-body">
          <p className="sec-modal-hint">{hint}</p>
          <input
            className="sec-pin-input"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="••••"
            autoFocus
          />
        </div>

        <div className="sec-modal-footer">
          <button className="sec-btn-cancel" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="sec-btn-ok" type="button" onClick={onSubmit}>
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main component ────────────────────────────────────────────────────── */
const SecuritySettings = () => {
  const {
    securityEnabled,
    enableSecurity,
    biometricsEnabled,
    enableBiometrics,
    hasPin,
    setPin,
    verifyPin,
  } = useSecurity();

  const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [step, setStep] = useState('initial'); // initial | create | confirm | verify_old

  const handleToggleSecurity = async (checked) => {
    if (checked && !hasPin) {
      setStep('initial');
      setIsSetPinModalOpen(true);
      return;
    }
    await enableSecurity(checked);
    alert(checked ? 'App lock enabled' : 'App lock disabled');
  };

  const handleToggleBiometrics = async (checked) => {
    const success = await enableBiometrics(checked);
    if (success) {
      alert(checked ? 'Biometrics enabled' : 'Biometrics disabled');
    } else {
      alert('Biometrics not available on this device');
    }
  };

  const handleChangePin = () => {
    setStep('verify_old');
    setPinInput('');
    setConfirmPinInput('');
    setCurrentPinInput('');
    setIsSetPinModalOpen(true);
  };

  const handlePinSubmit = async () => {
    // Step 1: Verify old PIN (if changing)
    if (step === 'verify_old') {
      const isValid = await verifyPin(currentPinInput);
      if (!isValid) {
        alert('Incorrect current PIN');
        return;
      }
      setStep('initial');
      return;
    }

    // Step 2: Create new PIN
    if (step === 'initial') {
      if (pinInput.length !== 4) {
        alert('PIN must be 4 digits');
        return;
      }
      setStep('confirm');
      return;
    }

    // Step 3: Confirm new PIN
    if (step === 'confirm') {
      if (pinInput !== confirmPinInput) {
        alert('PINs do not match');
        return;
      }
      await setPin(pinInput);
      await enableSecurity(true);
      alert('PIN set successfully');
      setIsSetPinModalOpen(false);
      setPinInput('');
      setConfirmPinInput('');
      setStep('initial');
    }
  };

  const handleCloseModal = () => {
    setIsSetPinModalOpen(false);
  };

  return (
    <div className="sec-container">
      {/* Header */}
      <div className="sec-header">
        <div className="sec-icon-wrapper" aria-hidden="true">
          <Shield size={20} />
        </div>
        <h3 className="sec-title">App Security</h3>
      </div>

      <div className="sec-rows">
        {/* App Lock toggle */}
        <div className="sec-row">
          <div className="sec-row-left">
            <span className="sec-row-icon" aria-hidden="true">
              <Lock size={18} />
            </span>
            <div>
              <div className="sec-label">App Lock</div>
              <div className="sec-sublabel">Require PIN on startup</div>
            </div>
          </div>
          <SecToggle
            checked={securityEnabled}
            onChange={handleToggleSecurity}
          />
        </div>

        {/* Biometrics toggle */}
        <div className="sec-row">
          <div className="sec-row-left">
            <span className="sec-row-icon" aria-hidden="true">
              <Fingerprint size={18} />
            </span>
            <div>
              <div className="sec-label">Biometrics</div>
              <div className="sec-sublabel">Unlock with Fingerprint / Face ID</div>
            </div>
          </div>
          <SecToggle
            checked={biometricsEnabled}
            onChange={handleToggleBiometrics}
            disabled={!securityEnabled}
          />
        </div>

        {/* Change PIN button (only shown when a PIN exists) */}
        {hasPin && (
          <button
            className="sec-row-btn"
            type="button"
            onClick={handleChangePin}
          >
            <div className="sec-row-left">
              <span className="sec-change-pin-dot" aria-hidden="true" />
              <div className="sec-label">Change PIN</div>
            </div>
            <span className="sec-chevron" aria-hidden="true">
              <ChevronRight size={16} />
            </span>
          </button>
        )}
      </div>

      {/* PIN modal */}
      <PinModal
        open={isSetPinModalOpen}
        step={step}
        pinInput={pinInput}
        confirmPinInput={confirmPinInput}
        currentPinInput={currentPinInput}
        onChangePinInput={setPinInput}
        onChangeConfirmPinInput={setConfirmPinInput}
        onChangeCurrentPinInput={setCurrentPinInput}
        onSubmit={handlePinSubmit}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default SecuritySettings;
