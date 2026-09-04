import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import UserPlan from './UserPlan';

// Página própria do documento do aluno (UsuarioDetalhe.dc.html, "Ver plano" ->
// href pra uma tela separada). Extraído de UserDetail.jsx pra seguir o padrão
// do mockup (documento embutido rolava até uma âncora na mesma tela; o design
// novo manda pra uma rota própria) -- ver [[project_userdetail_design_gaps_product_decisions]]
// e a análise trazida antes de implementar (2026-08-25).
//
// UserPlan aqui é SOMENTE LEITURA -- o documento não é o editor. "Editar" mora
// no card "Plano Ativo" de UserDetail.jsx (2026-09-04, junto de "Ver plano"/
// "Trocar", como o mockup organiza) e manda pro construtor real
// (TrainingPlanCreator/MealPlanCreator) carregado com o plano DESTE aluno --
// não existe mais botão de editar flutuante nesta página, sobreposto ao
// documento (removido na mesma mudança, por ser exatamente o "editar em cima
// do documento" que a decisão de 2026-08-25 já tinha descartado).
export default function UserPlanPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [planPayload, setPlanPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const printTriggeredRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [userRes, planRes] = await Promise.all([
          supabase.functions.invoke('ybytu-admin-users', { body: { id } }),
          supabase.functions.invoke('ybytu-get-plan-for-staff', { body: { userId: id } })
        ]);
        if (userRes.error) throw userRes.error;
        if (isMounted) {
          const name = userRes.data?.profile?.full_name || '';
          if (name) document.title = `Plano — ${name}`;
          if (planRes.data && !planRes.error) setPlanPayload(planRes.data);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (id) fetchData();
    return () => { isMounted = false; };
  }, [id]);

  // Mesmo fluxo de ?print=1 que existia embutido em UserDetail.jsx --
  // movido pra cá porque o documento saiu de lá.
  useEffect(() => {
    if (searchParams.get('print') === '1' && planPayload && !printTriggeredRef.current) {
      printTriggeredRef.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [searchParams, planPayload]);

  if (isLoading) {
    return <main style={{ padding: '40px', textAlign: 'center' }}><p>Carregando plano...</p></main>;
  }
  if (error) {
    return <main style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}><p>Erro: {error}</p></main>;
  }
  if (!planPayload) {
    return (
      <main style={{ padding: '40px', textAlign: 'center' }}>
        <p>Este usuário ainda não possui planos gerados.</p>
        <button onClick={() => navigate(`/users/${id}`)} style={{ marginTop: '12px', padding: '10px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>Voltar ao perfil</button>
      </main>
    );
  }

  // UserPlan (não-embedded) já desenha sua própria toolbar fixa no canto
  // superior DIREITO (Salvar PDF) -- por isso os controles desta página
  // ficam à ESQUERDA, pra não sobrepor.
  return (
    <>
      <div style={{ position: 'fixed', top: '18px', left: '18px', zIndex: 50, display: 'flex', alignItems: 'center', gap: '9px' }} className="screen-only">
        <button onClick={() => navigate(`/users/${id}`)} title="Voltar ao perfil" style={{ display: 'inline-flex', width: '40px', height: '40px', borderRadius: '11px', border: 'none', background: 'var(--brand)', color: '#fff', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 18px rgba(245,95,22,.35)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
        </button>
      </div>
      <main className="yb-plan-main" style={{ flex: 1, overflowY: 'auto' }}>
        <UserPlan payload={planPayload} />
      </main>
    </>
  );
}
