import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { GuestRoute, ProtectedRoute } from '@/modules/auth/components/AuthGuards'
import { AuthProvider } from '@/modules/auth/hooks/useAuth'
import { LoginPage } from '@/modules/auth/pages/LoginPage'
import { AgendaPage } from '@/modules/agenda/pages/AgendaPage'
import { AssistentesPage } from '@/modules/assistentes/pages/AssistentesPage'
import { BarbeirosPage } from '@/modules/barbeiros/pages/BarbeirosPage'
import { ClientesPage } from '@/modules/clientes/pages/ClientesPage'
import { ConfiguracoesPage } from '@/modules/configuracoes/pages/ConfiguracoesPage'
import { DashboardPage } from '@/modules/dashboard/pages/DashboardPage'
import { HistoricoPage } from '@/modules/historico/pages/HistoricoPage'
import { PainelPage } from '@/modules/painel/pages/PainelPage'
import { PainelTvPage } from '@/modules/painel-tv/pages/PainelTvPage'
import { ServicosPage } from '@/modules/servicos/pages/ServicosPage'
import { AppShell } from '@/shared/layout/AppShell'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="painel-tv" element={<PainelTvPage />} />
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="assistentes" element={<AssistentesPage />} />
              <Route path="servicos" element={<ServicosPage />} />
              <Route path="painel" element={<PainelPage />} />
              <Route path="agenda" element={<AgendaPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="historico" element={<HistoricoPage />} />
              <Route path="barbeiros" element={<BarbeirosPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
