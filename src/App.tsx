
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import { SolanaProvider } from "@/providers/SolanaProvider";
import { EthereumProvider } from "@/providers/EthereumProvider";
import { CDPWalletProvider } from "@/providers/CDPWalletProvider";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import CreateEventPage from "./pages/CreateEventPage";
import EventsPage from "./pages/EventsPage";
import EventDetailPage from "./pages/EventDetailPage";
import NFTGalleryPage from "./pages/NFTGalleryPage";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CDPWalletProvider>
      <EthereumProvider>
        <SolanaProvider>
          <TooltipProvider>
            <BrowserRouter>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <div className="min-h-screen bg-background flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/create-event" element={<CreateEventPage />} />
                      <Route path="/events" element={<EventsPage />} />
                      <Route path="/events/:id" element={<EventDetailPage />} />
                      <Route path="/nft-gallery" element={<NFTGalleryPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </SolanaProvider>
      </EthereumProvider>
    </CDPWalletProvider>
  </QueryClientProvider>
);

export default App;
