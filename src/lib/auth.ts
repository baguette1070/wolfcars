import { sendMail } from "@/src/lib/mailer";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

interface VerificationEmailData {
  user: {
    email: string;
    name: string;
  };
  url: string;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    async sendResetPassword(data) {
      await sendMail({
        to: `${data.user.email}`,
        subject: "Réinitialisation du mot de passe",
        html: `<p><strong>Réinitialiser votre mot de passe en cliquant sur le lien ci-dessous</strong> :<br /> <a href="${data.url}">${data.url}</a></p>`,
      });
    },
    async sendVerificationEmail(data: VerificationEmailData) {
      await sendMail({
        to: `${data.user.email}`,
        subject: "Vérifiez votre adresse email",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Vérifiez votre adresse email</h2>
            <p>Bonjour ${data.user.name},</p>
            <p>Merci de vous être inscrit sur notre plateforme de location de voitures.</p>
            <p>Pour finaliser votre inscription et accéder à toutes nos fonctionnalités, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Vérifier mon email
              </a>
            </div>
            
            <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; color: #6b7280;">${data.url}</p>
            
            <p>Ce lien expirera dans 24 heures.</p>
            
            <p>Cordialement,<br>
            L&apos;équipe de location de voitures</p>
          </div>
        `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: "http://localhost:3000/api/auth/callback/google",
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});
