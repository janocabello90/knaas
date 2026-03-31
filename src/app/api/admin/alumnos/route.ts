import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { StepStatus } from '@prisma/client';
import crypto from 'crypto';

interface CreateAlumnoRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  clinicName: string;
  cohortId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the current user from cookies
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify user is SUPERADMIN in Prisma
    const currentUser = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
    });

    if (!currentUser || currentUser.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No tienes permisos para esta acción' }, { status: 401 });
    }

    // Parse request body
    const body: CreateAlumnoRequest = await request.json();

    // Validate required fields
    if (!body.firstName?.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!body.lastName?.trim()) {
      return NextResponse.json({ error: 'El apellido es requerido' }, { status: 400 });
    }
    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
    }
    if (!body.clinicName?.trim()) {
      return NextResponse.json({ error: 'El nombre de la clínica es requerido' }, { status: 400 });
    }
    if (!body.cohortId?.trim()) {
      return NextResponse.json({ error: 'El cohortId es requerido' }, { status: 400 });
    }

    // Verify cohort exists
    const cohort = await prisma.cohort.findUnique({
      where: { id: body.cohortId },
    });

    if (!cohort) {
      return NextResponse.json({ error: 'La cohorte no existe' }, { status: 400 });
    }

    // Create Supabase auth user with temporary password
    const tempPassword = crypto.randomUUID();
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json(
        { error: 'Error al crear usuario de autenticación' },
        { status: 400 }
      );
    }

    const supabaseAuthId = authData.user.id;

    // Create User record in Prisma
    const user = await prisma.user.create({
      data: {
        supabaseAuthId,
        email: body.email,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: body.phone?.trim() || null,
        role: 'ALUMNO',
      },
    });

    // Create Clinic record
    const clinic = await prisma.clinic.create({
      data: {
        userId: user.id,
        name: body.clinicName.trim(),
      },
    });

    // Create Enrollment with ACTIVE status
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        cohortId: body.cohortId,
        status: 'ACTIVE',
      },
    });

    // Create 14 StepProgress records (steps 0-13, step 0 as AVAILABLE, rest as LOCKED)
    const stepProgressRecords = Array.from({ length: 14 }, (_, i) => ({
      enrollmentId: enrollment.id,
      stepNumber: i,
      status: (i === 0 ? 'AVAILABLE' : 'LOCKED') as StepStatus,
    }));

    await prisma.stepProgress.createMany({
      data: stepProgressRecords,
    });

    // Return created user
    return NextResponse.json(
      {
        id: user.id,
        supabaseAuthId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        clinic: clinic,
        enrollment: {
          id: enrollment.id,
          cohortId: enrollment.cohortId,
          status: enrollment.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/alumnos error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
