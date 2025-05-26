
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SolanaProvider } from "./providers/SolanaProvider";
import { AuthProvider } from "./providers/AuthProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import DashboardPage from "./pages/DashboardPage";
import CreateEventPage from "./pages/CreateEventPage";
import AuthPage from "./pages/AuthPage";

// Create a stable query client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SolanaProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<CreateEventPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </SolanaProvider>
  </QueryClientProvider>
);

export default App;
