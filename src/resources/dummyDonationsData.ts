import { PaymentRepo } from "../repos/paymentRepo";

export interface DonationDataType {
  title: string;
  firstName: string;
  lastName: string;
  house: string;
  postcode: string;
  aggregatedDonations: string;
  sponsoredEvent: boolean;
  createdAt: Date;
  amount: number;
}

/**
 * Fetches and maps live payment data into donation format.
 * If no data exists, returns one dummy record.
 */
export async function loadDonationsData(
  startDate?: string,
  endDate?: string
): Promise<DonationDataType[]> {
  const payments = await PaymentRepo.getAllSuccessfulPayments(
    startDate,
    endDate
  );
  console.log("Payments: ", payments);
  if (!payments || payments.length === 0) {
    // Return fallback dummy record
    return [
      {
        title: "Mr",
        firstName: "John",
        lastName: "Smith",
        house: "123 Main Street",
        postcode: "SW1A 1AA",
        aggregatedDonations: "Yes",
        sponsoredEvent: true,
        createdAt: new Date("2024-01-15"),
        amount: 150.0,
      },
    ];
  }

  // Map real DB payments into Excel-ready format
  return payments.map((p) => ({
    title: p.title || "",
    firstName: p.firstName || "",
    lastName: p.lastName || "",
    house: p.addressLine1 || "",
    postcode: p.postCode || "",
    aggregatedDonations: p.giftAid === "Yes" ? "Yes" : "No",
    sponsoredEvent: false,
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    country: p.country || "",
    amount: p.amount || 0,
  }));
}
