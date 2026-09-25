import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logoutUser, startImpersonation, stopImpersonation } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  return {
    ...authState,
    isImpersonating: !!authState.impersonation,
    login: (token, role) => dispatch(loginSuccess({ token, role })),
    logout: () => dispatch(logoutUser()),
    startImpersonation: (targetUserId) => dispatch(startImpersonation(targetUserId)),
    stopImpersonation: () => dispatch(stopImpersonation()),
  };
};
