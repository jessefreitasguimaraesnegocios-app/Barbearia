import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadCollaborators, persistCollaborators } from "@/lib/collaborators-storage";
import { Collaborator } from "@/data/collaborators";
import { loadServices } from "@/lib/services-storage";
import { ServiceItem } from "@/data/services";
import { loadVipData } from "@/lib/vips-storage";
import { VipMember } from "@/data/vips";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock } from "lucide-react";
import { parseISO, isSameDay, isAfter, startOfToday } from "date-fns";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ActiveCollaborator = {
	id: string;
	name: string;
	email: string;
	role: string;
};

type TimeClockRecord = {
	timestamp: string;
	type: "entrada" | "almoco-inicio" | "almoco-fim" | "saida";
};

interface AppointmentData {
	id: string;
	serviceId: string;
	barberId: string;
	date: string;
	time: string;
	clientName?: string;
}

interface BookingConfirmation {
	appointments: AppointmentData[];
	payment: {
		fullName: string;
		phone: string;
		cpf: string;
	};
	timestamp: string;
}

const getActive = (): ActiveCollaborator | null => {
	try {
		const stored = localStorage.getItem("activeCollaborator");
		return stored ? JSON.parse(stored) : null;
	} catch {
		return null;
	}
};

const todayKey = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const CollaboratorMenu = () => {
	const navigate = useNavigate();
	const { toast } = useToast();
	const [active, setActive] = useState<ActiveCollaborator | null>(() => getActive());
	const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
	const [records, setRecords] = useState<TimeClockRecord[]>([]);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingType, setPendingType] = useState<TimeClockRecord["type"] | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		specialty: "",
		photoUrl: "",
		experience: "",
	});
	const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
	const [services, setServices] = useState<ServiceItem[]>([]);
	const [vipMembers, setVipMembers] = useState<VipMember[]>([]);

	const storageKey = useMemo(() => {
		return active ? `time_clock_${active.id}_${todayKey()}` : "";
	}, [active]);

	const getBarberIdFromCollaborator = (collaborator: Collaborator): string => {
		const nameSlug = collaborator.name.toLowerCase().replace(/\s+/g, "-");
		return nameSlug;
	};

	useEffect(() => {
		if (active) {
			const collaborators = loadCollaborators();
			const found = collaborators.find((c) => c.id === active.id);
			if (found) {
				setCollaborator(found);
				setFormData({
					name: found.name,
					email: found.email,
					phone: found.phone,
					specialty: found.specialty,
					photoUrl: found.photoUrl || "",
					experience: found.experience || "",
				});
			}
		}
	}, [active]);

	const isVipClient = (fullName: string, cpf: string, phone: string): boolean => {
		const normalizedName = fullName.toLowerCase().trim();
		const normalizedCpf = cpf.replace(/\D/g, "");
		const normalizedPhone = phone.replace(/\D/g, "");

		return vipMembers.some((member) => {
			const memberName = member.name.toLowerCase().trim();
			const memberCpf = member.cpf.replace(/\D/g, "");
			const memberPhone = member.phone.replace(/\D/g, "");

			return (
				(memberName === normalizedName && memberCpf === normalizedCpf) ||
				(memberName === normalizedName && memberPhone === normalizedPhone) ||
				(memberCpf === normalizedCpf && memberCpf.length === 11)
			);
		});
	};

	useEffect(() => {
		const loadedServices = loadServices();
		setServices(loadedServices);

		const vipData = loadVipData();
		setVipMembers(vipData.members);

		const allStoredBookings: BookingConfirmation[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith("bookingConfirmation")) {
				try {
					const value = localStorage.getItem(key);
					if (value) {
						const parsed = JSON.parse(value);
						if (parsed && parsed.appointments) {
							if (Array.isArray(parsed)) {
								allStoredBookings.push(...parsed.filter((b: BookingConfirmation) => b && b.appointments));
							} else {
								allStoredBookings.push(parsed);
							}
						}
					}
				} catch {
					continue;
				}
			}
		}
		setAllBookings(allStoredBookings);

		const handleStorage = (event: StorageEvent) => {
			if (event.key?.startsWith("bookingConfirmation")) {
				const updatedBookings: BookingConfirmation[] = [];
				for (let i = 0; i < localStorage.length; i++) {
					const key = localStorage.key(i);
					if (key && key.startsWith("bookingConfirmation")) {
						try {
							const value = localStorage.getItem(key);
							if (value) {
								const parsed = JSON.parse(value);
								if (parsed && parsed.appointments) {
									if (Array.isArray(parsed)) {
										updatedBookings.push(...parsed.filter((b: BookingConfirmation) => b && b.appointments));
									} else {
										updatedBookings.push(parsed);
									}
								}
							}
						} catch {
							continue;
						}
					}
				}
				setAllBookings(updatedBookings);
			}
		};

		const loadBookings = () => {
			const updatedBookings: BookingConfirmation[] = [];
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith("bookingConfirmation")) {
					try {
						const value = localStorage.getItem(key);
						if (value) {
							const parsed = JSON.parse(value);
							if (parsed && parsed.appointments) {
								if (Array.isArray(parsed)) {
									updatedBookings.push(...parsed.filter((b: BookingConfirmation) => b && b.appointments));
								} else {
									updatedBookings.push(parsed);
								}
							}
						}
					} catch {
						continue;
					}
				}
			}
			setAllBookings(updatedBookings);
		};

		window.addEventListener("storage", handleStorage);

		const originalSetItem = localStorage.setItem;
		localStorage.setItem = function(...args) {
			originalSetItem.apply(this, args);
			if (args[0]?.startsWith("bookingConfirmation")) {
				loadBookings();
			}
		};

		return () => {
			window.removeEventListener("storage", handleStorage);
			localStorage.setItem = originalSetItem;
		};
	}, []);

	useEffect(() => {
		const onStorage = (e: StorageEvent) => {
			if (e.key === "activeCollaborator") {
				setActive(getActive());
			}
		};
		window.addEventListener("storage", onStorage);
		return () => window.removeEventListener("storage", onStorage);
	}, []);

	useEffect(() => {
		if (!storageKey) return;
		try {
			const raw = localStorage.getItem(storageKey);
			setRecords(raw ? (JSON.parse(raw) as TimeClockRecord[]) : []);
		} catch {
			setRecords([]);
		}
	}, [storageKey]);

	const appendRecord = (type: TimeClockRecord["type"]) => {
		if (!storageKey) return;
		const next = [...records, { timestamp: new Date().toISOString(), type }];
		setRecords(next);
		localStorage.setItem(storageKey, JSON.stringify(next));
	};

	const requestRecord = (type: TimeClockRecord["type"]) => {
		setPendingType(type);
		setConfirmOpen(true);
	};

	const confirmRecord = () => {
		if (pendingType) {
			appendRecord(pendingType);
		}
		setConfirmOpen(false);
		setPendingType(null);
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (!event.target.files || event.target.files.length === 0) {
			return;
		}

		const file = event.target.files[0];
		event.target.value = "";

		const reader = new FileReader();
		reader.onloadend = () => {
			const result = reader.result?.toString();
			if (result) {
				setFormData((prev) => ({ ...prev, photoUrl: result }));
				toast({
					title: "Foto carregada",
					description: "Foto de perfil atualizada com sucesso.",
				});
			}
		};

		reader.onerror = () => {
			toast({
				variant: "destructive",
				title: "Falha ao carregar imagem",
				description: "Não foi possível processar o arquivo. Tente novamente.",
			});
		};

		reader.readAsDataURL(file);
	};

	const handleClearImage = () => {
		setFormData((prev) => ({ ...prev, photoUrl: "" }));
	};

	const formatPhone = (value: string) => {
		const numbers = value.replace(/\D/g, "").slice(0, 11);
		if (numbers.length <= 2) {
			return numbers.length > 0 ? `(${numbers}` : numbers;
		} else if (numbers.length <= 7) {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
		} else {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
		}
	};

	const handleFormChange = (field: keyof typeof formData, value: string) => {
		if (field === "phone") {
			const formatted = formatPhone(value);
			setFormData((prev) => ({ ...prev, [field]: formatted }));
		} else {
			setFormData((prev) => ({ ...prev, [field]: value }));
		}
	};

	const handleSaveProfile = () => {
		if (!collaborator || !active) return;

		if (!formData.name.trim()) {
			toast({
				variant: "destructive",
				title: "Nome obrigatório",
				description: "Preencha o nome do colaborador.",
			});
			return;
		}

		if (!formData.email.trim() || !formData.email.includes("@")) {
			toast({
				variant: "destructive",
				title: "E-mail inválido",
				description: "Preencha um e-mail válido.",
			});
			return;
		}

		const collaborators = loadCollaborators();
		const updatedCollaborators = collaborators.map((c) =>
			c.id === collaborator.id
				? {
					...c,
					name: formData.name.trim(),
					email: formData.email.trim(),
					phone: formData.phone.trim(),
					specialty: formData.specialty.trim(),
					photoUrl: formData.photoUrl.trim() || undefined,
					experience: formData.experience.trim() || undefined,
				}
				: c
		);

		persistCollaborators(updatedCollaborators);

		const updatedCollaborator = updatedCollaborators.find((c) => c.id === collaborator.id);
		if (updatedCollaborator) {
			setCollaborator(updatedCollaborator);
			const updatedActive = {
				id: updatedCollaborator.id,
				name: updatedCollaborator.name,
				email: updatedCollaborator.email,
				role: updatedCollaborator.role,
			};
			localStorage.setItem("activeCollaborator", JSON.stringify(updatedActive));
			setActive(updatedActive);
		}

		setIsEditing(false);
		toast({
			title: "Perfil atualizado",
			description: "Seus dados foram salvos com sucesso.",
		});
	};

	const logout = () => {
		try {
			localStorage.removeItem("activeCollaborator");
		} finally {
			navigate("/");
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			<main className="pt-24 pb-20">
				<div className="container mx-auto px-4 grid gap-6 md:grid-cols-2">
					<Card className="shadow-card border-border">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Perfil</CardTitle>
								{!isEditing && (
									<Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
										Editar
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{isEditing ? (
								<>
									<div className="space-y-4">
										<div className="flex flex-col items-center gap-4">
											<div className="h-24 w-24 rounded-full overflow-hidden bg-secondary border-2 border-primary">
												{formData.photoUrl ? (
													<img
														src={formData.photoUrl}
														alt={formData.name || "Foto de perfil"}
														className="h-full w-full object-cover"
													/>
												) : (
													<div className="h-full w-full flex items-center justify-center">
														<User className="h-12 w-12 text-muted-foreground" />
													</div>
												)}
											</div>
											<div className="flex gap-2">
												<Label htmlFor="photo-upload" className="cursor-pointer">
													<Button variant="outline" size="sm" type="button" onClick={() => document.getElementById("photo-upload")?.click()}>
														Alterar foto
													</Button>
												</Label>
												<Input
													type="file"
													accept="image/*"
													onChange={handleImageUpload}
													className="hidden"
													id="photo-upload"
												/>
												{formData.photoUrl && (
													<Button variant="outline" size="sm" onClick={handleClearImage}>
														Remover
													</Button>
												)}
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="name">Nome *</Label>
											<Input
												id="name"
												value={formData.name}
												onChange={(e) => handleFormChange("name", e.target.value)}
												placeholder="Seu nome completo"
												required
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="email">E-mail *</Label>
											<Input
												id="email"
												type="email"
												value={formData.email}
												onChange={(e) => handleFormChange("email", e.target.value)}
												placeholder="seu@email.com"
												required
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="phone">WhatsApp</Label>
											<Input
												id="phone"
												type="tel"
												value={formData.phone}
												onChange={(e) => handleFormChange("phone", e.target.value)}
												placeholder="(11) 99999-9999"
												maxLength={15}
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="specialty">Especialidade</Label>
											<Input
												id="specialty"
												value={formData.specialty}
												onChange={(e) => handleFormChange("specialty", e.target.value)}
												placeholder="Sua especialidade"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="experience">Tempo de Experiência</Label>
											<Input
												id="experience"
												value={formData.experience}
												onChange={(e) => handleFormChange("experience", e.target.value)}
												placeholder="Ex: 5 anos, 10 anos"
											/>
										</div>

										<div className="space-y-2">
											<Label>Função</Label>
											<Input value={collaborator?.role || "-"} disabled />
										</div>

										<div className="flex gap-2 pt-2">
											<Button variant="hero" onClick={handleSaveProfile} className="flex-1">
												Salvar
											</Button>
											<Button
												variant="outline"
												onClick={() => {
													setIsEditing(false);
													if (collaborator) {
														setFormData({
															name: collaborator.name,
															email: collaborator.email,
															phone: collaborator.phone,
															specialty: collaborator.specialty,
															photoUrl: collaborator.photoUrl || "",
															experience: collaborator.experience || "",
														});
													}
												}}
											>
												Cancelar
											</Button>
										</div>
									</div>
								</>
							) : (
								<>
									<div className="flex flex-col items-center gap-4 mb-6">
										<div className="h-24 w-24 rounded-full overflow-hidden bg-secondary border-2 border-primary">
											{collaborator?.photoUrl ? (
												<img
													src={collaborator.photoUrl}
													alt={collaborator.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="h-full w-full flex items-center justify-center">
													<User className="h-12 w-12 text-muted-foreground" />
												</div>
											)}
										</div>
									</div>
									<div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{active?.name ?? "-"}</span></div>
									<div><span className="text-muted-foreground">E-mail:</span> <span className="font-medium">{active?.email ?? "-"}</span></div>
									{collaborator?.phone && (
										<div><span className="text-muted-foreground">WhatsApp:</span> <span className="font-medium">{collaborator.phone}</span></div>
									)}
									{collaborator?.specialty && (
										<div><span className="text-muted-foreground">Especialidade:</span> <span className="font-medium">{collaborator.specialty}</span></div>
									)}
									{collaborator?.experience && (
										<div><span className="text-muted-foreground">Experiência:</span> <span className="font-medium">{collaborator.experience}</span></div>
									)}
									<div><span className="text-muted-foreground">Função:</span> <span className="font-medium">{active?.role ?? "-"}</span></div>
									<div className="pt-2">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="destructive">Sair</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancelar</AlertDialogCancel>
													<AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</>
							)}
						</CardContent>
					</Card>

					<Card className="shadow-card border-border">
						<CardHeader>
							<CardTitle>Registro de Ponto (Hoje)</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button variant="secondary" onClick={() => requestRecord("entrada")}>Registrar Entrada</Button>
								<Button variant="secondary" onClick={() => requestRecord("almoco-inicio")}>Início Almoço</Button>
								<Button variant="secondary" onClick={() => requestRecord("almoco-fim")}>Fim Almoço</Button>
								<Button variant="secondary" onClick={() => requestRecord("saida")}>Registrar Saída</Button>
							</div>
							<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											{pendingType === "entrada" && "Confirmar registro de Entrada?"}
											{pendingType === "almoco-inicio" && "Confirmar Início do Almoço?"}
											{pendingType === "almoco-fim" && "Confirmar Fim do Almoço?"}
											{pendingType === "saida" && "Confirmar registro de Saída?"}
										</AlertDialogTitle>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel>Cancelar</AlertDialogCancel>
										<AlertDialogAction onClick={confirmRecord}>Confirmar</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
							<ul className="space-y-2">
								{records.map((r, idx) => (
									<li key={idx} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
										<span className="capitalize">{r.type.replace("-", " ")}</span>
										<span className="text-muted-foreground">{new Date(r.timestamp).toLocaleTimeString()}</span>
									</li>
								))}
								{records.length === 0 && <div className="text-sm text-muted-foreground">Sem registros hoje.</div>}
							</ul>
						</CardContent>
					</Card>

					<Card className="md:col-span-2 shadow-card border-border">
						<CardHeader>
							<CardTitle>Fila de Clientes Agendados</CardTitle>
						</CardHeader>
						<CardContent>
							{(() => {
								if (!collaborator) {
									return <div className="text-sm text-muted-foreground">Carregando...</div>;
								}

								const barberId = getBarberIdFromCollaborator(collaborator);
								const today = startOfToday();

								const upcomingAppointments: Array<{
									appointment: AppointmentData;
									service: ServiceItem | undefined;
									clientName: string;
									date: Date;
									isVip: boolean;
								}> = [];

								allBookings.forEach((booking) => {
									booking.appointments.forEach((apt) => {
										if (apt.barberId === collaborator.id || apt.barberId === barberId) {
											const aptDate = parseISO(apt.date);
											if (isSameDay(aptDate, today) || isAfter(aptDate, today)) {
												const service = services.find((s) => s.id === apt.serviceId);
												const clientName = apt.clientName || booking.payment.fullName;
												const isVip = isVipClient(
													clientName,
													booking.payment.cpf,
													booking.payment.phone
												);
												upcomingAppointments.push({
													appointment: apt,
													service,
													clientName,
													date: aptDate,
													isVip,
												});
											}
										}
									});
								});

								upcomingAppointments.sort((a, b) => {
									if (a.date.getTime() !== b.date.getTime()) {
										return a.date.getTime() - b.date.getTime();
									}
									return a.appointment.time.localeCompare(b.appointment.time);
								});

								if (upcomingAppointments.length === 0) {
									return <div className="text-sm text-muted-foreground">Nenhum agendamento encontrado.</div>;
								}

								return (
									<div className="space-y-3">
										{upcomingAppointments.map((item, idx) => (
											<div
												key={`${item.appointment.id}-${idx}`}
												className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-secondary/50 transition-colors"
											>
												<div className="flex-1">
													<div className="flex items-center gap-2 mb-1">
														<User className="h-4 w-4 text-primary" />
														<span className="font-medium">{item.clientName}</span>
														{item.isVip && (
															<Badge variant="default" className="text-xs">
																VIP
															</Badge>
														)}
													</div>
													{item.service && (
														<div className="text-sm text-muted-foreground ml-6 mb-1">
															{item.service.title}
														</div>
													)}
													<div className="flex items-center gap-4 ml-6 text-xs text-muted-foreground">
														<div className="flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															<span>
																{item.date.toLocaleDateString("pt-BR", {
																	day: "2-digit",
																	month: "2-digit",
																	year: "numeric",
																})}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															<span>{item.appointment.time}</span>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								);
							})()}
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
};

export default CollaboratorMenu;


