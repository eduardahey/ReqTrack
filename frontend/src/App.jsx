import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import WorkspaceSelectorPage from './pages/WorkspaceSelectorPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyCodePage from './pages/VerifyCodePage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import RequirementsPage from './pages/RequirementsPage'
import RequirementDetailPage from './pages/RequirementDetailPage'
import UserStoriesPage from './pages/UserStoriesPage'
import UserStoryDetailPage from './pages/UserStoryDetailPage'
import StakeholdersPage from './pages/StakeholdersPage'
import MeetingsPage from './pages/MeetingsPage'
import SettingsPage from './pages/SettingsPage'
import AcceptInvitePage from './pages/AcceptInvitePage'


function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Carregando...</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password/verify" element={<VerifyCodePage />} />
          <Route path="/forgot-password/reset" element={<ResetPasswordPage />} />
          <Route path="/workspaces" element={<PrivateRoute><WorkspaceSelectorPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/stakeholders" element={<PrivateRoute><StakeholdersPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/requirements" element={<PrivateRoute><RequirementsPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/requirements/:requirementId" element={<PrivateRoute><RequirementDetailPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/user-stories" element={<PrivateRoute><UserStoriesPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/user-stories/:storyId" element={<PrivateRoute><UserStoryDetailPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/meetings" element={<PrivateRoute><MeetingsPage /></PrivateRoute>} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
