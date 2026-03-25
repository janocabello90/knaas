import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

async function getAuthAlumno() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    include: {
      clinics: true,
      enrollments: {
        include: {
          cohort: {
            select: {
              id: true,
              name: true,
              program: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      },
      payments: {
        select: {
          id: true,
          baseAmount: true,
          ivaRate: true,
          ivaAmount: true,
          totalAmount: true,
          currency: true,
          type: true,
          method: true,
          status: true,
          installmentNumber: true,
          totalInstallments: true,
          invoiceNumber: true,
          paidAt: true,
          createdAt: true,
          cohort: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return dbUser;
}

// GET — Full profile, clinic, billing, enrollments, payments
export async function GET() {
  try {
    const user = await getAuthAlumno();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clinic = user.clinics[0] || null;

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        photo: user.photo,
        bio: user.bio,
        phone: user.phone,
        birthDate: user.birthDate,
        city: user.city,
        province: user.province,
        country: user.country,
        linkedinUrl: user.linkedinUrl,
        instagramUrl: user.instagramUrl,
        yearsExperience: user.yearsExperience,
        specialty: user.specialty,
        motivation: user.motivation,
      },
      clinic: clinic
        ? {
            id: clinic.id,
            name: clinic.name,
            address: clinic.address,
            phone: clinic.phone,
            email: clinic.email,
            model: clinic.model,
            cyclePhase: clinic.cyclePhase,
            teamCount: clinic.teamCount,
            services: clinic.services,
            channels: clinic.channels,
          }
        : null,
      billing: {
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
      },
      shipping: {
        shippingName: user.shippingName,
        shippingAddress: user.shippingAddress,
        shippingCity: user.shippingCity,
        shippingProvince: user.shippingProvince,
        shippingPostalCode: user.shippingPostalCode,
        shippingCountry: user.shippingCountry,
      },
      enrollments: user.enrollments.map((e) => ({
        id: e.id,
        subscriptionType: e.subscriptionType,
        status: e.status,
        enrolledAt: e.enrolledAt,
        cohort: e.cohort,
      })),
      payments: user.payments,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : "";
    console.error("GET /api/alumno/ajustes error:", errMsg);
    console.error("GET /api/alumno/ajustes stack:", errStack);
    return NextResponse.json({ error: `Error al cargar datos: ${errMsg}` }, { status: 500 });
  }
}

// PUT — Update profile, clinic, or billing
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthAlumno();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { section, data } = body;

    if (!section || !data) {
      return NextResponse.json(
        { error: "Faltan campos (section, data)" },
        { status: 400 }
      );
    }

    switch (section) {
      case "profile":
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: data.firstName ?? undefined,
            lastName: data.lastName ?? undefined,
            phone: data.phone ?? undefined,
            bio: data.bio ?? undefined,
            city: data.city ?? undefined,
            province: data.province ?? undefined,
            country: data.country ?? undefined,
            linkedinUrl: data.linkedinUrl ?? undefined,
            instagramUrl: data.instagramUrl ?? undefined,
            yearsExperience: data.yearsExperience != null ? parseInt(data.yearsExperience) : undefined,
            specialty: data.specialty ?? undefined,
            motivation: data.motivation ?? undefined,
          },
        });
        break;

      case "clinic": {
        const clinic = user.clinics[0];
        if (clinic) {
          await prisma.clinic.update({
            where: { id: clinic.id },
            data: {
              name: data.name ?? undefined,
              address: data.address ?? undefined,
              phone: data.phone ?? undefined,
              email: data.email ?? undefined,
              model: data.model ?? undefined,
              cyclePhase: data.cyclePhase ?? undefined,
              teamCount: data.teamCount != null ? parseInt(data.teamCount) : undefined,
            },
          });
        } else {
          await prisma.clinic.create({
            data: {
              userId: user.id,
              name: data.name || "Mi Clínica",
              address: data.address || null,
              phone: data.phone || null,
              email: data.email || null,
              model: data.model || null,
              cyclePhase: data.cyclePhase || null,
              teamCount: data.teamCount ? parseInt(data.teamCount) : 1,
            },
          });
        }
        break;
      }

      case "billing":
        await prisma.user.update({
          where: { id: user.id },
          data: {
            fiscalName: data.fiscalName ?? undefined,
            nifCif: data.nifCif ?? undefined,
            businessType: data.businessType ?? undefined,
            companyName: data.companyName ?? undefined,
            fiscalAddress: data.fiscalAddress ?? undefined,
            fiscalCity: data.fiscalCity ?? undefined,
            fiscalProvince: data.fiscalProvince ?? undefined,
            fiscalPostalCode: data.fiscalPostalCode ?? undefined,
            fiscalCountry: data.fiscalCountry ?? undefined,
            irpfApplies: data.irpfApplies ?? undefined,
          },
        });
        break;

      case "shipping":
        await prisma.user.update({
          where: { id: user.id },
          data: {
            shippingName: data.shippingName ?? undefined,
            shippingAddress: data.shippingAddress ?? undefined,
            shippingCity: data.shippingCity ?? undefined,
            shippingProvince: data.shippingProvince ?? undefined,
            shippingPostalCode: data.shippingPostalCode ?? undefined,
            shippingCountry: data.shippingCountry ?? undefined,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Sección no válida" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/alumno/ajustes error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
