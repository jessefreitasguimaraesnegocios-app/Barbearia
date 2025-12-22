import { supabase } from '@/lib/supabase';
import { DEFAULT_BARBERSHOPS } from '@/data/barbershops';
import { DEFAULT_SERVICES } from '@/data/services';
import { DEFAULT_COLLABORATORS } from '@/data/collaborators';
import { DEFAULT_STORE_PRODUCTS } from '@/data/inventory';
import { DEFAULT_VIP_DATA } from '@/data/vips';

/**
 * Script para popular o banco de dados Supabase com dados de exemplo
 * Execute este script uma vez após criar o schema
 */
export async function seedDatabase() {
    console.log('🌱 Iniciando população do banco de dados...');

    try {
        // 1. Inserir Barbearias
        console.log('📍 Inserindo barbearias...');
        const { data: barbershops, error: barbershopsError } = await supabase
            .from('barbershops')
            .insert(DEFAULT_BARBERSHOPS.map(b => ({
                id: b.id,
                name: b.name,
                rating: b.rating,
                address: b.address,
                phone: b.phone,
                hours: b.hours,
                is_open: b.isOpen,
                email: b.email,
                pix_key: b.pixKey || '',
                status: b.status || 'disponivel'
            })))
            .select();

        if (barbershopsError) {
            console.error('❌ Erro ao inserir barbearias:', barbershopsError);
        } else {
            console.log(`✅ ${barbershops?.length || 0} barbearias inseridas`);
        }

        // 2. Inserir Serviços
        console.log('💈 Inserindo serviços...');
        const { data: services, error: servicesError } = await supabase
            .from('services')
            .insert(DEFAULT_SERVICES.map(s => ({
                id: s.id,
                title: s.title,
                price: s.price,
                duration: s.duration,
                description: s.description,
                features: s.features,
                promotion_scope: s.promotionScope,
                discount_percentage: s.discountPercentage
            })))
            .select();

        if (servicesError) {
            console.error('❌ Erro ao inserir serviços:', servicesError);
        } else {
            console.log(`✅ ${services?.length || 0} serviços inseridos`);
        }

        // 3. Inserir Colaboradores
        console.log('👨‍💼 Inserindo colaboradores...');
        const { data: collaborators, error: collaboratorsError } = await supabase
            .from('collaborators')
            .insert(DEFAULT_COLLABORATORS.map(c => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
                email: c.email,
                cpf: c.cpf,
                role: c.role,
                specialty: c.specialty,
                payment_method: c.paymentMethod,
                photo_url: c.photoUrl,
                experience: c.experience,
                work_schedule: c.workSchedule,
                chair_rental_amount: c.chairRentalAmount,
                salary: c.salary,
                percentage_percentage: c.percentagePercentage,
                pix_key: c.pixKey
            })))
            .select();

        if (collaboratorsError) {
            console.error('❌ Erro ao inserir colaboradores:', collaboratorsError);
        } else {
            console.log(`✅ ${collaborators?.length || 0} colaboradores inseridos`);
        }

        // 4. Inserir Produtos da Loja
        console.log('🛍️ Inserindo produtos...');
        const { data: products, error: productsError } = await supabase
            .from('store_products')
            .insert(DEFAULT_STORE_PRODUCTS.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                image_url: p.imageUrl,
                rating: p.rating || 0,
                price: p.price,
                quantity: p.quantity,
                min_stock: p.minStock,
                vip_discount: p.vipDiscount || 0,
                vip_promotion_label: p.vipPromotionLabel,
                category: p.category
            })))
            .select();

        if (productsError) {
            console.error('❌ Erro ao inserir produtos:', productsError);
        } else {
            console.log(`✅ ${products?.length || 0} produtos inseridos`);
        }

        // 5. Inserir Membros VIP
        console.log('⭐ Inserindo membros VIP...');
        const { data: vips, error: vipsError } = await supabase
            .from('vip_members')
            .insert(DEFAULT_VIP_DATA.members.map(v => ({
                id: v.id,
                name: v.name,
                email: v.email,
                phone: v.phone,
                cpf: v.cpf,
                billing_cycle: v.billingCycle,
                payment_status: v.paymentStatus,
                joined_at: v.joinedAt,
                expires_at: v.expiresAt
            })))
            .select();

        if (vipsError) {
            console.error('❌ Erro ao inserir VIPs:', vipsError);
        } else {
            console.log(`✅ ${vips?.length || 0} membros VIP inseridos`);
        }

        console.log('\n🎉 Banco de dados populado com sucesso!');
        console.log('\n📊 Resumo:');
        console.log(`   - Barbearias: ${barbershops?.length || 0}`);
        console.log(`   - Serviços: ${services?.length || 0}`);
        console.log(`   - Colaboradores: ${collaborators?.length || 0}`);
        console.log(`   - Produtos: ${products?.length || 0}`);
        console.log(`   - Membros VIP: ${vips?.length || 0}`);

        return {
            success: true,
            counts: {
                barbershops: barbershops?.length || 0,
                services: services?.length || 0,
                collaborators: collaborators?.length || 0,
                products: products?.length || 0,
                vips: vips?.length || 0
            }
        };

    } catch (error) {
        console.error('💥 Erro fatal ao popular banco:', error);
        return {
            success: false,
            error
        };
    }
}

// Função auxiliar para limpar o banco (use com cuidado!)
export async function clearDatabase() {
    console.log('🗑️ Limpando banco de dados...');

    const tables = [
        'payments',
        'appointments',
        'bookings',
        'shop_sales',
        'expenses',
        'vip_members',
        'vip_configs',
        'consumables',
        'store_products',
        'collaborators',
        'services',
        'barbershops'
    ];

    for (const table of tables) {
        const { error } = await supabase
            .from(table)
            .delete()
            .neq('id', ''); // Delete all

        if (error) {
            console.error(`❌ Erro ao limpar ${table}:`, error);
        } else {
            console.log(`✅ ${table} limpa`);
        }
    }

    console.log('✅ Banco de dados limpo!');
}
