import React, { useState } from 'react';
import { useSecurity } from '../contexts/SecurityContext';
import { Lock, Fingerprint, Shield, ChevronRight } from 'lucide-react';
import { message, Switch, Input, Button, Modal } from 'antd';

const SecuritySettings = () => {
    const { 
        securityEnabled, 
        enableSecurity, 
        biometricsEnabled, 
        enableBiometrics,
        hasPin,
        setPin,
        verifyPin
    } = useSecurity();

    const [isSetPinModalOpen, setIsSetPinModalOpen] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [confirmPinInput, setConfirmPinInput] = useState('');
    const [currentPinInput, setCurrentPinInput] = useState('');
    const [step, setStep] = useState('initial'); // initial, create, confirm

    const handleToggleSecurity = async (checked) => {
        if (checked && !hasPin) {
            // Must set PIN first
            setStep('initial');
            setIsSetPinModalOpen(true);
            return;
        }
        await enableSecurity(checked);
        message.success(checked ? 'App lock enabled' : 'App lock disabled');
    };

    const handleToggleBiometrics = async (checked) => {
        const success = await enableBiometrics(checked);
        if (success) {
            message.success(checked ? 'Biometrics enabled' : 'Biometrics disabled');
        } else {
            message.error('Biometrics not available on this device');
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
                message.error('Incorrect current PIN');
                return;
            }
            setStep('initial'); 
            return;
        }

        // Step 2: Create new PIN
        if (step === 'initial') {
            if (pinInput.length !== 4) {
                message.error('PIN must be 4 digits');
                return;
            }
            setStep('confirm');
            return;
        }

        // Step 3: Confirm new PIN
        if (step === 'confirm') {
            if (pinInput !== confirmPinInput) {
                message.error('PINs do not match');
                return;
            }
            await setPin(pinInput);
            await enableSecurity(true);
            message.success('PIN set successfully');
            setIsSetPinModalOpen(false);
            setPinInput('');
            setConfirmPinInput('');
            setStep('initial');
        }
    };

    return (
        <div className="bg-[#1e1e1e] rounded-xl p-4 border border-white/5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Shield size={20} />
                </div>
                <h3 className="text-lg font-medium text-white">App Security</h3>
            </div>

            <div className="space-y-4">
                {/* Enable App Lock */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Lock size={18} className="text-gray-400" />
                        <div>
                            <div className="text-white font-medium">App Lock</div>
                            <div className="text-xs text-gray-400">Require PIN on startup</div>
                        </div>
                    </div>
                    <Switch 
                        checked={securityEnabled} 
                        onChange={handleToggleSecurity} 
                    />
                </div>

                {/* Biometrics */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Fingerprint size={18} className="text-gray-400" />
                        <div>
                            <div className="text-white font-medium">Biometrics</div>
                            <div className="text-xs text-gray-400">Unlock with Fingerprint/FaceID</div>
                        </div>
                    </div>
                    <Switch 
                        checked={biometricsEnabled} 
                        onChange={handleToggleBiometrics}
                        disabled={!securityEnabled}
                    />
                </div>

                {/* Change PIN */}
                {hasPin && (
                    <button 
                        onClick={handleChangePin}
                        className="w-full flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                            <div className="text-white font-medium">Change PIN</div>
                        </div>
                        <ChevronRight size={16} className="text-gray-500" />
                    </button>
                )}
            </div>

            <Modal
                title={step === 'verify_old' ? "Enter Current PIN" : step === 'confirm' ? "Confirm PIN" : "Set New PIN"}
                open={isSetPinModalOpen}
                onOk={handlePinSubmit}
                onCancel={() => setIsSetPinModalOpen(false)}
                okText={step === 'verify_old' ? "Next" : step === 'confirm' ? "Save" : "Next"}
                closable={true}
                centered
            >
                <div className="py-4 space-y-4">
                    {step === 'verify_old' && (
                        <div>
                            <p className="mb-2 text-gray-400">Please enter your current PIN to continue.</p>
                            <Input.Password 
                                maxLength={4}
                                value={currentPinInput}
                                onChange={e => setCurrentPinInput(e.target.value)}
                                placeholder="Current PIN"
                                size="large"
                                className="text-center text-xl tracking-widest"
                                autoFocus
                            />
                        </div>
                    )}

                    {(step === 'initial' || step === 'confirm') && (
                        <div>
                            <p className="mb-2 text-gray-400">
                                {step === 'confirm' ? "Re-enter your PIN to confirm." : "Enter a 4-digit PIN to secure your app."}
                            </p>
                            <Input.Password 
                                maxLength={4}
                                value={step === 'confirm' ? confirmPinInput : pinInput}
                                onChange={e => step === 'confirm' ? setConfirmPinInput(e.target.value) : setPinInput(e.target.value)}
                                placeholder="Enter 4-digit PIN"
                                size="large"
                                className="text-center text-xl tracking-widest"
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default SecuritySettings;
