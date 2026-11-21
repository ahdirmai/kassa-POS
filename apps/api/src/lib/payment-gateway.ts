import crypto from "node:crypto";
import { env } from "../config/env.js";

export interface CreateQrisInput {
  orderId: string;
  grossAmount: number;
  customerName?: string;
}

export interface CreateQrisResult {
  provider: string;
  referenceNo: string;
  qrString: string;
  expiresAt: string;
}

export interface PaymentGatewayAdapter {
  readonly provider: string;
  createQris(input: CreateQrisInput): Promise<CreateQrisResult>;
  verifyWebhookSignature(payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean;
}

class MidtransQrisAdapter implements PaymentGatewayAdapter {
  readonly provider = "midtrans";

  async createQris(input: CreateQrisInput): Promise<CreateQrisResult> {
    const referenceNo = `QRIS-${input.orderId}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    if (env.MIDTRANS_MODE === "mock") {
      // QRIS EMVCo-style mock string untuk pengujian lokal & sandbox
      const qrString = `00020101021226610014COM.MIDTRANS.WWW01189360091431234567890215ID2026SENJAPOS0303UMI520458125303360540${String(
        input.grossAmount,
      ).length}${input.grossAmount}5802ID5917KOPI DAPUR SENJA6007JAKARTA62200516${referenceNo}6304MOCK`;
      return {
        provider: this.provider,
        referenceNo,
        qrString,
        expiresAt,
      };
    }

    // Real Midtrans Core API v2 /charge (qris)
    const auth = Buffer.from(`${env.MIDTRANS_SERVER_KEY}:`).toString("base64");
    const resp = await fetch(`${env.MIDTRANS_API_URL}/v2/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        payment_type: "qris",
        transaction_details: {
          order_id: referenceNo,
          gross_amount: input.grossAmount,
        },
        qris: { acquirer: "gopay" },
      }),
    });

    if (!resp.ok) {
      throw new Error(`Midtrans charge failed: ${resp.status}`);
    }
    const json = (await resp.json()) as {
      qr_string?: string;
      actions?: Array<{ name: string; url: string }>;
    };
    const qrString = json.qr_string ?? json.actions?.[0]?.url ?? referenceNo;
    return {
      provider: this.provider,
      referenceNo,
      qrString,
      expiresAt,
    };
  }

  verifyWebhookSignature(payload: {
    order_id: string;
    status_code: string;
    gross_amount: string;
    signature_key: string;
  }): boolean {
    if (env.MIDTRANS_MODE === "mock" && payload.signature_key === "MOCK_VALID") {
      return true;
    }
    const expected = crypto
      .createHash("sha512")
      .update(`${payload.order_id}${payload.status_code}${payload.gross_amount}${env.MIDTRANS_SERVER_KEY}`)
      .digest("hex");
    return expected === payload.signature_key;
  }
}

export const paymentGateway: PaymentGatewayAdapter = new MidtransQrisAdapter();
