import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import Index from "./pages/Index";
import Services from "./pages/Services";
import Barbearias from "./pages/Barbearias";
import Booking from "./pages/Booking";
import ConfirmBooking from "./pages/ConfirmBooking";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AdminBookings from "./pages/AdminBookings";
import AdminFinances from "./pages/AdminFinances";
import AdminServices from "./pages/AdminServices";
import AdminProfile from "./pages/AdminProfile";
import AdminCollaborators from "./pages/AdminCollaborators";
import CollaboratorDetails from "./pages/CollaboratorDetails";
import AdminVip from "./pages/AdminVip";
import AdminInventory from "./pages/AdminInventory";
import AdminShop from "./pages/AdminShop";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/barbearias" element={<Barbearias />} />
              <Route path="/services" element={<Services />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/booking/confirm" element={<ConfirmBooking />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/agendamentos" element={<AdminBookings />} />
              <Route path="/admin/financas" element={<AdminFinances />} />
              <Route path="/admin/servicos" element={<AdminServices />} />
              <Route path="/admin/perfil" element={<AdminProfile />} />
              <Route path="/admin/colaboradores" element={<AdminCollaborators />} />
              <Route path="/admin/colaboradores/:id" element={<CollaboratorDetails />} />
              <Route path="/admin/vips" element={<AdminVip />} />
              <Route path="/admin/estoque" element={<AdminInventory />} />
              <Route path="/admin/loja" element={<AdminShop />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
