import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Context Providers
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";

// Page Imports
import HomePage from "./pages/Home";
import ClubsPage from "./pages/Clubspage";
import ClubDetails from "./pages/ClubDetails";
import ClubMembers from "./pages/ClubMembers";
import EventFeed from "./pages/EventFeed";
import EventDetails from "./pages/EventDetails";
import CreateEvent from "./pages/CreateEvent";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import RegisterLanding from "./pages/RegisterLanding";
import RegisterStudent from "./pages/RegisterStudent";
import Profile from "./pages/Profile";
import Aboutfeatures from "./pages/Aboutfeatures";
import EventGuid from "./pages/EventGuid";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import FAQ from "./pages/FAQ";
import Contribute from "./pages/Contribute";
import Team from "./pages/Team";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ColorExtractorDemo from "./pages/ColorExtractorDemo";
import Maintainance from "./pages/Maintainance";

function App() {
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  if (isMaintenance) {
    return <Maintainance />;
  }

  return (
    <NotificationProvider>
      <SocketProvider>
        <ThemeProvider>
          <Router>
            <Navbar />

            <Routes>
              {/* Core / Home */}
              <Route path="/" element={<HomePage />} />

              {/* Clubs */}
              <Route path="/clubs" element={<ClubsPage />} />
              <Route path="/club/:slug" element={<ClubDetails />} />
              <Route path="/club/:id" element={<ClubDetails />} />
              <Route path="/club/:clubId/team" element={<ClubMembers />} />
              <Route path="/club/:clubId/members" element={<ClubMembers />} />
              <Route path="/club/edit/:slug" element={<ClubDetails />} />
              <Route path="/club/edit/:id" element={<ClubDetails />} />

              {/* Events */}
              <Route path="/events" element={<EventFeed />} />
              <Route path="/event/:slug" element={<EventDetails />} />
              <Route path="/create" element={<CreateEvent />} />
              <Route path="/create-event" element={<CreateEvent />} />
             
            
              <Route path="/event-guidelines" element={<EventGuid />} />
              <Route path="/guidelines" element={<EventGuid />} />

              {/* Auth & User */}
              <Route path="/login" element={<Login />} />
              <Route path="/Login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<RegisterLanding />} />
              <Route path="/register/student" element={<RegisterStudent />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-events" element={<Profile />} />

              {/* Admin */}
              <Route path="/admin-secret-login" element={<AdminLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Information & Legal */}
              <Route path="/about" element={<Aboutfeatures />} />
              <Route path="/features" element={<Aboutfeatures />} />
              <Route path="/about-features" element={<Aboutfeatures />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contribute" element={<Contribute />} />
              <Route path="/team" element={<Team />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
              <Route path="/terms" element={<TermsAndConditions />} />

              {/* Component Demos */}
              <Route path="/color-extractor-demo" element={<ColorExtractorDemo />} />
              <Route path="/demo" element={<ColorExtractorDemo />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>

            <Footer />
          </Router>
        </ThemeProvider>
      </SocketProvider>
    </NotificationProvider>
  );
}

export default App;