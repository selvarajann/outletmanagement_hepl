import { useSelector, useDispatch } from 'react-redux';
import { showLoader, hideLoader, hideLoaderLegacy } from '../store/slices/uiSlice';

export const useGlobalLoader = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.ui.isLoading);

  return {
    isLoading,
    showLoader: (id) => dispatch(showLoader(id)),
    hideLoader: (id) => dispatch(hideLoader(id)),
    hideLoaderLegacy: () => dispatch(hideLoaderLegacy()),
  };
};
