import { NextResponse } from "next/server";

import { getBusinessBasicDetails } from "@/lib/db/business";

export async function GET() {
  try {
    const business = getBusinessBasicDetails();

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          message: "Business not found.",
          data: null,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error("Failed to get business details:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch business details.",
        data: null,
      },
      { status: 500 },
    );
  }
}