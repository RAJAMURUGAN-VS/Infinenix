
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import CharacterShowcase from "./pages/CharacterShowcase";
import DomainSelector from "./pages/DomainSelector";
import { AuthPage } from "./pages/AuthPage";
import SettingsPage from "./components/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                {/* Auth disabled: redirect root directly to Chat */}
                <Route path="/" element={<Navigate to="/DomainSelector" replace />} />
                <Route path="/login" element={<AuthPage />} />

                {/* Protected Routes */}
                <Route
                  path="/DomainSelector"
                  element={
                    <ProtectedRoute>
                      <DomainSelector />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/Chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/CharacterShowcase"
                  element={
                    <ProtectedRoute>
                      <CharacterShowcase />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
