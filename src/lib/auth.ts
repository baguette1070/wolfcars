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
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,

    async sendResetPassword(data) {
      await sendMail({
        to: `${data.user.email}`,
        subject: "Réinitialisation du mot de passe",
        html: `<p><strong>Réinitialiser votre mot de passe en cliquant sur le lien ci-dessous</strong> :<br /> <a href="${data.url}">${data.url}</a></p>`,
      });
    },

    async sendVerificationEmail(data: VerificationEmailData) {
      if (process.env.NODE_ENV === "development") {
        console.log("\n" + "=".repeat(80));
        console.log("📧 EMAIL DE VÉRIFICATION");
        console.log("=".repeat(80));
        console.log(`Pour: ${data.user.email}`);
        console.log(`Nom: ${data.user.name}`);
        console.log(`\n🔗 Lien de vérification:\n${data.url}\n`);
        console.log("=".repeat(80) + "\n");
      }

      try {
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
      } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email:", error);
      }
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});
