/**
 * Função para popular uma barbearia nova com dados padrão e salvar no Supabase
 */

import { isSupabaseReady, supabase } from '@/integrations/supabase/client';
import { DEFAULT_SERVICES } from '@/data/services';
import { DEFAULT_STORE_PRODUCTS } from '@/data/inventory';
import { Barbershop } from '@/data/barbershops';
import { persistServices } from './services-storage';
import { persistInventory } from './inventory-storage';

/**
 * Popula uma barbearia com dados padrão (serviços e produtos) e salva no Supabase
 */
export async function populateBarbershopWithDefaults(barbershopId: string): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) {
    console.warn('Supabase não configurado, pulando população de dados padrão');
    return false;
  }

  try {
    // 1. Criar serviços padrão no Supabase
    // Gerar IDs únicos para cada serviço
    const servicesToInsert = DEFAULT_SERVICES.map(service => {
      const serviceId = typeof crypto !== "undefined" && "randomUUID" in crypto 
        ? crypto.randomUUID() 
        : `${barbershopId}-${service.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      return {
        id: serviceId,
        title: service.title,
        price: service.price,
        duration: service.duration,
        description: service.description,
        features: service.features,
        promotion_scope: service.promotionScope,
        discount_percentage: service.discountPercentage,
        barbershop_id: barbershopId,
      };
    });

    const { error: servicesError } = await (supabase as any)
      .from('services')
      .insert(servicesToInsert);

    if (servicesError) {
      console.error('Erro ao criar serviços padrão:', servicesError);
      // Não falha completamente, continua com produtos
    } else {
      console.log(`✅ ${servicesToInsert.length} serviços padrão criados`);
      // Salvar serviços no localStorage também (com os IDs gerados)
      const localServices = DEFAULT_SERVICES.map((s, index) => ({
        ...s,
        id: servicesToInsert[index].id, // Usar o mesmo ID gerado
      }));
      const existingServices = JSON.parse(localStorage.getItem('barberbook_admin_services') || '[]');
      persistServices([...existingServices, ...localServices]);
    }

    // 2. Criar produtos padrão no Supabase
    // Gerar IDs únicos para cada produto
    const productsToInsert = DEFAULT_STORE_PRODUCTS.map(product => {
      const productId = typeof crypto !== "undefined" && "randomUUID" in crypto 
        ? crypto.randomUUID() 
        : `${barbershopId}-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      return {
        id: productId,
        name: product.name,
        description: product.description,
        image_url: product.imageUrl,
        rating: product.rating,
        price: product.price,
        quantity: product.quantity,
        min_stock: product.minStock,
        vip_discount: product.vipDiscount,
        vip_promotion_label: product.vipPromotionLabel,
        category: product.category || 'produtos',
        barbershop_id: barbershopId,
      };
    });

    const { error: productsError } = await (supabase as any)
      .from('store_products')
      .insert(productsToInsert);

    if (productsError) {
      console.error('Erro ao criar produtos padrão:', productsError);
      // Não falha completamente
    } else {
      console.log(`✅ ${productsToInsert.length} produtos padrão criados`);
      // Salvar produtos no localStorage também (com os IDs gerados)
      const localProducts = DEFAULT_STORE_PRODUCTS.map((p, index) => ({
        ...p,
        id: productsToInsert[index].id, // Usar o mesmo ID gerado
      }));
      persistInventory({
        storeProducts: localProducts,
        consumables: [],
        storefront: {
          title: "Nossa Loja",
          subtitle: "Produtos profissionais selecionados para cuidar do seu estilo",
          highlight: "Para compras acima de R$ 100,00 dentro da região metropolitana",
        },
      }, barbershopId);
    }

    return true;
  } catch (error) {
    console.error('Erro ao popular barbearia com dados padrão:', error);
    return false;
  }
}

/**
 * Salva uma barbearia no Supabase
 */
export async function saveBarbershopToSupabase(barbershop: Barbershop, ownerId: string | null = null): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) {
    console.warn('Supabase não configurado, pulando salvamento no banco');
    return false;
  }

  try {
    const today = new Date();
    const vencimento = new Date(today);
    vencimento.setDate(vencimento.getDate() + 30);

    const { error } = await (supabase as any)
      .from('barbershops')
      .insert({
        id: barbershop.id,
        name: barbershop.name || 'Minha Barbearia',
        address: barbershop.address || null,
        phone: barbershop.phone.replace(/\D/g, '') || null, // Sem formatação
        email: barbershop.email || null,
        is_open: barbershop.isOpen ?? true,
        status: barbershop.status || 'disponivel',
        rating: barbershop.rating || 0,
        hours: barbershop.hours || null,
        pix_key: barbershop.pixKey || null,
        data_vencimento: barbershop.dataVencimento || vencimento.toISOString().split('T')[0],
        owner_id: ownerId,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar barbearia no Supabase:', error);
      return false;
    }

    console.log('✅ Barbearia salva no Supabase com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar barbearia no Supabase:', error);
    return false;
  }
}

/**
 * Cria uma barbearia completa com dados padrão no Supabase e localStorage
 */
export async function createBarbershopWithDefaults(
  barbershop: Barbershop,
  ownerId: string | null = null
): Promise<boolean> {
  try {
    // 1. Salvar barbearia no Supabase
    const saved = await saveBarbershopToSupabase(barbershop, ownerId);
    
    if (!saved) {
      console.warn('Barbearia não foi salva no Supabase, mas continuando...');
    }

    // 2. Popular com dados padrão
    const populated = await populateBarbershopWithDefaults(barbershop.id);
    
    // toast será mostrado pelo componente que chama essa função

    return saved && populated;
  } catch (error) {
    console.error('Erro ao criar barbearia completa:', error);
    return false;
  }
}

