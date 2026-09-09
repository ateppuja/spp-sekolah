import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    let settings = await prisma.schoolSetting.findFirst();
    if (!settings) {
      settings = await prisma.schoolSetting.create({
        data: {
          schoolName: "White Bee School of Life",
          schoolNpsn: "20104567",
          schoolAddress: "Jl. Taman White Bee No. 12, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12150",
          schoolPhone: "021-78901234",
          schoolEmail: "info@whitebee.sch.id",
          schoolLogo: "/logo.png",
          principalName: "Drs. H. Bambang Suhartono, M.Pd",
          treasurerName: "Siti Rahmawati, S.E",
        },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil pengaturan sekolah." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth(req, ["ADMIN"]);
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const {
      schoolName,
      schoolNpsn,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      schoolLogo,
      principalName,
      treasurerName,
      paymentGatewayConfig,
    } = body;

    let settings = await prisma.schoolSetting.findFirst();
    const existing = settings;

    if (!settings) {
      settings = await prisma.schoolSetting.create({
        data: {
          schoolName: schoolName || "White Bee School of Life",
          schoolNpsn: schoolNpsn || "20104567",
          schoolAddress: schoolAddress || "Jl. Taman White Bee No. 12, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12150",
          schoolPhone: schoolPhone || "021-78901234",
          schoolEmail: schoolEmail || "info@whitebee.sch.id",
          schoolLogo: schoolLogo || "/logo.png",
          principalName: principalName || "",
          treasurerName: treasurerName || "",
          paymentGatewayConfig: paymentGatewayConfig ? JSON.stringify(paymentGatewayConfig) : null,
        },
      });
    } else {
      settings = await prisma.schoolSetting.update({
        where: { id: settings.id },
        data: {
          schoolName: schoolName ?? settings.schoolName,
          schoolNpsn: schoolNpsn ?? settings.schoolNpsn,
          schoolAddress: schoolAddress ?? settings.schoolAddress,
          schoolPhone: schoolPhone ?? settings.schoolPhone,
          schoolEmail: schoolEmail ?? settings.schoolEmail,
          schoolLogo: schoolLogo !== undefined ? schoolLogo : settings.schoolLogo,
          principalName: principalName ?? settings.principalName,
          treasurerName: treasurerName ?? settings.treasurerName,
          paymentGatewayConfig: paymentGatewayConfig
            ? JSON.stringify(paymentGatewayConfig)
            : settings.paymentGatewayConfig,
        },
      });
    }

    await logAudit({
      userId: auth.user.id,
      action: "UPDATE_SETTINGS",
      entityType: "SchoolSetting",
      entityId: settings.id,
      beforeData: existing,
      afterData: settings,
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan sekolah berhasil disimpan.",
      data: settings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan pengaturan sekolah." },
      { status: 500 }
    );
  }
}
