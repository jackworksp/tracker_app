# Task 07: Vault Encryption Utilities

**Issue**: #3 - Personal Details Storage (Secure Vault)
**ClickUp**: https://app.clickup.com/t/86d1uwmu2
**Priority**: 🔒 High (Security)
**Estimated Time**: 1 day
**Sprint**: Sprint 2 (Week 2)

---

## Objective
Implement AES-256-GCM encryption utilities for securely encrypting and decrypting sensitive vault data.

## Dependencies

- ✅ Task 06 completed (database schema)

## Security Requirements

- ✅ AES-256-GCM (authenticated encryption)
- ✅ PBKDF2 key derivation (100k iterations, SHA-512)
- ✅ Unique salt per note
- ✅ Unique IV per encryption
- ✅ Authentication tag verification
- ✅ No plaintext password storage

## Implementation Steps

### 1. Create Encryption Utility
**File**: `backend/utils/encryption.js` (new file)

```javascript
const crypto = require('crypto');

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;        // 256 bits
const IV_LENGTH = 16;         // 128 bits (GCM standard)
const SALT_LENGTH = 64;       // 512 bits
const TAG_LENGTH = 16;        // 128 bits
const PBKDF2_ITERATIONS = 100000;  // OWASP recommendation
const PBKDF2_DIGEST = 'sha512';

/**
 * Derive encryption key from user password using PBKDF2
 * @param {string} password - User password
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} Derived key
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(
        password,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        PBKDF2_DIGEST
    );
}

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @param {string} userPassword - User password for key derivation
 * @returns {Object} Encrypted data with metadata
 */
function encrypt(plaintext, userPassword) {
    if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Plaintext must be a non-empty string');
    }

    if (!userPassword || userPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from password
    const key = deriveKey(userPassword, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
        ciphertext: encrypted,
        metadata: {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: ALGORITHM,
            iterations: PBKDF2_ITERATIONS
        }
    };
}

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - Encrypted data
 * @param {Object} metadata - Encryption metadata
 * @param {string} userPassword - User password for key derivation
 * @returns {string} Decrypted plaintext
 * @throws {Error} If decryption fails or password is incorrect
 */
function decrypt(ciphertext, metadata, userPassword) {
    if (!ciphertext || !metadata || !userPassword) {
        throw new Error('Missing required decryption parameters');
    }

    try {
        // Parse metadata
        const salt = Buffer.from(metadata.salt, 'hex');
        const iv = Buffer.from(metadata.iv, 'hex');
        const authTag = Buffer.from(metadata.authTag, 'hex');

        // Derive key
        const key = deriveKey(userPassword, salt);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // Authentication tag mismatch or wrong password
        throw new Error('Decryption failed: Invalid password or corrupted data');
    }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
    const result = {
        valid: true,
        errors: []
    };

    if (!password || password.length < 8) {
        result.valid = false;
        result.errors.push('Password must be at least 8 characters');
    }

    if (password && password.length < 12) {
        result.errors.push('Warning: 12+ characters recommended for strong security');
    }

    // Optional: Check for complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const complexityScore = [hasUpperCase, hasLowerCase, hasNumber, hasSymbol].filter(Boolean).length;

    if (complexityScore < 3) {
        result.errors.push('Weak password: Use uppercase, lowercase, numbers, and symbols');
    }

    return result;
}

module.exports = {
    encrypt,
    decrypt,
    deriveKey,
    validatePassword
};
```

### 2. Create Unit Tests
**File**: `backend/utils/encryption.test.js` (new file)

```javascript
const { encrypt, decrypt, validatePassword } = require('./encryption');

describe('Encryption Utilities', () => {
    const testPassword = 'Test@Password123';
    const testPlaintext = 'Sensitive bank account: 1234-5678-9012';

    test('Encrypt and decrypt round-trip', () => {
        const { ciphertext, metadata } = encrypt(testPlaintext, testPassword);
        const decrypted = decrypt(ciphertext, metadata, testPassword);

        expect(decrypted).toBe(testPlaintext);
    });

    test('Different ciphertext on each encryption (unique IV)', () => {
        const result1 = encrypt(testPlaintext, testPassword);
        const result2 = encrypt(testPlaintext, testPassword);

        expect(result1.ciphertext).not.toBe(result2.ciphertext);
        expect(result1.metadata.iv).not.toBe(result2.metadata.iv);
    });

    test('Decryption fails with wrong password', () => {
        const { ciphertext, metadata } = encrypt(testPlaintext, testPassword);

        expect(() => {
            decrypt(ciphertext, metadata, 'WrongPassword123');
        }).toThrow('Decryption failed');
    });

    test('Decryption fails with tampered ciphertext', () => {
        const { ciphertext, metadata } = encrypt(testPlaintext, testPassword);
        const tamperedCiphertext = ciphertext.slice(0, -2) + '00';

        expect(() => {
            decrypt(tamperedCiphertext, metadata, testPassword);
        }).toThrow('Decryption failed');
    });

    test('Password validation rejects short passwords', () => {
        const result = validatePassword('short');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters');
    });

    test('Password validation warns about weak passwords', () => {
        const result = validatePassword('password');
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('Strong password passes validation', () => {
        const result = validatePassword('MyStrong@Pass123');
        expect(result.valid).toBe(true);
    });
});
```

Run tests:
```bash
cd backend
npm test utils/encryption.test.js
```

### 3. Create Manual Test Script
**File**: `backend/test-encryption.js` (new file)

```javascript
const { encrypt, decrypt, validatePassword } = require('./utils/encryption');

console.log('🔐 Testing Encryption Utilities\n');

// Test data
const password = 'MyVaultPassword@2024';
const sensitiveData = JSON.stringify({
    accountType: 'Bank Account',
    bankName: 'Example Bank',
    accountNumber: '1234-5678-9012-3456',
    routingNumber: '987654321',
    notes: 'Primary checking account'
});

console.log('1. Password Validation');
console.log('----------------------');
const validation = validatePassword(password);
console.log('Valid:', validation.valid);
console.log('Warnings:', validation.errors);
console.log('');

console.log('2. Encryption');
console.log('-------------');
console.log('Plaintext length:', sensitiveData.length, 'bytes');
const { ciphertext, metadata } = encrypt(sensitiveData, password);
console.log('Ciphertext length:', ciphertext.length, 'bytes');
console.log('Metadata:', JSON.stringify(metadata, null, 2));
console.log('');

console.log('3. Decryption (Correct Password)');
console.log('--------------------------------');
try {
    const decrypted = decrypt(ciphertext, metadata, password);
    const decryptedObj = JSON.parse(decrypted);
    console.log('✅ Decryption successful');
    console.log('Decrypted data:', decryptedObj);
} catch (error) {
    console.log('❌ Decryption failed:', error.message);
}
console.log('');

console.log('4. Decryption (Wrong Password)');
console.log('-------------------------------');
try {
    const decrypted = decrypt(ciphertext, metadata, 'WrongPassword123');
    console.log('❌ Should have failed!');
} catch (error) {
    console.log('✅ Correctly rejected:', error.message);
}
console.log('');

console.log('5. Uniqueness Test (Same data, different encryption)');
console.log('----------------------------------------------------');
const result1 = encrypt(sensitiveData, password);
const result2 = encrypt(sensitiveData, password);
console.log('Same ciphertext?', result1.ciphertext === result2.ciphertext ? '❌ BAD' : '✅ GOOD');
console.log('Same IV?', result1.metadata.iv === result2.metadata.iv ? '❌ BAD' : '✅ GOOD');
console.log('Same salt?', result1.metadata.salt === result2.metadata.salt ? '❌ BAD' : '✅ GOOD');
```

Run manual test:
```bash
node backend/test-encryption.js
```

## Security Testing Checklist

- [ ] Encryption produces different ciphertext each time (IV randomness)
- [ ] Different salt generated per encryption
- [ ] Authentication tag verification works
- [ ] Wrong password causes decryption to fail
- [ ] Tampered ciphertext causes decryption to fail
- [ ] Tampered metadata causes decryption to fail
- [ ] No plaintext leaks in error messages
- [ ] Password validation enforces minimum length
- [ ] PBKDF2 iterations match OWASP recommendation (100k+)

## Performance Testing

Test encryption/decryption speed:

```javascript
const iterations = 1000;
const data = 'A'.repeat(1000); // 1KB of data
const password = 'TestPassword123';

console.time('1000 encryptions');
for (let i = 0; i < iterations; i++) {
    encrypt(data, password);
}
console.timeEnd('1000 encryptions');

const { ciphertext, metadata } = encrypt(data, password);

console.time('1000 decryptions');
for (let i = 0; i < iterations; i++) {
    decrypt(ciphertext, metadata, password);
}
console.timeEnd('1000 decryptions');
```

Target: < 100ms per operation on average hardware

## Success Criteria

✅ Encryption/decryption round-trip successful
✅ Unique IV and salt per encryption
✅ Authentication tag prevents tampering
✅ Wrong password causes failure
✅ No plaintext password stored
✅ All unit tests pass
✅ Manual test script confirms security
✅ Performance acceptable (< 100ms per op)

## Files Created

**New Files:**
- `backend/utils/encryption.js`
- `backend/utils/encryption.test.js`
- `backend/test-encryption.js`

## Next Task

→ [Task 08: Vault Backend Routes](task-08-vault-backend-routes.md)
