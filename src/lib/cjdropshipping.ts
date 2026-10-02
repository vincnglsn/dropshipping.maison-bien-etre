// Client minimal pour l'API CJdropshipping v2 (docs :
// https://developers.cjdropshipping.com/en/api/api2/api/shopping.html).
// Le token d'accès (CJ-Access-Token) est obtenu une fois par l'utilisateur
// via /authentication/getAccessToken et stocké côté serveur — jamais généré
// ni saisi par du code automatisé.

const CJ_API_BASE = "https://developers.cjdropshipping.com/api2.0";

type CjOrderProduct = {
  vid?: string;
  sku?: string;
  quantity: number;
};

type CjCreateOrderInput = {
  orderNumber: string;
  shippingCountryCode: string;
  shippingCountry: string;
  shippingProvince: string;
  shippingCity: string;
  shippingCustomerName: string;
  shippingAddress: string;
  shippingZip?: string;
  shippingPhone?: string;
  email?: string;
  fromCountryCode: string;
  logisticName: string;
  products: CjOrderProduct[];
  isSandbox: boolean;
};

type CjApiResponse<T> = {
  code: number;
  result: boolean;
  message: string;
  data: T;
  requestId: string;
};

function getAccessToken(): string {
  const token = process.env.CJ_ACCESS_TOKEN;
  if (!token) {
    throw new Error("CJ_ACCESS_TOKEN is not set");
  }
  return token;
}

async function cjRequest<T>(path: string, init?: RequestInit): Promise<CjApiResponse<T>> {
  const res = await fetch(`${CJ_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": getAccessToken(),
      ...init?.headers,
    },
  });

  const body = (await res.json()) as CjApiResponse<T>;
  if (!res.ok || body.result === false) {
    throw new Error(`CJdropshipping API error (${body.code}): ${body.message}`);
  }
  return body;
}

export async function createCjOrder(input: CjCreateOrderInput) {
  const body = {
    orderNumber: input.orderNumber,
    shippingCountryCode: input.shippingCountryCode,
    shippingCountry: input.shippingCountry,
    shippingProvince: input.shippingProvince,
    shippingCity: input.shippingCity,
    shippingCustomerName: input.shippingCustomerName,
    shippingAddress: input.shippingAddress,
    shippingZip: input.shippingZip,
    shippingPhone: input.shippingPhone,
    email: input.email,
    fromCountryCode: input.fromCountryCode,
    logisticName: input.logisticName,
    products: input.products,
    // 3 = déclarer avec l'IOSS de CJ (le paramètre de compte "Pas d'IOSS" par
    // défaut n'est apparemment pas repris automatiquement par cet endpoint).
    iossType: 3,
    iossNumber: "CJ-IOSS",
    // Une commande sandbox ne déclenche jamais de vrai paiement, de vraie
    // logistique ni de vrai débit : indispensable tant qu'on n'a pas validé
    // le flux de bout en bout.
    isSandbox: input.isSandbox ? 1 : 0,
  };

  return cjRequest<{ orderId: string; orderNum: string }>("/v1/shopping/order/createOrderV3", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
