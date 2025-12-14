import { ThemeProvider } from "@/components/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
import CollaboratorTimeSheet from "./pages/CollaboratorTimeSheet";
import AdminVip from "./pages/AdminVip";
import AdminInventory from "./pages/AdminInventory";
import AdminShop from "./pages/AdminShop";
import AdminExpenses from "./pages/AdminExpenses";
import AdminBarbershopRevenue from "./pages/AdminBarbershopRevenue";
import AdminStoreRevenue from "./pages/AdminStoreRevenue";
import NotFound from "./pages/NotFound";
import CollaboratorMenu from "./pages/CollaboratorMenu";
import RequireAdmin from "./components/RequireAdmin";
import { DatabaseSetup } from "./components/DatabaseSetup";

const queryClient = new QueryClient();

// Componente para rotas protegidas
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

// Componente para rodar as migrações na inicialização
const RunMigrations = () => {
  useEffect(() => {
    const runMigrations = async () => {
      try {
        console.log('Verificando migrações...');
      } catch (error) {
        console.error('Erro ao executar migrações:', error);
      }
    };

    runMigrations();
  }, []);

  return null;
};

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <RunMigrations />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/database-setup" element={<DatabaseSetup />} />

                  {/* Rotas públicas */}
                  <Route path="/barbearias" element={<Barbearias />} />
                  <Route path="/services" element={<Services />} />

                  {/* Rotas protegidas */}
                  <Route path="/admin" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <Admin />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/bookings" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminBookings />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/booking" element={
                    <ProtectedRoute>
                      <Booking />
                    </ProtectedRoute>
                  } />
                  <Route path="/booking/confirm" element={
                    <ProtectedRoute>
                      <ConfirmBooking />
                    </ProtectedRoute>
                  } />
                  <Route path="/menu" element={
                    <ProtectedRoute>
                      <CollaboratorMenu />
                    </ProtectedRoute>
                  } />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/cart" element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/agendamentos" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminBookings />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financas" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminFinances />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financas/despesas" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminExpenses />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financas/receita-barbearia" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminBarbershopRevenue />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/financas/receita-loja" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminStoreRevenue />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/servicos" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminServices />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/perfil" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminProfile />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/colaboradores" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminCollaborators />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/colaboradores/:id" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <CollaboratorDetails />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/colaboradores/:id/folha-ponto" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <CollaboratorTimeSheet />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/vips" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminVip />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/estoque" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminInventory />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/loja" element={
                    <ProtectedRoute>
                      <RequireAdmin>
                        <AdminShop />
                      </RequireAdmin>
                    </ProtectedRoute>
                  } />

                  {/* Rota de página não encontrada */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
