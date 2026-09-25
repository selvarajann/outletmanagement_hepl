import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const saved = localStorage.getItem('appTheme');
  return saved === 'dark';
};

const initialState = {
  isDark: getInitialTheme(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeState: (state, action) => {
      state.isDark = action.payload;
    }
  },
});

export const { setThemeState } = themeSlice.actions;

export const toggleTheme = () => (dispatch, getState) => {
  const isDark = !getState().theme.isDark;
  localStorage.setItem('appTheme', isDark ? 'dark' : 'light');
  dispatch(setThemeState(isDark));
};

export const setTheme = (isDark) => (dispatch) => {
  localStorage.setItem('appTheme', isDark ? 'dark' : 'light');
  dispatch(setThemeState(isDark));
};

export default themeSlice.reducer;
