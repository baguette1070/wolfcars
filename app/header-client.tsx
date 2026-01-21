"use client";

import { Button } from "@/src/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/src/components/ui/navigation-menu";
import { cn } from "@/src/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "./auth/actions";

interface HeaderClientProps {
  user: {
    email: string;
  } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
  return (
    <header className="sticky border-b p-4 top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="ml-10">
          <h1 className="text-2xl font-bold font-serif">WOLFCARS</h1>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-10 md:justify-end">
          <nav className="flex items-center space-x-2">
            <Link href="/" className="">
              <Button
                variant="ghost"
                className={cn("text-sm font-medium cursor-pointer")}
              >
                Accueil
              </Button>
            </Link>
            <Link href="/dashboard/cars">
              <Button
                variant="ghost"
                className={cn("text-sm font-medium cursor-pointer")}
              >
                Nos voitures
              </Button>
            </Link>

            {user ? (
              <>
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="text-sm font-medium cursor-pointer">
                        Réserver
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[200px] gap-1 p-2">
                          <NavigationMenuLink asChild>
                            <Link
                              href="/dashboard/cars/e421dd5a-ed6b-49fd-9279-9068d1a1291c/reservation"
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">
                                Audi RS3
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                RS3 2025 Facelift
                              </p>
                            </Link>
                          </NavigationMenuLink>
                          <NavigationMenuLink asChild>
                            <Link
                              href="/dashboard/cars/e7cddf33-0de4-427d-b0bc-57bdcc1ac680/reservation"
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">
                                Volkswagen Golf 8
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                Golf 8 GTI 2020
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
                <Link href="/dashboard/my-rentals">
                  <Button
                    variant="ghost"
                    className={cn("text-sm font-medium cursor-pointer")}
                  >
                    Vos locations
                  </Button>
                </Link>
                {user.email === "lamrininawfal11@gmail.com" && (
                  <Link href="/admin/reservations">
                    <Button
                      variant="ghost"
                      className={cn(
                        "text-sm font-medium cursor-pointer text-blue-600 hover:text-blue-700",
                      )}
                    >
                      Voir réservations
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <Button
                  onClick={async () => {
                    await signOut();
                    toast.success("Déconnexion réussie");
                  }}
                  variant="outline"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
                  )}
                >
                  Se déconnecter
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">
                  <Button
                    variant="outline"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary cursor-pointer",
                    )}
                  >
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button
                    variant="default"
                    className={cn("text-sm font-medium")}
                  >
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
