// HTTP routes: PayPal order creation/capture/webhook, purchases, license verification, asset download checks.
import type { Express } from "express";
import { db, mockLicenses, mockPayments, mockRequests, mockUsers, useMockDb } from "../db.js";
import { escapeRegex, getEmailFromToken, isAuthorizedAdmin } from "../security.js";
import { sendLicenseEmail } from "../services/email.js";
import { PAYPAL_BASE_URL, PAYPAL_HOSTED_PAYMENT_URL, PAYPAL_HOSTED_PLANS, getPayPalAccessToken, isLivePayPal, pendingTransactions, verifyCartPricing } from "../services/paypal.js";
import { createLicenseDataHelper, markBeatExclusivelySold } from "../services/purchases.js";
import { License, Payment, RequestItem } from "../types.js";

export function registerPaymentRoutes(app: Express) {
  // 8. PayPal: Get Available Plans Endpoint
  app.get("/api/paypal/plans", (_req, res) => {
    res.json({
      success: true,
      plans: PAYPAL_HOSTED_PLANS
    });
  });

  // 8b. PayPal: Create Order Endpoint (Server-Side Enforced)
  app.post("/api/paypal/create-order", async (req, res) => {
    try {
      // 1. Resolve buyer email from active session token or request payload
      const tokenEmail = await getEmailFromToken(req);
      const resolvedEmail = (tokenEmail || req.body?.email || req.body?.billing?.email || "").toLowerCase().trim();

      const { items, billing, couponCode } = req.body || {};

      // 2. Server-Side Cart Pricing Verification (Never trust client-supplied total)
      let verifiedItems: any[] = [];
      let verifiedTotal = 150;
      try {
        const verified = verifyCartPricing(items, couponCode);
        verifiedItems = verified.verifiedItems;
        verifiedTotal = verified.verifiedTotal;
      } catch (pricingErr: any) {
        return res.status(400).json({ error: pricingErr.message || "Invalid cart pricing." });
      }

      const reference = `LMN-PP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
      const host = req.get("host") || "theowlclock.io";
      const fallbackOrigin = `${proto}://${host}`;
      const baseAppUrl = (process.env.APP_URL || (host.includes("localhost") ? fallbackOrigin : "https://www.theowlclock.io")).replace(/\/$/, "");
      const returnUrl = `${baseAppUrl}/?payment_verify=paypal`;
      const cancelUrl = `${baseAppUrl}/checkout?status=cancel`;

      let orderId = "";
      let approveLink = "";

      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            intent: "CAPTURE",
            purchase_units: [
              {
                reference_id: reference,
                amount: {
                  currency_code: "USD",
                  value: verifiedTotal.toFixed(2)
                },
                description: `THE OWL CLOCK Archive Clearance for ${verifiedItems.length} Fragment(s)`
              }
            ],
            application_context: {
              brand_name: "LOMON LLC / THE OWL CLOCK",
              landing_page: "NO_PREFERENCE",
              user_action: "PAY_NOW",
              return_url: returnUrl,
              cancel_url: cancelUrl
            }
          })
        });

        const orderData: any = await response.json().catch(() => ({}));
        if (response.ok && orderData.id) {
          orderId = orderData.id;
          approveLink = orderData.links?.find((link: any) => link.rel === "approve")?.href || "";
        } else {
          throw new Error(orderData.message || orderData.details?.[0]?.issue || `PayPal order creation error (${response.status})`);
        }
      } catch (restErr: any) {
        console.warn("[PAYPAL ORDERS API NOTICE]:", restErr.message);
        orderId = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        approveLink = `${PAYPAL_HOSTED_PAYMENT_URL}?order=${orderId}&amt=${verifiedTotal}`;
      }

      // Save pending order record server-side with verified cart pricing
      pendingTransactions.set(orderId, {
        email: tokenEmail,
        userId: tokenEmail,
        items: verifiedItems,
        billing,
        reference,
        amount: verifiedTotal,
        orderId,
        status: "PENDING_SETTLEMENT",
        createdAt: Date.now()
      } as any);

      return res.json({
        success: true,
        orderID: orderId,
        paypalOrderId: orderId,
        reference,
        amount: verifiedTotal,
        approveUrl: approveLink,
        status: "CREATED"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to initialize PayPal transaction." });
    }
  });

  // 9. PayPal: Capture Order Endpoint & Secure Settlement Verification
  app.post("/api/paypal/capture-order", async (req, res) => {
    try {
      const tokenEmail = await getEmailFromToken(req);

      const { orderID, reference, billing, items } = req.body || {};
      const targetToken = (orderID || reference || "").trim();
      if (!targetToken) {
        return res.status(400).json({ error: "orderID is required for payment settlement capture." });
      }

      const pending = pendingTransactions.get(targetToken) as any;

      // Check if transaction has already been completed in DB
      let existingTx: any = null;
      if (useMockDb) {
        existingTx = mockPayments.find(p => p.id === targetToken || (p as any).paypalOrderId === targetToken || (p as any).orderID === targetToken);
      } else if (db) {
        existingTx = await db.collection("payments").findOne({
          $or: [{ id: targetToken }, { paypalOrderId: targetToken }, { orderID: targetToken }]
        });
      }

      if (existingTx && (existingTx.status === "COMPLETED" || existingTx.paymentStatus === "COMPLETED")) {
        return res.json({
          success: true,
          status: "COMPLETED",
          transaction: existingTx,
          reference: existingTx.id,
          licenses: pending?.licenses || []
        });
      }

      let paymentVerified = false;
      let actualAmount = pending?.amount || 150;
      let transactionRef = targetToken;
      let finalOrderId = targetToken;

      // 2. Server-side payment verification: Wait for PayPal settlement confirmation
      try {
        const accessToken = await getPayPalAccessToken();
        let captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(targetToken)}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        let captureData: any = await captureResponse.json().catch(() => ({}));

        // If already captured, fetch order details to verify settlement
        if (!captureResponse.ok && (captureData.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED" || captureData.name === "UNPROCESSABLE_ENTITY")) {
          const getOrderRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(targetToken)}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (getOrderRes.ok) {
            captureData = await getOrderRes.json().catch(() => ({}));
          }
        }

        if (captureData.status === "COMPLETED") {
          paymentVerified = true;
          finalOrderId = captureData.id || targetToken;
          const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          actualAmount = parseFloat(
            capturedUnit?.amount?.value ||
            captureData.purchase_units?.[0]?.amount?.value ||
            String(pending?.amount || "150")
          );
          transactionRef = capturedUnit?.id || captureData.id || targetToken;
        } else if (captureData.status === "APPROVED") {
          return res.status(400).json({
            success: false,
            status: "APPROVED",
            error: "Payment approved by payer; awaiting settlement capture finalization. Please poll status."
          });
        } else if (captureData.status === "PAYER_ACTION_REQUIRED" || captureData.status === "CREATED") {
          return res.status(400).json({
            success: false,
            status: captureData.status,
            error: "Awaiting payer authorization on PayPal gateway. Payment has not settled."
          });
        } else if (!isLivePayPal && targetToken.startsWith("SANDBOX-")) {
          // Test mode settlement verification
          paymentVerified = true;
          actualAmount = pending?.amount || parseFloat(req.body.amount) || 150.00;
          transactionRef = targetToken;
          finalOrderId = targetToken;
        } else {
          return res.status(400).json({
            success: false,
            status: captureData.status || "FAILED",
            error: captureData.message || captureData.details?.[0]?.issue || "PayPal settlement could not be confirmed by gateway."
          });
        }
      } catch (err: any) {
        if (!isLivePayPal && targetToken.startsWith("SANDBOX-")) {
          paymentVerified = true;
          actualAmount = pending?.amount || 150.00;
        } else {
          console.error("[PAYPAL SERVER-SIDE CAPTURE ERROR]:", err.message);
          return res.status(502).json({ error: `PayPal Settlement Verification Error: ${err.message}` });
        }
      }

      if (!paymentVerified) {
        return res.status(400).json({ error: "Could not confirm settlement with PayPal." });
      }

      // 3. Admin Dashboard Logging: Record transaction in database with status: COMPLETED
      const dbEmail = tokenEmail.toLowerCase().trim();
      const effectiveBilling = billing || pending?.billing;
      const legalName = (effectiveBilling ? `${effectiveBilling.firstName || ""} ${effectiveBilling.lastName || ""}`.trim() : "") || dbEmail;
      const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const finalItems = pending?.items || items || [];

      const generatedLicenses: License[] = finalItems.map((item: any) =>
        createLicenseDataHelper(item, dbEmail, legalName, effectiveBilling, transactionRef, formattedDate)
      );

      const generatedRequests: RequestItem[] = finalItems.map((item: any) => {
        const refSuffix = Math.floor(10 + Math.random() * 90);
        return {
          ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
          type: `Master Acquisition & Sync Verification`,
          target: item.name,
          status: "APPROVED / EXECUTED",
          date: new Date().toISOString().split("T")[0],
          email: dbEmail
        };
      });

      const completedTransaction: Payment = {
        id: transactionRef,
        userId: dbEmail,
        email: dbEmail,
        clientEmail: dbEmail,
        clientName: legalName,
        paypalOrderId: finalOrderId,
        orderID: finalOrderId,
        items: finalItems,
        amount: actualAmount,
        currency: "USD",
        status: "COMPLETED", // Explicitly logged with status: COMPLETED
        paymentStatus: "COMPLETED",
        gateway: "paypal",
        paymentMethod: "PayPal",
        date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
        transactionDate: formattedDate,
        createdAt: new Date(),
        refundStatus: "None"
      };

      // If exclusive item, retire from archive and update database inventory
      await markBeatExclusivelySold(finalItems, dbEmail);

      if (useMockDb) {
        mockLicenses.unshift(...generatedLicenses);
        mockRequests.unshift(...generatedRequests);
        mockPayments.unshift(completedTransaction);
      } else {
        await db!.collection("licenses").insertMany(generatedLicenses);
        await db!.collection("requests").insertMany(generatedRequests);
        await db!.collection("payments").insertOne(completedTransaction);
      }

      pendingTransactions.set(targetToken, {
        ...pending,
        status: "COMPLETED",
        transaction: completedTransaction,
        licenses: generatedLicenses
      });

      const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, transactionRef);

      return res.json({
        success: true,
        status: "COMPLETED",
        reference: transactionRef,
        transaction: completedTransaction,
        licenses: generatedLicenses,
        requests: generatedRequests,
        emailPreviewUrl,
        database: useMockDb ? "MOCK_IN_MEMORY" : "MONGODB"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Internal server error during PayPal verification." });
    }
  });

  // 9b. PayPal: Order Settlement Status Polling Endpoint (Frontend Polling)
  app.get("/api/paypal/order-status/:orderId", async (req, res) => {
    try {
      const tokenEmail = await getEmailFromToken(req);

      const { orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ error: "orderId is required." });
      }

      // 1. Check in-memory pending transactions
      const pending = pendingTransactions.get(orderId) as any;
      if (pending && pending.status === "COMPLETED" && pending.transaction) {
        return res.json({
          status: "COMPLETED",
          transaction: pending.transaction,
          licenses: pending.licenses
        });
      }

      // 2. Check Database payments collection
      let existingPayment: any = null;
      if (useMockDb) {
        existingPayment = mockPayments.find(p => p.id === orderId || (p as any).paypalOrderId === orderId || (p as any).orderID === orderId);
      } else if (db) {
        existingPayment = await db.collection("payments").findOne({
          $or: [{ id: orderId }, { paypalOrderId: orderId }, { orderID: orderId }]
        });
      }

      if (existingPayment) {
        return res.json({
          status: "COMPLETED",
          transaction: existingPayment,
          licenses: pending?.licenses || []
        });
      }

      // 3. Query PayPal Orders API to check settlement or auto-capture if approved
      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
          headers: { "Authorization": `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const orderData: any = await response.json();
          if (orderData.status === "COMPLETED") {
            // Trigger capture flow / logging
            const capturedUnit = orderData.purchase_units?.[0]?.payments?.captures?.[0];
            const capturedAmount = parseFloat(capturedUnit?.amount?.value || orderData.purchase_units?.[0]?.amount?.value || String(pending?.amount || "150"));
            const transactionRef = capturedUnit?.id || orderData.id || orderId;

            const dbEmail = tokenEmail.toLowerCase().trim();
            const legalName = (pending?.billing ? `${pending.billing.firstName || ""} ${pending.billing.lastName || ""}`.trim() : "") || dbEmail;
            const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
            const finalItems = pending?.items || [];

            const generatedLicenses: License[] = finalItems.map((item: any) =>
              createLicenseDataHelper(item, dbEmail, legalName, pending?.billing, transactionRef, formattedDate)
            );

            const completedTransaction: Payment = {
              id: transactionRef,
              userId: dbEmail,
              email: dbEmail,
              clientEmail: dbEmail,
              clientName: legalName,
              paypalOrderId: orderId,
              orderID: orderId,
              items: finalItems,
              amount: capturedAmount,
              currency: "USD",
              status: "COMPLETED",
              paymentStatus: "COMPLETED",
              gateway: "paypal",
              paymentMethod: "PayPal",
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              transactionDate: formattedDate,
              createdAt: new Date(),
              refundStatus: "None"
            };

            if (useMockDb) {
              mockLicenses.unshift(...generatedLicenses);
              mockPayments.unshift(completedTransaction);
            } else {
              await db!.collection("licenses").insertMany(generatedLicenses);
              await db!.collection("payments").insertOne(completedTransaction);
            }

            pendingTransactions.set(orderId, {
              ...pending,
              status: "COMPLETED",
              transaction: completedTransaction,
              licenses: generatedLicenses
            });

            return res.json({
              status: "COMPLETED",
              transaction: completedTransaction,
              licenses: generatedLicenses
            });
          } else if (orderData.status === "APPROVED") {
            // If approved by payer, execute capture automatically
            const capRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              }
            });
            const capData: any = await capRes.json().catch(() => ({}));
            if (capData.status === "COMPLETED") {
              const capturedUnit = capData.purchase_units?.[0]?.payments?.captures?.[0];
              const capturedAmount = parseFloat(capturedUnit?.amount?.value || capData.purchase_units?.[0]?.amount?.value || String(pending?.amount || "150"));
              const transactionRef = capturedUnit?.id || capData.id || orderId;

              const dbEmail = tokenEmail.toLowerCase().trim();
              const legalName = (pending?.billing ? `${pending.billing.firstName || ""} ${pending.billing.lastName || ""}`.trim() : "") || dbEmail;
              const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
              const finalItems = pending?.items || [];

              const generatedLicenses: License[] = finalItems.map((item: any) =>
                createLicenseDataHelper(item, dbEmail, legalName, pending?.billing, transactionRef, formattedDate)
              );

              const completedTransaction: Payment = {
                id: transactionRef,
                userId: dbEmail,
                email: dbEmail,
                clientEmail: dbEmail,
                clientName: legalName,
                paypalOrderId: orderId,
                orderID: orderId,
                items: finalItems,
                amount: capturedAmount,
                currency: "USD",
                status: "COMPLETED",
                paymentStatus: "COMPLETED",
                gateway: "paypal",
                paymentMethod: "PayPal",
                date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
                transactionDate: formattedDate,
                createdAt: new Date(),
                refundStatus: "None"
              };

              if (useMockDb) {
                mockLicenses.unshift(...generatedLicenses);
                mockPayments.unshift(completedTransaction);
              } else {
                await db!.collection("licenses").insertMany(generatedLicenses);
                await db!.collection("payments").insertOne(completedTransaction);
              }

              pendingTransactions.set(orderId, {
                ...pending,
                status: "COMPLETED",
                transaction: completedTransaction,
                licenses: generatedLicenses
              });

              return res.json({
                status: "COMPLETED",
                transaction: completedTransaction,
                licenses: generatedLicenses
              });
            }
            return res.json({ status: "APPROVED", message: "Payer approved payment, finalizing settlement..." });
          } else {
            return res.json({ status: orderData.status || "PENDING_SETTLEMENT" });
          }
        }
      } catch (_e) {}

      return res.json({ status: "PENDING_SETTLEMENT" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9c. PayPal: Webhook Listener for Background Settlement Notifications
  app.post("/api/paypal/webhook", async (req, res) => {
    try {
      const event = req.body;
      console.log("[PAYPAL WEBHOOK EVENT]:", event?.event_type);

      if (event?.event_type === "PAYMENT.CAPTURE.COMPLETED" || event?.event_type === "CHECKOUT.ORDER.COMPLETED") {
        const resource = event.resource;
        const orderId = resource?.supplementary_data?.related_ids?.order_id || resource?.id;

        // Never trust the webhook body on its own: confirm the order is really COMPLETED with PayPal.
        let verifiedWithPayPal = false;
        if (orderId && typeof orderId === "string") {
          try {
            const verifyToken = await getPayPalAccessToken();
            const verifyRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
              headers: { "Authorization": `Bearer ${verifyToken}` }
            });
            if (verifyRes.ok) {
              const verifyData: any = await verifyRes.json();
              verifiedWithPayPal = verifyData?.status === "COMPLETED";
            }
          } catch (verifyErr: any) {
            console.warn("[PAYPAL WEBHOOK] Could not verify order with PayPal:", verifyErr?.message);
          }
        }
        if (!verifiedWithPayPal) {
          console.warn("[PAYPAL WEBHOOK] Ignored event: order could not be verified as COMPLETED with PayPal.", orderId);
          return res.status(200).json({ received: true, ignored: true });
        }

        if (orderId && pendingTransactions.has(orderId)) {
          const pending = pendingTransactions.get(orderId) as any;
          if (pending.status !== "COMPLETED") {
            const dbEmail = pending.email || "guest@lomon.local";
            const transactionRef = resource.id || `PP-${orderId}`;
            const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

            const generatedLicenses: License[] = pending.items.map((item: any) =>
              createLicenseDataHelper(item, dbEmail, dbEmail, pending.billing, transactionRef, formattedDate)
            );

            const completedTransaction: Payment = {
              id: transactionRef,
              userId: dbEmail,
              email: dbEmail,
              clientEmail: dbEmail,
              clientName: dbEmail,
              paypalOrderId: orderId,
              orderID: orderId,
              items: pending.items,
              amount: parseFloat(resource.amount?.value || pending.amount),
              currency: resource.amount?.currency_code || "USD",
              status: "COMPLETED",
              paymentStatus: "COMPLETED",
              gateway: "paypal",
              paymentMethod: "PayPal",
              date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
              transactionDate: formattedDate,
              createdAt: new Date(),
              refundStatus: "None"
            };

            if (useMockDb) {
              mockLicenses.unshift(...generatedLicenses);
              mockPayments.unshift(completedTransaction);
            } else if (db) {
              await db.collection("licenses").insertMany(generatedLicenses);
              await db.collection("payments").insertOne(completedTransaction);
            }

            // If exclusive item, retire from archive and update database inventory
            await markBeatExclusivelySold(pending.items, dbEmail);

            pendingTransactions.set(orderId, {
              ...pending,
              status: "COMPLETED",
              transaction: completedTransaction,
              licenses: generatedLicenses
            });
          }
        }
      }
      return res.json({ received: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9d. PayPal: Return Endpoint Callback (Server-Side Verified)
  app.get("/api/paypal/return", async (req, res) => {
    try {
      const token = (req.query.token || req.query.orderID) as string;
      if (!token) {
        return res.redirect("/?payment_error=Missing PayPal token parameter.");
      }

      const pending = pendingTransactions.get(token) as any;
      const email = pending?.email || "guest@lomon.local";
      const items = pending?.items || [];
      const billing = pending?.billing;

      let paymentVerified = false;
      let actualAmount = pending?.amount || 150;
      let transactionRef = token;

      // Strict settlement verification: Only grant licenses if PayPal confirms completion
      try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(token)}/capture`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        let captureData: any = await response.json().catch(() => ({}));

        if (!response.ok && (captureData.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED" || captureData.name === "UNPROCESSABLE_ENTITY")) {
          const getRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${encodeURIComponent(token)}`, {
            headers: { "Authorization": `Bearer ${accessToken}` }
          });
          if (getRes.ok) {
            captureData = await getRes.json().catch(() => ({}));
          }
        }

        if (captureData.status === "COMPLETED") {
          paymentVerified = true;
          const capturedUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];
          actualAmount = parseFloat(capturedUnit?.amount?.value || captureData.purchase_units?.[0]?.amount?.value || "150");
          transactionRef = captureData.id || token;
        }
      } catch (e: any) {
        console.warn("[PAYPAL RETURN CAPTURE CHECK]:", e.message);
      }

      if (paymentVerified) {
        const dbEmail = email.toLowerCase().trim();
        const legalName = (billing ? `${billing.firstName || ""} ${billing.lastName || ""}`.trim() : "") || dbEmail;
        const formattedDate = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

        const generatedLicenses: License[] = items.map((item: any) =>
          createLicenseDataHelper(item, dbEmail, legalName, billing, transactionRef, formattedDate)
        );

        const generatedRequests: RequestItem[] = items.map((item: any) => {
          const refSuffix = Math.floor(10 + Math.random() * 90);
          return {
            ref: `REQ-0${Math.floor(10 + Math.random() * 90)}-${refSuffix}`,
            type: `Master Acquisition & Sync Verification`,
            target: item.name,
            status: "APPROVED / EXECUTED",
            date: new Date().toISOString().split("T")[0],
            email: dbEmail
          };
        });

        const completedTransaction: Payment = {
          id: transactionRef,
          userId: dbEmail,
          email: dbEmail,
          clientEmail: dbEmail,
          clientName: legalName,
          paypalOrderId: token,
          orderID: token,
          items,
          amount: actualAmount,
          currency: "USD",
          status: "COMPLETED",
          paymentStatus: "COMPLETED",
          gateway: "paypal",
          paymentMethod: "PayPal",
          date: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
          transactionDate: formattedDate,
          createdAt: new Date(),
          refundStatus: "None"
        };

        if (useMockDb) {
          mockLicenses.unshift(...generatedLicenses);
          mockRequests.unshift(...generatedRequests);
          mockPayments.unshift(completedTransaction);
        } else {
          await db!.collection("licenses").insertMany(generatedLicenses);
          await db!.collection("requests").insertMany(generatedRequests);
          await db!.collection("payments").insertOne(completedTransaction);
        }

        // If exclusive item, retire from archive and update database inventory
        await markBeatExclusivelySold(items, dbEmail);

        pendingTransactions.delete(token);

        const emailPreviewUrl = await sendLicenseEmail(dbEmail, generatedLicenses, actualAmount, transactionRef);
        return res.redirect(`/?payment_success=true&reference=${transactionRef}&email=${encodeURIComponent(dbEmail)}&email_preview_url=${encodeURIComponent(emailPreviewUrl)}`);
      } else {
        return res.redirect("/?payment_error=PayPal settlement verification pending. Please complete transaction on PayPal.");
      }
    } catch (err: any) {
      console.error("[PAYPAL RETURN ERROR]", err);
      return res.redirect("/?payment_error=" + encodeURIComponent(err.message || "PayPal return internal server error."));
    }
  });

  // 10. Database Action: Secure License Transfer CRUD action
  app.post("/api/licenses/transfer", async (req, res) => {
    try {
      const ownerEmail = await getEmailFromToken(req);
      if (!ownerEmail) {
        return res.status(401).json({ error: "Unauthorized. Authorization token required." });
      }

      const { licenseId, recipientEmail } = req.body;
      if (!licenseId || !recipientEmail) {
        return res.status(400).json({ error: "License ID and recipient email address are required fields." });
      }

      const targetRecipient = recipientEmail.toLowerCase().trim();
      const cleanLicenseId = licenseId.trim();

      // Check if recipient is a registered user
      let recipientExists = false;
      if (useMockDb) {
        recipientExists = mockUsers.has(targetRecipient) || targetRecipient === "evianaconcepts1@gmail.com";
      } else {
        const recipientUser = await db!.collection("users").findOne({
          $or: [
            { email: targetRecipient },
            { email: { $regex: new RegExp(`^${targetRecipient.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") } }
          ]
        });
        recipientExists = !!recipientUser;
      }

      if (!recipientExists) {
        return res.status(404).json({ error: `Transfer recipient "${targetRecipient}" is not a registered user.` });
      }

      // 1. Verify license ownership
      let existingLicense: License | null = null;
      if (useMockDb) {
        existingLicense = mockLicenses.find(lic => lic.id === cleanLicenseId && lic.email === ownerEmail) || null;
      } else {
        existingLicense = (await db!.collection("licenses").findOne({ id: cleanLicenseId, email: ownerEmail })) as any;
      }

      if (!existingLicense) {
        return res.status(403).json({ error: "Access denied. You do not own this license or it does not exist." });
      }

      // 2. Secure Asset & Token Transfer Check: Database must confirm order status is COMPLETED
      if (!isAuthorizedAdmin(ownerEmail)) {
        let paymentRecord: any = null;
        if (useMockDb) {
          paymentRecord = mockPayments.find(p => 
            (existingLicense!.transactionRef && (p.id === existingLicense!.transactionRef || p.transactionRef === existingLicense!.transactionRef)) ||
            p.userId === ownerEmail || p.email === ownerEmail || p.clientEmail === ownerEmail
          );
        } else if (db) {
          paymentRecord = await db.collection("payments").findOne({
            $or: [
              { id: existingLicense.transactionRef },
              { transactionRef: existingLicense.transactionRef },
              { email: ownerEmail },
              { clientEmail: ownerEmail },
              { userId: ownerEmail }
            ]
          });
        }

        // Check if any payment is currently pending
        const pendingInMem = Array.from(pendingTransactions.values()).find((p: any) => 
          (p.email || "").toLowerCase().trim() === ownerEmail.toLowerCase().trim() && p.status !== "COMPLETED"
        );

        if (pendingInMem || (paymentRecord && (paymentRecord.status === "PENDING" || paymentRecord.paymentStatus === "PENDING"))) {
          return res.status(402).json({
            allowed: false,
            status: "PENDING",
            error: "Verifying Payment: Settlement is pending confirmation. Audio token cannot be transferred until payment is confirmed COMPLETED."
          });
        }

        if (!paymentRecord || (paymentRecord.status !== "COMPLETED" && paymentRecord.paymentStatus !== "COMPLETED")) {
          return res.status(403).json({
            allowed: false,
            status: "PAYMENT_INCOMPLETE",
            error: "Payment Incomplete: A confirmed COMPLETED order in the archive database is required to transfer audio tokens."
          });
        }
      }

      // Verify ownership and perform transfer
      let success = false;
      let transferredLicense: License | null = null;

      if (useMockDb) {
        const idx = mockLicenses.findIndex(lic => lic.id === cleanLicenseId && lic.email === ownerEmail);
        if (idx !== -1) {
          mockLicenses[idx].email = targetRecipient;
          // Update signature to reflect transfer
          mockLicenses[idx].signature = `TRANSFERRED FROM ${ownerEmail.toUpperCase()} TO ${targetRecipient.toUpperCase()} - SECURITY CODE: ${mockLicenses[idx].hash}`;
          transferredLicense = mockLicenses[idx];
          success = true;

          // Register requests log for transfer audit
          mockRequests.push({
            ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
            type: "License Transfer Audit Log",
            target: mockLicenses[idx].song,
            status: `TRANSFERRED TO ${targetRecipient.toUpperCase()}`,
            date: new Date().toISOString().split("T")[0],
            email: ownerEmail
          });
          mockRequests.push({
            ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
            type: "License Received Audit Log",
            target: mockLicenses[idx].song,
            status: `RECEIVED FROM ${ownerEmail.toUpperCase()}`,
            date: new Date().toISOString().split("T")[0],
            email: targetRecipient
          });
        }
      } else {
        const licensesCol = db!.collection("licenses");
        const license = await licensesCol.findOne({ id: cleanLicenseId, email: ownerEmail });
        if (license) {
          const newSig = `TRANSFERRED FROM ${ownerEmail.toUpperCase()} TO ${targetRecipient.toUpperCase()} - SECURITY CODE: ${license.hash}`;
          await licensesCol.updateOne(
            { id: cleanLicenseId },
            { $set: { email: targetRecipient, signature: newSig } }
          );
          transferredLicense = (await licensesCol.findOne({ id: cleanLicenseId })) as any;
          success = true;

          // Log transfer audit requests
          await db!.collection("requests").insertMany([
            {
              ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
              type: "License Transfer Audit Log",
              target: license.song,
              status: `TRANSFERRED TO ${targetRecipient.toUpperCase()}`,
              date: new Date().toISOString().split("T")[0],
              email: ownerEmail
            },
            {
              ref: `REQ-XFER-${Math.floor(100 + Math.random() * 900)}`,
              type: "License Received Audit Log",
              target: license.song,
              status: `RECEIVED FROM ${ownerEmail.toUpperCase()}`,
              date: new Date().toISOString().split("T")[0],
              email: targetRecipient
            }
          ]);
        }
      }

      if (success && transferredLicense) {
        res.json({ success: true, message: `License ${cleanLicenseId} successfully transferred to ${targetRecipient}.`, license: transferredLicense });
      } else {
        res.status(403).json({ error: "Access denied. You do not own this license or it does not exist." });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to execute license transfer protocol." });
    }
  });

  // 10b. Secure Asset Transfer & Download Verification Endpoint
  // Grants download access only after database confirms order status is COMPLETED.
  // Blocks access and returns "PENDING" ("Verifying Payment") or "PAYMENT_INCOMPLETE" ("Payment Incomplete").
  app.all(["/api/assets/verify-download", "/api/user/verify-asset-access"], async (req, res) => {
    try {
      const tokenEmail = await getEmailFromToken(req);
      if (!tokenEmail) {
        return res.status(401).json({
          allowed: false,
          status: "UNAUTHENTICATED",
          error: "Authentication required: Active session required to verify beat asset transfer access."
        });
      }

      const email = tokenEmail.toLowerCase().trim();
      if (isAuthorizedAdmin(email)) {
        return res.json({
          allowed: true,
          status: "COMPLETED",
          message: "Administrator clearance granted. Full asset transfer authorized."
        });
      }

      const licenseId = ((req.method === "POST" ? req.body?.licenseId : req.query?.licenseId) || "").toString().trim();
      const songName = ((req.method === "POST" ? req.body?.songName : req.query?.songName) || "").toString().trim().toLowerCase();
      const orderId = ((req.method === "POST" ? req.body?.orderId : req.query?.orderId) || "").toString().trim();
      const ref = ((req.method === "POST" ? req.body?.reference : req.query?.reference) || "").toString().trim();

      // Query user's payments from database
      let payments: Payment[] = [];
      if (useMockDb) {
        payments = mockPayments.filter(p => {
          const pEmail = (p.userId || p.email || p.clientEmail || "").toLowerCase().trim();
          return pEmail === email;
        });
      } else if (db) {
        payments = (await db.collection("payments").find({
          $or: [
            { email: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
            { clientEmail: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } },
            { userId: { $regex: new RegExp(`^${escapeRegex(email)}$`, "i") } }
          ]
        }).toArray()) as any[];
      }

      // Check if any in-memory pending payment exists for this user
      const pendingInMem = Array.from(pendingTransactions.values()).find((p: any) => {
        const pEmail = (p.email || "").toLowerCase().trim();
        return pEmail === email && p.status !== "COMPLETED";
      });

      if (pendingInMem) {
        return res.status(402).json({
          allowed: false,
          status: "PENDING",
          message: "Verifying Payment: Settlement is pending confirmation with the financial network. Master audio downloads remain locked until cleared."
        });
      }

      // Match payment for the requested asset if specific parameters provided
      let matchedPayment: Payment | undefined;
      if (orderId || ref) {
        matchedPayment = payments.find(p => p.paypalOrderId === orderId || p.orderID === orderId || p.id === ref || (p as any).transactionRef === ref);
      }
      if (!matchedPayment && (licenseId || songName)) {
        matchedPayment = payments.find(p => {
          if (p.items && Array.isArray(p.items)) {
            return p.items.some((it: any) => {
              const itName = (it.name || "").toLowerCase().trim();
              const itId = (it.id || it.fragmentId || "").toLowerCase().trim();
              return (songName && (itName.includes(songName) || songName.includes(itName))) ||
                     (licenseId && (itId === licenseId.toLowerCase() || (it.tierId || "").toLowerCase() === licenseId.toLowerCase()));
            });
          }
          return false;
        });
      }
      if (!matchedPayment && payments.length > 0) {
        // Fallback: check if the user has any verified completed payment in the database
        matchedPayment = payments.find(p => p.status === "COMPLETED" || p.paymentStatus === "COMPLETED") || payments[0];
      }

      if (matchedPayment) {
        const status = (matchedPayment.status || matchedPayment.paymentStatus || "").toUpperCase();
        if (status === "COMPLETED") {
          return res.json({
            allowed: true,
            status: "COMPLETED",
            message: "Payment confirmed COMPLETED. Beat asset transfer and master downloads authorized.",
            orderId: matchedPayment.paypalOrderId || matchedPayment.id
          });
        }
        if (status === "PENDING" || status === "PENDING_SETTLEMENT") {
          return res.status(402).json({
            allowed: false,
            status: "PENDING",
            message: "Verifying Payment: Settlement is pending confirmation. Master file downloads are locked."
          });
        }
      }

      // If no completed order found in database
      return res.status(403).json({
        allowed: false,
        status: "PAYMENT_INCOMPLETE",
        message: "Payment Incomplete: A confirmed COMPLETED order record in the archive database is required to download master beat assets."
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Internal server error verifying asset access." });
    }
  });
}
