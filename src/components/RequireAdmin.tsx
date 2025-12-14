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
				const { data, error } = await supabase
					.from('profiles')
					.select('is_admin')
					.eq('id', user.id)
					.single();

				if (error) {
					console.error('Erro ao verificar admin:', error);
					setIsAdmin(false);
				} else {
					setIsAdmin(data?.is_admin === true);
				}
			} catch (error) {
				console.error('Erro ao verificar admin:', error);
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


