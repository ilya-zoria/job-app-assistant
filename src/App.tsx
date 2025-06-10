import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import WaitlistLayout from './components/layout/WaitlistLayout';
import Waitlist from './pages/Waitlist';
import JobDetails from "./pages/JobDetails";
import AddJob from "./pages/AddJob";
import Dashboard from "./pages/Dashboard";
import UserInfo from "./pages/UserInfo";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TestEmail from "./pages/TestEmail";
import Success from "./pages/Success";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route element={<WaitlistLayout />}>
          <Route path="/" element={<Waitlist />} />
          <Route path="/test-email" element={<TestEmail />} />
          <Route path="/success" element={<Success />} />
        </Route>
        
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Protected routes with layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user-info" element={<UserInfo />} />
          <Route path="/add-job" element={<AddJob />} />
          <Route path="/job/:id" element={<JobDetails />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;