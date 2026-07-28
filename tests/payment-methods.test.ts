import assert from "node:assert/strict";
import test from "node:test";
import {
  paymentMethodAvailability,
  paymentMethodsFromSettings,
  validatePaymentSetting,
} from "../lib/payment-methods.ts";

test("payment methods respect configured display order and metadata", () => {
  const methods = paymentMethodsFromSettings({
    enable_cod: "true",
    enable_paypal: "true",
    payment_paypal_sort_order: "1",
    payment_paypal_title: "PayPal sécurisé",
    payment_cod_sort_order: "2",
    payment_cod_recommended: "true",
  });
  assert.equal(methods[0].provider, "paypal");
  assert.equal(methods[0].title, "PayPal sécurisé");
  assert.equal(methods[1].recommended, true);
});

test("payment availability enforces maintenance, city and order limits", () => {
  const [cod] = paymentMethodsFromSettings({
    enable_cod: "true",
    payment_cod_minimum: "100",
    payment_cod_maximum: "1000",
    payment_cod_cities: "Casablanca, Rabat",
  });
  assert.equal(paymentMethodAvailability(cod, "Casablanca", 200).available, true);
  assert.equal(paymentMethodAvailability(cod, "Marrakech", 200).available, false);
  assert.equal(paymentMethodAvailability(cod, "Rabat", 50).available, false);
  assert.equal(paymentMethodAvailability(cod, "Rabat", 1200).available, false);
});

test("maintenance and disabled methods remain unavailable", () => {
  const [cod] = paymentMethodsFromSettings({
    enable_cod: "true",
    payment_cod_maintenance: "true",
    payment_cod_unavailable_message: "Maintenance planifiée",
  });
  assert.deepEqual(paymentMethodAvailability(cod, "Rabat", 200), {
    available: false,
    reason: "Maintenance planifiée",
  });
});

test("payment setting validation rejects unsafe values", () => {
  assert.match(
    validatePaymentSetting("payment_cod_fee", "-1") ?? "",
    /invalide/,
  );
  assert.match(
    validatePaymentSetting("payment_cod_recommended", "yes") ?? "",
    /booléen/,
  );
  assert.equal(validatePaymentSetting("payment_cod_fee", "15"), undefined);
});
