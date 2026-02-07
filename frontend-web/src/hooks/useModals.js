import { useReducer, useCallback } from 'react';

const initialState = {
  activeModal: null, // 'createSubject' | 'addSession' | 'editSession' | 'addRevision' | 'login' | 'signup' | 'addTask' | 'shareConfirm'
  editingSession: null,
  sessionInitialData: null,
  prefilledTaskType: 'TASK',
  initialTaskShareData: null,
  pendingShareData: null,
};

function modalReducer(state, action) {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        activeModal: action.modal,
        ...(action.data || {}),
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        activeModal: null,
        // Clear associated data based on which modal is closing
        ...(state.activeModal === 'editSession' ? { editingSession: null } : {}),
        ...(state.activeModal === 'addSession' ? { sessionInitialData: null } : {}),
        ...(state.activeModal === 'addTask' ? { initialTaskShareData: null } : {}),
        ...(state.activeModal === 'shareConfirm' ? { pendingShareData: null } : {}),
      };
    case 'SET_SHARE_DATA':
      return {
        ...state,
        pendingShareData: action.data,
        activeModal: 'shareConfirm',
      };
    case 'CLEAR_SHARE_DATA':
      return {
        ...state,
        pendingShareData: null,
      };
    default:
      return state;
  }
}

export default function useModals() {
  const [modalState, dispatch] = useReducer(modalReducer, initialState);

  const openModal = useCallback((modal, data) => {
    dispatch({ type: 'OPEN_MODAL', modal, data });
  }, []);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  const setShareData = useCallback((data) => {
    dispatch({ type: 'SET_SHARE_DATA', data });
  }, []);

  const clearShareData = useCallback(() => {
    dispatch({ type: 'CLEAR_SHARE_DATA' });
  }, []);

  // Convenience booleans for each modal
  const isOpen = (modal) => modalState.activeModal === modal;

  return {
    modalState,
    openModal,
    closeModal,
    setShareData,
    clearShareData,
    isOpen,
  };
}
