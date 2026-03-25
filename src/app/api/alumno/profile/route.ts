import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });
  return dbUser;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    photo: user.photo,
    bio: user.bio,
    city: user.city,
    province: user.province,
    country: user.country,
    linkedinUrl: user.linkedinUrl,
    instagramUrl: user.instagramUrl,
    yearsExperience: user.yearsExperience,
    specialty: user.specialty,
    motivation: user.motivation,
    // Billing
    fiscalName: user.fiscalName,
    nifCif: user.nifCif,
    businessType: user.businessType,
    companyName: user.companyName,
    fiscalAddress: user.fiscalAddress,
    fiscalCity: user.fiscalCity,
    fiscalProvince: user.fiscalProvince,
    fiscalPostalCode: user.fiscalPostalCode,
    fiscalCountry: user.fiscalCountry,
    irpfApplies: user.irpfApplies,
    // Shipping
    shippingName: user.shippingName,
    shippingAddress: user.shippingAddress,
    shippingCity: user.shippingCity,
    shippingProvince: user.shippingProvince,
    shippingPostalCode: user.shippingPostalCode,
    shippingCountry: user.shippingCountry,
  });
}

export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: body.firstName || user.firstName,
        lastName: body.lastName || user.lastName,
        phone: body.phone ?? user.phone,
        birthDate: body.birthDate ? new Date(body.birthDate) : user.birthDate,
        photo: body.photo ?? user.photo,
        bio: body.bio ?? user.bio,
        city: body.city ?? user.city,
        province: body.province ?? user.province,
        country: body.country ?? user.country,
        linkedinUrl: body.linkedinUrl ?? user.linkedinUrl,
        instagramUrl: body.instagramUrl ?? user.instagramUrl,
        yearsExperience:
          body.yearsExperience !== undefined && body.yearsExperience !== null
            ? parseInt(String(body.yearsExperience))
            : user.yearsExperience,
        specialty: body.specialty ?? user.specialty,
        motivation: body.motivation ?? user.motivation,
        // Billing
        fiscalName: body.fiscalName ?? user.fiscalName,
        nifCif: body.nifCif ?? user.nifCif,
        businessType: body.businessType || user.businessType,
        companyName: body.companyName ?? user.companyName,
        fiscalAddress: body.fiscalAddress ?? user.fiscalAddress,
        fiscalCity: body.fiscalCity ?? user.fiscalCity,
        fiscalProvince: body.fiscalProvince ?? user.fiscalProvince,
        fiscalPostalCode: body.fiscalPostalCode ?? user.fiscalPostalCode,
        fiscalCountry: body.fiscalCountry ?? user.fiscalCountry,
        irpfApplies: body.irpfApplies !== undefined ? body.irpfApplies : user.irpfApplies,
        // Shipping
        shippingName: body.shippingName ?? user.shippingName,
        shippingAddress: body.shippingAddress ?? user.shippingAddress,
        shippingCity: body.shippingCity ?? user.shippingCity,
        shippingProvince: body.shippingProvince ?? user.shippingProvince,
        shippingPostalCode: body.shippingPostalCode ?? user.shippingPostalCode,
        shippingCountry: body.shippingCountry ?? user.shippingCountry,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 }
    );
  }
}
