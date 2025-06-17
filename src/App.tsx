import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DefaultLayout from './components/layout/DefaultLayout';
import AuthLayout from './components/layout/AuthLayout';
import Waitlist from './pages/Waitlist';
import JobDetails from "./pages/JobDetails";
import AddJob from "./pages/AddJob";
import Dashboard from "./pages/Dashboard";
import UserInfo from "./pages/UserInfo";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Success from "./pages/Success";
import { Toaster } from "./components/ui/sonner";
import WaitlistLayout from './components/layout/WaitlistLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Waitlist and Success routes use WaitlistLayout (full screen, no header) */}
        <Route element={<WaitlistLayout />}>
          <Route path="/" element={<Waitlist />} />
          <Route path="/success" element={<Success />} />
        </Route>

        {/* Auth routes (login/signup) use AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Dashboard and related routes use DefaultLayout (with header) */}
        <Route element={<DefaultLayout />}>
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