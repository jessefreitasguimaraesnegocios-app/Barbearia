import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ShopSale = {
	id: string;
	productId: string;
	productName: string;
	quantity: number;
	price: number;
	total: number;
	timestamp: string;
};

const AdminStoreRevenue = () => {
	const navigate = useNavigate();
	const [sales, setSales] = useState<ShopSale[]>([]);

	useEffect(() => {
		const allSales: ShopSale[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && (key.startsWith("shop_sale_") || key.startsWith("completed_order_"))) {
				try {
					const value = localStorage.getItem(key);
					if (!value) continue;
					const parsed = JSON.parse(value);
					if (parsed && Array.isArray(parsed)) {
						allSales.push(...parsed);
					} else if (parsed && parsed.items) {
						parsed.items.forEach((item: any) => {
							allSales.push({
								id: `${key}_${item.id}`,
								productId: String(item.id),
								productName: item.name || "Produto",
								quantity: item.quantity || 1,
								price: item.priceValue || item.price || 0,
								total: (item.priceValue || item.price || 0) * (item.quantity || 1),
								timestamp: parsed.timestamp || parsed.date || new Date().toISOString(),
							});
						});
					} else if (parsed) {
						allSales.push(parsed);
					}
				} catch {
					// ignore
				}
			}
		}
		// mais recente primeiro
		allSales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
		setSales(allSales);
	}, []);

	const currencyFormatter = useMemo(
		() => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
		[],
	);

	const total = useMemo(() => sales.reduce((sum, s) => sum + (s.total ?? (s.price * s.quantity)), 0), [sales]);

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-24 pb-20">
				<div className="container mx-auto px-4 max-w-5xl">
					<div className="flex items-center gap-3 mb-8">
						<Button variant="ghost" size="icon" onClick={() => navigate("/admin/financas")}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<h1 className="text-3xl font-display font-bold">
								Receita <span className="text-primary">Loja</span>
							</h1>
							<p className="text-muted-foreground">Registros de vendas e valores</p>
						</div>
					</div>

					<Card className="shadow-card border-border mb-6">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingBag className="h-5 w-5 text-primary" />
								Resumo
							</CardTitle>
						</CardHeader>
						<CardContent className="flex items-center justify-between">
							<div className="text-sm text-muted-foreground">Total de vendas</div>
							<div className="text-2xl font-bold text-primary">
								{currencyFormatter.format(total)}
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-card border-border">
						<CardHeader>
							<CardTitle>Vendas</CardTitle>
						</CardHeader>
						<CardContent>
							{sales.length === 0 ? (
								<p className="text-center text-muted-foreground py-10">Nenhuma venda registrada.</p>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-sm">
										<thead>
											<tr className="text-left border-b border-border">
												<th className="py-3 pr-3">Data</th>
												<th className="py-3 pr-3">Produto</th>
												<th className="py-3 pr-3">Qtd</th>
												<th className="py-3 pr-3">Preço</th>
												<th className="py-3 pr-3">Total</th>
											</tr>
										</thead>
										<tbody>
											{sales.map((s) => (
												<tr key={s.id} className="border-b border-border/60">
													<td className="py-3 pr-3 whitespace-nowrap">
														{format(parseISO(s.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}
													</td>
													<td className="py-3 pr-3">{s.productName}</td>
													<td className="py-3 pr-3">{s.quantity}</td>
													<td className="py-3 pr-3">{currencyFormatter.format(s.price)}</td>
													<td className="py-3 pr-3 font-medium">{currencyFormatter.format(s.total ?? (s.price * s.quantity))}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
};

export default AdminStoreRevenue;


