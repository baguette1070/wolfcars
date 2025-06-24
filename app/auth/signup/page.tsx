"use client";

import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Loader2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../src/components/ui/card";
import { Input } from "../../../src/components/ui/input";
import { Label } from "../../../src/components/ui/label";

export default function SignUp() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {errorMessage === "" ? (
          ""
        ) : (
          <Alert variant="destructive" className="max-w-md mx-auto mt-8 mb-4">
            <AlertTitle>{errorMessage}</AlertTitle>
            <AlertDescription>Connectez-vous</AlertDescription>
          </Alert>
        )}

        <Card className="z-50 rounded-md rounded-t-none max-w-md">
          <CardHeader className="space-y-4">
            <CardTitle className="text-lg md:text-xl">
              S&apos;inscrire
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Entrez vos informations pour créer un compte.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-3">
                <Label htmlFor="first-name">Prénom</Label>
                <Input
                  id="first-name"
                  placeholder="Max"
                  required
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                  value={firstName}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="last-name">Nom</Label>
                <Input
                  id="last-name"
                  placeholder="Robinson"
                  required
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                  value={lastName}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@exemple.com"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                value={email}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+32 4XX XX XX XX"
                onChange={(e) => {
                  setPhone(e.target.value);
                }}
                value={phone}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Mot de passe"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Confirmer le mot de passe</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
                placeholder="Confirmer le mot de passe"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="image">Image du profil (optionnelle)</Label>
              <div className="flex items-end gap-4">
                {imagePreview && (
                  <div className="relative w-16 h-16 rounded-sm overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Profile preview"
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 w-full">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full"
                  />
                  {imagePreview && (
                    <X
                      className="cursor-pointer"
                      onClick={() => {
                        setImage(null);
                        setImagePreview(null);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={loading}
              onClick={async () => {
                if (password !== passwordConfirmation) {
                  setErrorMessage("Les mots de passe ne correspondent pas");
                  return;
                }

                setLoading(true);
                try {
                  const response = await fetch("/api/auth/signup", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email,
                      password,
                      name: `${firstName} ${lastName}`,
                      phone: phone || null,
                      image: image ? await convertImageToBase64(image) : null,
                    }),
                  });

                  const data = await response.json();

                  if (response.ok) {
                    toast.success("Compte créé avec succès !.");
                    router.push("/auth/sign");
                  } else {
                    setErrorMessage(
                      data.error || "Erreur lors de la création du compte"
                    );
                  }
                } catch {
                  setErrorMessage("Erreur lors de la création du compte");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Créer un compte"
              )}
            </Button>
          </CardContent>
          <CardFooter>
            <div className="flex justify-center w-full border-t py-6">
              <p className="text-center text-xs text-neutral-500">
                <Link href={"/auth/signin"}>
                  {" "}
                  <span className="text-neutral-500 underline">
                    Se connecter
                  </span>
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

async function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
