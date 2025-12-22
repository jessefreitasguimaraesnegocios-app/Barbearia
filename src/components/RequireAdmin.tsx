import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type Props = {
	children: ReactNode;
};

const RequireAdmin = ({ children }: Props) => {
	const location = useLocation();
	const { user, loading } = useAuthContext();
	const [isAdmin, setIsAdmin] = useState(false);
	const [checkingAdmin, setCheckingAdmin] = useState(true);

	useEffect(() => {
		const checkAdmin = async () => {
			if (loading || !user) {
				setCheckingAdmin(false);
				setIsAdmin(false);
				return;
			}

			try {
				// Consulta direta - a nova RLS policy permite ler próprio profile
				const { data, error } = await supabase
					.from('profiles')
					.select('is_admin')
					.eq('id', user.id)
					.single();

				if (error) {
					// Se erro for de permissão (RLS) ou não encontrado, não é admin
					if (error.code === 'PGRST116' || error.code === '42501') {
						// Profile não existe ou sem permissão
						console.warn('Profile não encontrado ou sem permissão:', error.message);
						setIsAdmin(false);
					} else {
						console.error('Erro ao verificar admin:', error);
						setIsAdmin(false);
					}
				} else {
					// Verificar se is_admin é true
					setIsAdmin(data?.is_admin === true);
				}
			} catch (error: any) {
				console.error('Erro ao verificar admin:', error);
				// Em caso de erro inesperado, não é admin
				setIsAdmin(false);
			} finally {
				setCheckingAdmin(false);
			}
		};

		checkAdmin();
	}, [user, loading]);

	if (loading || checkingAdmin) {
		return <div>Carregando...</div>;
	}

	if (!user || !isAdmin) {
		return <Navigate to="/" replace state={{ from: location }} />;
	}

	return <>{children}</>;
};

export default RequireAdmin;


