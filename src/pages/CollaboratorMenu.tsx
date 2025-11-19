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
import { hashPassword } from "@/lib/password";
import { loadServices } from "@/lib/services-storage";
import { ServiceItem } from "@/data/services";
import { loadVipData } from "@/lib/vips-storage";
import { VipMember } from "@/data/vips";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, Clock, History, ChevronDown, Copy, Pencil, Eye, EyeOff } from "lucide-react";
import { parseISO, isSameDay, isAfter, startOfToday, subMonths, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

const dateKey = (date: Date) => {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
		workSchedule: "",
		password: "",
		confirmPassword: "",
	});
	const [allBookings, setAllBookings] = useState<BookingConfirmation[]>([]);
	const [services, setServices] = useState<ServiceItem[]>([]);
	const [vipMembers, setVipMembers] = useState<VipMember[]>([]);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [selectedMonth, setSelectedMonth] = useState<string>("all");
	const [selectedAppointment, setSelectedAppointment] = useState<{
		apt: AppointmentData & { serviceName: string };
		payment: { fullName: string; phone: string; cpf: string };
	} | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
					workSchedule: found.workSchedule || "",
					password: "",
					confirmPassword: "",
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

	const hasRecordedToday = (type: TimeClockRecord["type"]): boolean => {
		return records.some((record) => record.type === type);
	};

	const getHistoryRecords = (): Array<{ date: string; records: TimeClockRecord[] }> => {
		if (!active) return [];

		const sixMonthsAgo = subMonths(new Date(), 6);
		const today = new Date();
		const allDays = eachDayOfInterval({ start: sixMonthsAgo, end: today });

		const historyData: Array<{ date: string; records: TimeClockRecord[] }> = [];

		allDays.forEach((day) => {
			const key = `time_clock_${active.id}_${dateKey(day)}`;
			try {
				const raw = localStorage.getItem(key);
				if (raw) {
					const dayRecords = JSON.parse(raw) as TimeClockRecord[];
					if (dayRecords && dayRecords.length > 0) {
						historyData.push({
							date: dateKey(day),
							records: dayRecords,
						});
					}
				}
			} catch {
				// Ignore invalid entries
			}
		});

		return historyData;
	};

	const getGroupedHistory = () => {
		const historyRecords = getHistoryRecords();
		const grouped: Record<string, Array<{ date: string; records: TimeClockRecord[] }>> = {};

		historyRecords.forEach((item) => {
			const recordDate = parseISO(item.date);
			const monthKey = format(recordDate, "yyyy-MM");

			if (!grouped[monthKey]) {
				grouped[monthKey] = [];
			}
			grouped[monthKey].push(item);
		});

		// Sort months descending (most recent first)
		const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

		const allMonths = sortedMonths.map((monthKey) => {
			const monthName = format(parseISO(`${monthKey}-01`), "MMMM yyyy", { locale: ptBR });
			return {
				monthKey,
				monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
				days: grouped[monthKey].sort((a, b) => b.date.localeCompare(a.date)),
			};
		});

		// Filter by selected month
		if (selectedMonth === "all") {
			return allMonths;
		}

		return allMonths.filter((month) => month.monthKey === selectedMonth);
	};

	const getAvailableMonths = () => {
		const historyRecords = getHistoryRecords();
		const monthSet = new Set<string>();

		historyRecords.forEach((item) => {
			const recordDate = parseISO(item.date);
			const monthKey = format(recordDate, "yyyy-MM");
			monthSet.add(monthKey);
		});

		const sortedMonths = Array.from(monthSet).sort((a, b) => b.localeCompare(a));

		return sortedMonths.map((monthKey) => {
			const monthName = format(parseISO(`${monthKey}-01`), "MMMM yyyy", { locale: ptBR });
			return {
				monthKey,
				monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
			};
		});
	};

	const parseWorkSchedule = (schedule: string): { start: number; end: number } | null => {
		if (!schedule) return null;
		const match = schedule.match(/(\d+)\s*hs?\s*(?:as|às|a)\s*(\d+)\s*hs?/i);
		if (match) {
			return {
				start: parseInt(match[1], 10),
				end: parseInt(match[2], 10),
			};
		}
		return null;
	};

	const calculateWorkHours = () => {
		if (records.length < 4) return null;

		const entrada = records.find((r) => r.type === "entrada");
		const almocoInicio = records.find((r) => r.type === "almoco-inicio");
		const almocoFim = records.find((r) => r.type === "almoco-fim");
		const saida = records.find((r) => r.type === "saida");

		if (!entrada || !almocoInicio || !almocoFim || !saida) return null;

		const entradaTime = new Date(entrada.timestamp).getTime();
		const almocoInicioTime = new Date(almocoInicio.timestamp).getTime();
		const almocoFimTime = new Date(almocoFim.timestamp).getTime();
		const saidaTime = new Date(saida.timestamp).getTime();

		const manha = (almocoInicioTime - entradaTime) / (1000 * 60 * 60);
		const almoco = (almocoFimTime - almocoInicioTime) / (1000 * 60 * 60);
		const tarde = (saidaTime - almocoFimTime) / (1000 * 60 * 60);

		const totalHours = manha + tarde;
		const totalMinutes = Math.round((totalHours % 1) * 60);
		const totalHoursInt = Math.floor(totalHours);

		return {
			totalHours: totalHours,
			formatted: `${totalHoursInt}h ${totalMinutes}min`,
			manha,
			almoco,
			tarde,
		};
	};

	const calculateOvertime = (totalHours: number): string | null => {
		if (!collaborator?.workSchedule) return null;

		const schedule = parseWorkSchedule(collaborator.workSchedule);
		if (!schedule) return null;

		const expectedHours = schedule.end - schedule.start;
		const overtime = totalHours - expectedHours;

		if (overtime <= 0) return null;

		const overtimeHours = Math.floor(overtime);
		const overtimeMinutes = Math.round((overtime % 1) * 60);

		return `${overtimeHours}h ${overtimeMinutes}min`;
	};

	const requestRecord = (type: TimeClockRecord["type"]) => {
		if (hasRecordedToday(type)) {
			return;
		}
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

		if (formData.password || formData.confirmPassword) {
			if (formData.password.length < 6) {
				toast({
					variant: "destructive",
					title: "Senha muito curta",
					description: "A senha deve ter pelo menos 6 caracteres.",
				});
				return;
			}

			if (formData.password !== formData.confirmPassword) {
				toast({
					variant: "destructive",
					title: "Senhas não coincidem",
					description: "As senhas digitadas não são iguais.",
				});
				return;
			}
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
					workSchedule: formData.workSchedule.trim() || undefined,
					...(formData.password ? { password: hashPassword(formData.password) } : {}),
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
		setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
		toast({
			title: "Perfil atualizado",
			description: formData.password ? "Seus dados e senha foram salvos com sucesso." : "Seus dados foram salvos com sucesso.",
		});
	};

	const logout = () => {
		try {
			localStorage.removeItem("activeCollaborator");
		} finally {
			navigate("/");
		}
	};

	const copyToClipboard = async (text: string, label: string) => {
		try {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(text);
			} else {
				const textArea = document.createElement("textarea");
				textArea.value = text;
				textArea.style.position = "fixed";
				textArea.style.left = "-999999px";
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();
				document.execCommand("copy");
				textArea.remove();
			}
			toast({
				title: "Copiado!",
				description: `${label} copiado para a área de transferência.`,
			});
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Erro",
				description: "Não foi possível copiar para a área de transferência.",
			});
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
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditing(true)}
									>
										<Pencil className="h-4 w-4 mr-2" />
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
											<div className="h-24 w-24 rounded-full overflow-hidden bg-secondary border-2 border-primary group">
												{formData.photoUrl ? (
													<img
														src={formData.photoUrl}
														alt={formData.name || "Foto de perfil"}
														className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
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
											<Label htmlFor="workSchedule">Horário de Trabalho</Label>
											<Input
												id="workSchedule"
												value={formData.workSchedule}
												onChange={(e) => handleFormChange("workSchedule", e.target.value)}
												placeholder="Ex: de 8hs às 22hs"
											/>
										</div>

										<div className="space-y-2">
											<Label>Função</Label>
											<Input value={collaborator?.role || "-"} disabled />
										</div>

										<div className="space-y-2">
											<Label htmlFor="password">Alterar senha</Label>
											<div className="relative">
												<Input
													id="password"
													type={showPassword ? "text" : "password"}
													value={formData.password}
													onChange={(e) => handleFormChange("password", e.target.value)}
													placeholder="Digite a nova senha"
													className="pr-10"
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
													aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
												>
													{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
										</div>

										<div className="space-y-2">
											<Label htmlFor="confirmPassword">Confirmar senha</Label>
											<div className="relative">
												<Input
													id="confirmPassword"
													type={showConfirmPassword ? "text" : "password"}
													value={formData.confirmPassword}
													onChange={(e) => handleFormChange("confirmPassword", e.target.value)}
													placeholder="Confirme a nova senha"
													className="pr-10"
												/>
												<button
													type="button"
													onClick={() => setShowConfirmPassword(!showConfirmPassword)}
													className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
													aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
												>
													{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
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
															workSchedule: collaborator.workSchedule || "",
															password: "",
															confirmPassword: "",
														});
													}
													setShowPassword(false);
													setShowConfirmPassword(false);
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
										<div className="h-24 w-24 rounded-full overflow-hidden bg-secondary border-2 border-primary group">
											{collaborator?.photoUrl ? (
												<img
													src={collaborator.photoUrl}
													alt={collaborator.name}
													className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
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
									{collaborator?.workSchedule && (
										<div><span className="text-muted-foreground">Horário de Trabalho:</span> <span className="font-medium">{collaborator.workSchedule}</span></div>
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
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Registro de Ponto (Hoje)</CardTitle>
									{collaborator?.workSchedule && (
										<p className="text-sm text-muted-foreground mt-1">
											Carga horária: {collaborator.workSchedule}
										</p>
									)}
								</div>
								<Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
									<History className="h-4 w-4 mr-2" />
									Histórico
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Button 
									variant="secondary" 
									onClick={() => requestRecord("entrada")}
									disabled={hasRecordedToday("entrada")}
								>
									Registrar Entrada
								</Button>
								<Button 
									variant="secondary" 
									onClick={() => requestRecord("almoco-inicio")}
									disabled={hasRecordedToday("almoco-inicio")}
								>
									Início Almoço
								</Button>
								<Button 
									variant="secondary" 
									onClick={() => requestRecord("almoco-fim")}
									disabled={hasRecordedToday("almoco-fim")}
								>
									Fim Almoço
								</Button>
								<Button 
									variant="secondary" 
									onClick={() => requestRecord("saida")}
									disabled={hasRecordedToday("saida")}
								>
									Registrar Saída
								</Button>
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
										<div className="flex items-center gap-6 text-muted-foreground">
											<span>
												{new Date(r.timestamp).toLocaleDateString("pt-BR", {
													day: "2-digit",
													month: "2-digit",
													year: "numeric",
												})}
											</span>
											<span>
												{new Date(r.timestamp).toLocaleTimeString("pt-BR", {
													hour: "2-digit",
													minute: "2-digit",
													second: "2-digit",
												})}
											</span>
										</div>
									</li>
								))}
								{records.length === 0 && <div className="text-sm text-muted-foreground">Sem registros hoje.</div>}
							</ul>
							{(() => {
								const workHours = calculateWorkHours();
								if (!workHours) return null;

								const overtime = calculateOvertime(workHours.totalHours);

								return (
									<div className="mt-4 pt-4 border-t border-border space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium">Total de horas trabalhadas (no dia):</span>
											<span className="text-sm font-semibold text-primary">{workHours.formatted}</span>
										</div>
										{overtime && (
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">Horas extras:</span>
												<span className="text-sm font-semibold text-primary">{overtime}</span>
											</div>
										)}
									</div>
								);
							})()}
						</CardContent>
					</Card>

					<Dialog open={historyOpen} onOpenChange={(open) => {
						setHistoryOpen(open);
						if (!open) {
							setSelectedMonth("all");
						}
					}}>
						<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
							<DialogHeader>
								<DialogTitle>Histórico de Registros (Últimos 6 Meses)</DialogTitle>
							</DialogHeader>
							<div className="space-y-6 mt-4">
								{(() => {
									const groupedHistory = getGroupedHistory();
									if (groupedHistory.length === 0) {
										return <div className="text-sm text-muted-foreground text-center py-8">Nenhum registro encontrado.</div>;
									}

									return groupedHistory.map((month) => (
										<div key={month.monthKey} className="space-y-3">
											<div className="flex items-center gap-2 border-b border-border pb-2">
												<h3 className="text-lg font-semibold text-primary flex-1">
													{month.monthName}
												</h3>
												<Select value={selectedMonth} onValueChange={setSelectedMonth}>
													<SelectTrigger className="w-[180px] h-8 border-none shadow-none bg-transparent hover:bg-accent">
														<SelectValue placeholder="Selecionar mês" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="all">Todos os meses</SelectItem>
														{getAvailableMonths().map((m) => (
															<SelectItem key={m.monthKey} value={m.monthKey}>
																{m.monthName}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
											<div className="space-y-2">
												{month.days.map((day) => (
													<div key={day.date} className="space-y-2">
														<div className="text-sm font-medium text-muted-foreground">
															{format(parseISO(day.date), "dd/MM/yyyy", { locale: ptBR })}
														</div>
														<ul className="space-y-1 ml-4">
															{day.records.map((r, idx) => (
																<li key={idx} className="flex items-center justify-between rounded-md border border-border px-3 py-2 bg-secondary/50">
																	<span className="capitalize">{r.type.replace("-", " ")}</span>
																	<div className="flex items-center gap-6 text-muted-foreground">
																		<span>
																			{new Date(r.timestamp).toLocaleDateString("pt-BR", {
																				day: "2-digit",
																				month: "2-digit",
																				year: "numeric",
																			})}
																		</span>
																		<span>
																			{new Date(r.timestamp).toLocaleTimeString("pt-BR", {
																				hour: "2-digit",
																				minute: "2-digit",
																				second: "2-digit",
																			})}
																		</span>
																	</div>
																</li>
															))}
														</ul>
													</div>
												))}
											</div>
										</div>
									));
								})()}
							</div>
						</DialogContent>
					</Dialog>

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
										{upcomingAppointments.map((item, idx) => {
											const booking = allBookings.find((b) => 
												b.appointments.some((a) => a.id === item.appointment.id)
											);
											return (
											<div
												key={`${item.appointment.id}-${idx}`}
												className="flex items-center justify-between rounded-md border border-border px-4 py-3 hover:bg-secondary/50 transition-colors cursor-pointer"
												onClick={() => {
													if (booking && item.service) {
														setSelectedAppointment({
															apt: {
																...item.appointment,
																serviceName: item.service.title,
															},
															payment: booking.payment,
														});
													}
												}}
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
											);
										})}
									</div>
								);
							})()}
						</CardContent>
					</Card>

					<Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Informações do Cliente</DialogTitle>
								<DialogDescription>
									{selectedAppointment && `Dados do cliente para o agendamento de ${selectedAppointment.apt.serviceName}`}
								</DialogDescription>
							</DialogHeader>
							{selectedAppointment && (
								<div className="space-y-4 pt-4">
									<div className="space-y-2">
										<label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
										<div className="flex items-center justify-between gap-2">
											<p className="text-base font-semibold flex-1">{selectedAppointment.payment.fullName}</p>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => copyToClipboard(selectedAppointment.payment.fullName, "Nome completo")}
												aria-label="Copiar nome completo"
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium text-muted-foreground">Número de Telefone</label>
										<div className="flex items-center justify-between gap-2">
											<p className="text-base font-semibold flex-1">{selectedAppointment.payment.phone}</p>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => copyToClipboard(selectedAppointment.payment.phone, "Telefone")}
												aria-label="Copiar telefone"
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<label className="text-sm font-medium text-muted-foreground">CPF</label>
										<div className="flex items-center justify-between gap-2">
											<p className="text-base font-semibold flex-1">{selectedAppointment.payment.cpf}</p>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => copyToClipboard(selectedAppointment.payment.cpf, "CPF")}
												aria-label="Copiar CPF"
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							)}
						</DialogContent>
					</Dialog>
				</div>
			</main>
		</div>
	);
};

export default CollaboratorMenu;


