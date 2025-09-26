import prisma from './prisma';

export async function requireAdmin(request) {
  // Ambil email user dari header (frontend harus mengirim x-user-email)
  const email = request.headers.get('x-user-email');
  if (!email) return false;
  const priv = await prisma.user_privileges.findFirst({
    where: { user_email: email, privilege: 'admin', is_active: true }
  });
  return !!priv;
}
