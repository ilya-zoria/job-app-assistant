import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DefaultLayout from './components/layout/DefaultLayout';
import AuthLayout from './components/layout/AuthLayout';
import Waitlist from './pages/Waitlist';
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Success from "./pages/Success";
import { Toaster } from "./components/ui/sonner";
import LandingPageLayout from './components/layout/LandingPageLayout';
import LandingPage from './pages/LandingPage';
import ResumeBuilder from './pages/ResumeBuilder';
import Download from './pages/Download';

function App() {
  return (
    <Router>
      <Routes>
        {/* Waitlist and Success routes use WaitlistLayout (full screen, no header) */}
        <Route element={<LandingPageLayout />}>
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/success" element={<Success />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/download" element={<Download />} />
        </Route>

        {/* Auth routes (login/signup) use AuthLayout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        {/* Dashboard and related routes use DefaultLayout (with header) */}
        <Route element={<DefaultLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/builder" element={<ResumeBuilder />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;