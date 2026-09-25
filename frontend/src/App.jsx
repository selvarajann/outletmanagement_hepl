import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import GlobalLoader from "./components/common/GlobalLoader";
import { useFcmNotifications } from "./hooks/useFcmNotifications";

function App() {
  useFcmNotifications();

  return (
    <BrowserRouter>
      <GlobalLoader />
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </BrowserRouter>
  );
}

export default App;
