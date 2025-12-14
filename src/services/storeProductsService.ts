import { supabase } from '@/lib/supabase';

export interface StoreProduct {
    id: string;
    external_id?: string;
    name: string;
    description?: string;
    image_url?: string;
    rating: number;
    price: number;
    quantity: number;
    min_stock: number;
    vip_discount: number;
    vip_promotion_label?: string;
    created_at?: string;
    category: 'produtos' | 'consumo' | 'bebidas' | 'estilo' | 'rascunho';
    barbershop_id?: string;
    updated_at?: string;
}

export const storeProductsService = {
    async getAll(): Promise<StoreProduct[]> {
        const { data, error } = await supabase
            .from('store_products')
            .select('*')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<StoreProduct | null> {
        const { data, error } = await supabase
            .from('store_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    async getByCategory(category: StoreProduct['category']): Promise<StoreProduct[]> {
        const { data, error } = await supabase
            .from('store_products')
            .select('*')
            .eq('category', category)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async getLowStock(): Promise<StoreProduct[]> {
        const { data, error } = await supabase
            .from('store_products')
            .select('*')
            .filter('quantity', 'lte', 'min_stock')
            .order('quantity', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getByBarbershop(barbershopId: string): Promise<StoreProduct[]> {
        const { data, error } = await supabase
            .from('store_products')
            .select('*')
            .eq('barbershop_id', barbershopId)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(product: Omit<StoreProduct, 'id' | 'created_at' | 'updated_at'>): Promise<StoreProduct> {
        const { data, error } = await supabase
            .from('store_products')
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<StoreProduct>): Promise<StoreProduct> {
        const { data, error } = await supabase
            .from('store_products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateStock(id: string, quantity: number): Promise<StoreProduct> {
        return this.update(id, { quantity });
    },

    async decrementStock(id: string, amount: number): Promise<StoreProduct> {
        const product = await this.getById(id);
        if (!product) throw new Error('Product not found');

        const newQuantity = Math.max(0, product.quantity - amount);
        return this.updateStock(id, newQuantity);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('store_products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
