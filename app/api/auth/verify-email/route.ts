import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token de vérification requis" },
        { status: 400 }
      );
    }

    // Utiliser l'API de better-auth pour vérifier l'email
    const response = await auth.handler(
      new Request(request.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verifyEmail",
          token: token,
        }),
      })
    );

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Email vérifié avec succès",
      });
    } else {
      const data = await response.json();
      return NextResponse.json(
        { error: data.error || "Erreur lors de la vérification" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la vérification d'email:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
