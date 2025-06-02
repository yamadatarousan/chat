import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { ChatWindow } from './components/Chat/ChatWindow';
import { RootState } from './store';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/chat" /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/chat" /> : <Register />}
          />
          <Route
            path="/chat"
            element={isAuthenticated ? <ChatWindow /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/chat" />} />
        </Routes>
      </div>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  );
};

export default App;
