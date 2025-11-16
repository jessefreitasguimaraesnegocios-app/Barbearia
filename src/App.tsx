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
import AdminExpenses from "./pages/AdminExpenses";
import AdminBarbershopRevenue from "./pages/AdminBarbershopRevenue";
import NotFound from "./pages/NotFound";
import CollaboratorMenu from "./pages/CollaboratorMenu";
import RequireAdmin from "./components/RequireAdmin";

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
              <Route path="/menu" element={<CollaboratorMenu />} />
              <Route path="/barbearias" element={<Barbearias />} />
              <Route path="/services" element={<Services />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/booking/confirm" element={<ConfirmBooking />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
              <Route path="/admin/agendamentos" element={<RequireAdmin><AdminBookings /></RequireAdmin>} />
              <Route path="/admin/financas" element={<RequireAdmin><AdminFinances /></RequireAdmin>} />
              <Route path="/admin/financas/despesas" element={<RequireAdmin><AdminExpenses /></RequireAdmin>} />
              <Route path="/admin/financas/receita-barbearia" element={<RequireAdmin><AdminBarbershopRevenue /></RequireAdmin>} />
              <Route path="/admin/servicos" element={<RequireAdmin><AdminServices /></RequireAdmin>} />
              <Route path="/admin/perfil" element={<RequireAdmin><AdminProfile /></RequireAdmin>} />
              <Route path="/admin/colaboradores" element={<RequireAdmin><AdminCollaborators /></RequireAdmin>} />
              <Route path="/admin/colaboradores/:id" element={<RequireAdmin><CollaboratorDetails /></RequireAdmin>} />
              <Route path="/admin/vips" element={<RequireAdmin><AdminVip /></RequireAdmin>} />
              <Route path="/admin/estoque" element={<RequireAdmin><AdminInventory /></RequireAdmin>} />
              <Route path="/admin/loja" element={<RequireAdmin><AdminShop /></RequireAdmin>} />
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
