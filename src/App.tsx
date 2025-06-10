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

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes using DefaultLayout */}
        <Route element={<DefaultLayout />}>
          <Route path="/" element={<Waitlist />} />
          <Route path="/success" element={<Success />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/user-info" element={<UserInfo />} />
          <Route path="/add-job" element={<AddJob />} />
          <Route path="/job/:id" element={<JobDetails />} />
        </Route>
        
        {/* Auth routes (if they don't need the common header) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;