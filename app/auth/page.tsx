// app/auth/page.tsx
import AuthButtons from "@/app/auth/authButtons";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { ScrollAnimation } from "@/src/components/ui/scroll-animation";
import { getUser } from "@/src/lib/auth-session";

export default async function Auth() {
  const user = await getUser();

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Accès requis</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez être connecté pour voir votre compte.
          </p>
          <Button asChild>
            <a href="/auth/signin">Se connecter</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScrollAnimation direction="down" delay={0.5}>
      <Card className="max-w-md mx-auto mt-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Votre compte</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Gérer les paramètres et préférences de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {user.image ? (
                <img
                  alt={user.name || "user"}
                  className="h-full w-full object-cover"
                  src={user?.image}
                />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">
                {user.name || "Utilisateur"}
              </CardTitle>
              <CardDescription className="text-sm">
                {user.email || "email@example.com"}
              </CardDescription>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500">
              Détails du compte
            </h3>
            <p className="text-sm">
              <span className="text-gray-600">Email:</span>{" "}
              <span>{user.email || "email@example.com"}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Nom:</span>{" "}
              <span>{user.name || "Utilisateur"}</span>
            </p>
          </div>

          <AuthButtons />
        </CardContent>
      </Card>
    </ScrollAnimation>
  );
}
