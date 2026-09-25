import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, setTheme } from '../store/slices/themeSlice';

export const useAppTheme = () => {
  const dispatch = useDispatch();
  const isDark = useSelector((state) => state.theme.isDark);

  return {
    isDark,
    toggleTheme: () => dispatch(toggleTheme()),
    setTheme: (dark) => dispatch(setTheme(dark)),
  };
};
