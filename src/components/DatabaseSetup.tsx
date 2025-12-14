import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { seedDatabase, clearDatabase } from '@/lib/seedDatabase';
import { supabase } from '@/lib/supabase';

export const DatabaseSetup = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

    // Check connection on mount
    useState(() => {
        checkConnection();
    });

    const checkConnection = async () => {
        try {
            const { error } = await supabase.from('barbershops').select('count').limit(1);
            setConnectionStatus(error ? 'error' : 'connected');
        } catch (error) {
            setConnectionStatus('error');
        }
    };

    const handleSeed = async () => {
        setLoading(true);
        setResult(null);

        try {
            const result = await seedDatabase();
            setResult(result);
        } catch (error) {
            setResult({ success: false, error });
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm('⚠️ ATENÇÃO: Isso irá deletar TODOS os dados do banco. Tem certeza?')) {
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            await clearDatabase();
            setResult({ success: true, message: 'Banco de dados limpo com sucesso!' });
        } catch (error) {
            setResult({ success: false, error });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-6 w-6" />
                        Configuração do Banco de Dados
                    </CardTitle>
                    <CardDescription>
                        Gerencie a população e limpeza do banco de dados Supabase
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Connection Status */}
                    <div className="flex items-center gap-2 p-4 border rounded-lg">
                        {connectionStatus === 'checking' && (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                <span>Verificando conexão...</span>
                            </>
                        )}
                        {connectionStatus === 'connected' && (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span className="text-green-700">Conectado ao Supabase</span>
                            </>
                        )}
                        {connectionStatus === 'error' && (
                            <>
                                <XCircle className="h-5 w-5 text-red-500" />
                                <span className="text-red-700">Erro de conexão - Verifique as credenciais</span>
                            </>
                        )}
                    </div>

                    {/* Instructions */}
                    <Alert>
                        <AlertDescription>
                            <strong>Antes de popular o banco:</strong>
                            <ol className="list-decimal list-inside mt-2 space-y-1">
                                <li>Execute a migração <code>001_create_schema.sql</code> no SQL Editor do Supabase</li>
                                <li>Verifique se todas as tabelas foram criadas corretamente</li>
                                <li>Clique em "Popular Banco" para inserir dados de exemplo</li>
                            </ol>
                        </AlertDescription>
                    </Alert>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSeed}
                            disabled={loading || connectionStatus !== 'connected'}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Populando...
                                </>
                            ) : (
                                <>
                                    <Database className="mr-2 h-4 w-4" />
                                    Popular Banco
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleClear}
                            disabled={loading || connectionStatus !== 'connected'}
                            variant="destructive"
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Limpando...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Limpar Banco
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Result */}
                    {result && (
                        <Alert variant={result.success ? 'default' : 'destructive'}>
                            <AlertDescription>
                                {result.success ? (
                                    <div className="space-y-2">
                                        <p className="font-semibold">✅ Sucesso!</p>
                                        {result.counts && (
                                            <div className="text-sm">
                                                <p>Dados inseridos:</p>
                                                <ul className="list-disc list-inside ml-4">
                                                    <li>Barbearias: {result.counts.barbershops}</li>
                                                    <li>Serviços: {result.counts.services}</li>
                                                    <li>Colaboradores: {result.counts.collaborators}</li>
                                                    <li>Produtos: {result.counts.products}</li>
                                                    <li>Membros VIP: {result.counts.vips}</li>
                                                </ul>
                                            </div>
                                        )}
                                        {result.message && <p>{result.message}</p>}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-semibold">❌ Erro</p>
                                        <pre className="mt-2 text-xs overflow-auto">
                                            {JSON.stringify(result.error, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* SQL Migration Instructions */}
                    <div className="border-t pt-6">
                        <h3 className="font-semibold mb-2">📝 Instruções para Migração SQL</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Acesse o Supabase Dashboard → SQL Editor</li>
                            <li>Abra o arquivo <code>migrations/001_create_schema.sql</code></li>
                            <li>Copie todo o conteúdo e cole no SQL Editor</li>
                            <li>Clique em "Run" para executar a migração</li>
                            <li>Aguarde a confirmação de sucesso</li>
                            <li>Volte aqui e clique em "Popular Banco"</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
