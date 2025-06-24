import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: "ok",
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  console.log(formData);

  const newClient = await prisma.clients.create({
    data: {
      nom: String(formData.get("nom")),
      prenom: String(formData.get("prenom")),
      email: String(formData.get("email")),
    },
  });

  return NextResponse.json({
    json: newClient,
  });
}
