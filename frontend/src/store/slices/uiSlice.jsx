import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeRequestIds: [],
  isLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showLoader: (state, action) => {
      const id = action.payload || 'default';
      if (!state.activeRequestIds.includes(id)) {
        state.activeRequestIds.push(id);
      }
      state.isLoading = state.activeRequestIds.length > 0;
    },
    hideLoader: (state, action) => {
      const id = action.payload || 'default';
      state.activeRequestIds = state.activeRequestIds.filter(reqId => reqId !== id);
      state.isLoading = state.activeRequestIds.length > 0;
    },
    hideLoaderLegacy: (state) => {
      // Find the first legacy/default ID and remove it
      const legacyId = state.activeRequestIds.find(id => id.startsWith('legacy-') || id === 'default');
      if (legacyId) {
        state.activeRequestIds = state.activeRequestIds.filter(reqId => reqId !== legacyId);
        state.isLoading = state.activeRequestIds.length > 0;
      }
    }
  },
});

export const { showLoader, hideLoader, hideLoaderLegacy } = uiSlice.actions;
export default uiSlice.reducer;
