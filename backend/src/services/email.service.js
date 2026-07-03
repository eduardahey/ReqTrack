import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'ReqTrack <onboarding@resend.dev>'

export async function sendPasswordResetCode(toEmail, code) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Seu código de recuperação de senha — ReqTrack',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #191c1e; margin-bottom: 8px;">Recuperação de senha</h2>
        <p style="color: #45464d; font-size: 14px; line-height: 1.5;">
          Use o código abaixo para redefinir sua senha no ReqTrack. Ele expira em 10 minutos.
        </p>
        <div style="background: #f2f4f6; border: 1px solid #c6c6cd; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #191c1e; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #76777d; font-size: 12px;">
          Se você não solicitou essa recuperação, pode ignorar este e-mail.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw new Error('Falha ao enviar e-mail de recuperação')
  }

  return data
}

export async function sendWorkspaceInviteCode(toEmail, workspaceName, code) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Convite para o workspace ${workspaceName} — ReqTrack`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #191c1e; margin-bottom: 8px;">Você foi convidado(a)</h2>
        <p style="color: #45464d; font-size: 14px; line-height: 1.5;">
          Você foi convidado(a) para participar do workspace <strong>${workspaceName}</strong> no ReqTrack.
          Use o código abaixo na página de aceitar convite para criar sua conta. Ele expira em 30 minutos.
        </p>
        <div style="background: #f2f4f6; border: 1px solid #c6c6cd; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #191c1e; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #76777d; font-size: 12px;">
          Se você não esperava este convite, pode ignorar este e-mail.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw new Error('Falha ao enviar e-mail de convite')
  }

  return data
}

export async function sendWorkspaceAddedNotification(toEmail, workspaceName, role) {
  const roleLabel = role === 'ADMIN' ? 'administrador' : 'membro'
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `Você foi adicionado(a) ao workspace ${workspaceName} — ReqTrack`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #191c1e; margin-bottom: 8px;">Novo workspace disponível</h2>
        <p style="color: #45464d; font-size: 14px; line-height: 1.5;">
          Você foi adicionado(a) como <strong>${roleLabel}</strong> no workspace <strong>${workspaceName}</strong> no ReqTrack.
          Faça login com sua conta existente para acessá-lo.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw new Error('Falha ao enviar e-mail de notificação')
  }

  return data
}

export async function sendEmailVerificationCode(toEmail, code) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Confirme seu e-mail — ReqTrack',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #191c1e; margin-bottom: 8px;">Confirme seu e-mail</h2>
        <p style="color: #45464d; font-size: 14px; line-height: 1.5;">
          Use o código abaixo para confirmar seu e-mail e ativar seu workspace no ReqTrack. Ele expira em 10 minutos.
        </p>
        <div style="background: #f2f4f6; border: 1px solid #c6c6cd; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #191c1e; font-family: monospace;">
            ${code}
          </span>
        </div>
        <p style="color: #76777d; font-size: 12px;">
          Se você não criou essa conta, pode ignorar este e-mail.
        </p>
      </div>
    `,
  })

  if (error) {
    console.error('Erro ao enviar e-mail:', error)
    throw new Error('Falha ao enviar e-mail de verificação')
  }

  return data
}