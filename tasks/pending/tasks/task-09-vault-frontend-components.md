# Task 09: Vault Frontend Components

**Issue**: #3 - Personal Details Storage (Secure Vault)
**ClickUp**: https://app.clickup.com/t/86d1uwmu2
**Priority**: 🔒 High (Security)
**Estimated Time**: 2 days
**Sprint**: Sprint 2 (Week 2)

---

## Objective
Create frontend UI components for the secure vault, including unlock modal, vault page, and secure note card.

## Dependencies

- ✅ Task 06, 07, 08 completed (backend fully functional)

## Components to Create

### 1. VaultUnlockModal - Password entry
### 2. VaultPage - Main vault interface
### 3. SecureNoteCard - Individual vault item display
### 4. AddVaultItemModal - Create new encrypted notes

## Implementation Steps

### 1. Create Vault Unlock Modal
**File**: `frontend-web/src/components/VaultUnlockModal.jsx`

```jsx
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button, Input } from '../design-system';
import './VaultUnlockModal.css';

const VaultUnlockModal = ({ onUnlock, onClose }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlock = async (e) => {
        e.preventDefault();

        if (!password) {
            setError('Password required');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Password will be validated when accessing notes
            onUnlock(password);
        } catch (err) {
            setError('Invalid password');
            setIsLoading(false);
        }
    };

    return (
        <div className="vault-unlock-overlay">
            <div className="vault-unlock-modal">
                <div className="vault-lock-icon">
                    <Lock size={48} />
                </div>

                <h2>Secure Vault</h2>
                <p className="vault-subtitle">
                    Enter your master password to access encrypted items
                </p>

                <form onSubmit={handleUnlock}>
                    <div className="password-input-wrapper">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter vault password"
                            autoFocus
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {error && (
                        <div className="vault-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="vault-unlock-actions">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Unlocking...' : 'Unlock Vault'}
                        </Button>
                    </div>
                </form>

                <div className="vault-security-note">
                    🔒 Your password never leaves your device and cannot be recovered
                </div>
            </div>
        </div>
    );
};

export default VaultUnlockModal;
```

**File**: `frontend-web/src/components/VaultUnlockModal.css`

```css
.vault-unlock-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.vault-unlock-modal {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
    padding: 40px;
    border-radius: 20px;
    max-width: 450px;
    width: 90%;
    border: 1px solid rgba(251, 191, 36, 0.3);
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
    text-align: center;
}

.vault-lock-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: rgba(251, 191, 36, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fbbf24;
}

.vault-unlock-modal h2 {
    color: white;
    margin-bottom: 8px;
    font-size: 1.75rem;
}

.vault-subtitle {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 30px;
    font-size: 0.95rem;
}

.password-input-wrapper {
    position: relative;
    margin-bottom: 16px;
}

.toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    padding: 8px;
}

.toggle-password:hover {
    color: rgba(255, 255, 255, 0.8);
}

.vault-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.9rem;
    margin-bottom: 20px;
}

.vault-unlock-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}

.vault-security-note {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}
```

### 2. Create Vault Page
**File**: `frontend-web/src/components/VaultPage.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Lock, Plus, Shield, Search } from 'lucide-react';
import { Button, Input } from '../design-system';
import VaultUnlockModal from './VaultUnlockModal';
import SecureNoteCard from './SecureNoteCard';
import AddVaultItemModal from './AddVaultItemModal';
import api from '../api';
import './VaultPage.css';

const CATEGORIES = {
    ALL: { label: 'All', emoji: '🔐' },
    BANKING: { label: 'Banking', emoji: '🏦' },
    DOCUMENTS: { label: 'Documents', emoji: '📄' },
    CREDENTIALS: { label: 'Credentials', emoji: '🔑' },
    MEDICAL: { label: 'Medical', emoji: '⚕️' },
    LEGAL: { label: 'Legal', emoji: '⚖️' },
    PERSONAL: { label: 'Personal', emoji: '👤' }
};

const VaultPage = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [vaultPassword, setVaultPassword] = useState('');
    const [vaultItems, setVaultItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [lockTimer, setLockTimer] = useState(null);

    // Auto-lock after 5 minutes
    useEffect(() => {
        if (isUnlocked) {
            const timeout = setTimeout(() => {
                handleLock();
            }, 5 * 60 * 1000); // 5 minutes

            setLockTimer(timeout);

            return () => clearTimeout(timeout);
        }
    }, [isUnlocked]);

    // Load vault data
    useEffect(() => {
        if (isUnlocked) {
            loadVaultItems();
            loadStats();
        }
    }, [isUnlocked]);

    // Filter items
    useEffect(() => {
        let filtered = vaultItems;

        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        if (searchQuery) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredItems(filtered);
    }, [vaultItems, selectedCategory, searchQuery]);

    const loadVaultItems = async () => {
        try {
            const items = await api.vault.getAll();
            setVaultItems(items);
        } catch (error) {
            console.error('Failed to load vault:', error);
        }
    };

    const loadStats = async () => {
        try {
            const data = await api.vault.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleUnlock = (password) => {
        setVaultPassword(password);
        setIsUnlocked(true);
    };

    const handleLock = () => {
        setIsUnlocked(false);
        setVaultPassword('');
        setVaultItems([]);
        if (lockTimer) clearTimeout(lockTimer);
    };

    if (!isUnlocked) {
        return <VaultUnlockModal onUnlock={handleUnlock} onClose={() => window.history.back()} />;
    }

    return (
        <div className="vault-page">
            <div className="vault-header">
                <div className="vault-title">
                    <Shield size={28} />
                    <h1>Secure Vault</h1>
                    <span className="vault-status">🔓 Unlocked</span>
                </div>

                <div className="vault-actions">
                    <Button variant="outline" onClick={handleLock}>
                        <Lock size={16} /> Lock Vault
                    </Button>
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add Item
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="vault-search">
                <Search size={20} />
                <Input
                    type="text"
                    placeholder="Search vault items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Filter */}
            <div className="vault-categories">
                {Object.entries(CATEGORIES).map(([key, { label, emoji }]) => (
                    <button
                        key={key}
                        className={`category-pill ${selectedCategory === key ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(key)}
                    >
                        {emoji} {label}
                        {stats && key !== 'ALL' && ` (${stats[key.toLowerCase()] || 0})`}
                    </button>
                ))}
            </div>

            {/* Vault Items Grid */}
            <div className="vault-grid">
                {filteredItems.map(item => (
                    <SecureNoteCard
                        key={item.id}
                        item={item}
                        vaultPassword={vaultPassword}
                        onUpdate={loadVaultItems}
                    />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="vault-empty">
                    <Lock size={48} />
                    <p>No items found</p>
                    <Button variant="primary" onClick={() => setShowAddModal(true)}>
                        Add Your First Secure Item
                    </Button>
                </div>
            )}

            {showAddModal && (
                <AddVaultItemModal
                    vaultPassword={vaultPassword}
                    onClose={() => setShowAddModal(false)}
                    onSuccess={loadVaultItems}
                />
            )}
        </div>
    );
};

export default VaultPage;
```

### 3. Create Secure Note Card
**File**: `frontend-web/src/components/SecureNoteCard.jsx`

```jsx
import React, { useState } from 'react';
import { Eye, Pin, Copy, Trash2, Calendar } from 'lucide-react';
import api from '../api';
import './SecureNoteCard.css';

const CATEGORY_COLORS = {
    BANKING: '#10b981',
    DOCUMENTS: '#3b82f6',
    CREDENTIALS: '#f59e0b',
    MEDICAL: '#ef4444',
    LEGAL: '#8b5cf6',
    PERSONAL: '#6366f1'
};

const SecureNoteCard = ({ item, vaultPassword, onUpdate }) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleReveal = async () => {
        if (isRevealed) {
            setIsRevealed(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.vault.getItem(item.id, vaultPassword);
            setDecryptedContent(data.content);
            setIsRevealed(true);
        } catch (error) {
            alert('Failed to decrypt: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (decryptedContent) {
            navigator.clipboard.writeText(decryptedContent);
            // Show toast notification
        }
    };

    return (
        <div className="secure-note-card" style={{
            borderLeft: `4px solid ${CATEGORY_COLORS[item.category] || '#6366f1'}`
        }}>
            <div className="secure-note-header">
                <h3>{item.title}</h3>
                {item.is_pinned && <Pin size={16} className="pinned-icon" />}
            </div>

            <div className="secure-note-meta">
                <span className="category-badge" style={{
                    background: `${CATEGORY_COLORS[item.category]}20`,
                    color: CATEGORY_COLORS[item.category]
                }}>
                    {item.category}
                </span>

                <span className="date-info">
                    <Calendar size={14} />
                    {new Date(item.updated_at).toLocaleDateString()}
                </span>
            </div>

            {isRevealed && (
                <div className="secure-note-content">
                    <pre>{decryptedContent}</pre>
                </div>
            )}

            <div className="secure-note-actions">
                <button onClick={handleReveal} disabled={isLoading}>
                    <Eye size={16} />
                    {isRevealed ? 'Hide' : 'Reveal'}
                </button>

                {isRevealed && (
                    <button onClick={handleCopy}>
                        <Copy size={16} />
                        Copy
                    </button>
                )}
            </div>

            {item.tags?.length > 0 && (
                <div className="secure-note-tags">
                    {item.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SecureNoteCard;
```

## Testing Checklist

- [ ] Vault unlock modal appears on first access
- [ ] Password validation works (min 8 chars)
- [ ] Unlock with valid password succeeds
- [ ] Vault items load after unlock
- [ ] Category filtering works
- [ ] Search filters items correctly
- [ ] Reveal item decrypts content
- [ ] Copy to clipboard works
- [ ] Auto-lock triggers after 5 minutes
- [ ] Manual lock button works
- [ ] Re-unlock required after lock
- [ ] Add item modal creates encrypted notes
- [ ] Mobile responsive design

## Success Criteria

✅ Vault unlock flow functional
✅ Items display in grid layout
✅ Category filtering and search work
✅ Decrypt on reveal (not on load)
✅ Auto-lock security feature works
✅ Mobile-friendly UI
✅ Matches design system styling

## Files Created

- `frontend-web/src/components/VaultUnlockModal.jsx`
- `frontend-web/src/components/VaultUnlockModal.css`
- `frontend-web/src/components/VaultPage.jsx`
- `frontend-web/src/components/VaultPage.css`
- `frontend-web/src/components/SecureNoteCard.jsx`
- `frontend-web/src/components/SecureNoteCard.css`
- `frontend-web/src/components/AddVaultItemModal.jsx` (simplified version needed)

## Next Tasks

→ [Task 10: Skills Database Schema](task-10-skills-database-schema.md) (Sprint 3)
