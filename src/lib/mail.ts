type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  ok: boolean;
  mode: "resend" | "log";
  error?: string;
};

/** Sends email via Resend when RESEND_API_KEY is set; otherwise logs (dev). */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.MAIL_FROM?.trim() || "EasyKrut <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[mail:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true, mode: "log" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<pre>${input.text}</pre>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[mail:resend]", res.status, body);
      return { ok: false, mode: "resend", error: "ส่งอีเมลไม่สำเร็จ" };
    }
    return { ok: true, mode: "resend" };
  } catch (e) {
    console.error("[mail:resend]", e);
    return { ok: false, mode: "resend", error: "ส่งอีเมลไม่สำเร็จ" };
  }
}

export function appBaseUrl() {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3010"
  );
}
