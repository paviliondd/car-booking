import { Car, CheckCircle2 } from "lucide-react";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="min-h-dvh bg-app-muted px-4 py-8 text-content sm:px-6 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-app-border bg-app-surface shadow-xl lg:grid-cols-[1.05fr_1fr]">
        <section
          className="hidden bg-night-surface p-12 text-night-content lg:flex lg:flex-col lg:justify-between"
          aria-label="Lợi ích của datxe"
        >
          <div>
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-on-brand">
              <Car className="h-7 w-7" />
            </div>
            <h2 className="max-w-sm text-4xl font-bold leading-tight text-night-content">
              Mỗi hành trình bắt đầu bằng một chiếc xe phù hợp.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-night-secondary">
              Một tài khoản duy nhất để thuê xe, quản lý hồ sơ và đăng ký xe
              cho thuê.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-night-secondary">
            {[
              "Số điện thoại được xác minh bằng OTP",
              "Hồ sơ cá nhân lưu trữ bảo vệ",
              "Theo dõi chuyến đi và xe cho thuê tập trung",
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-brand" />
                {benefit}
              </li>
            ))}
          </ul>
        </section>
        <section className="p-5 sm:p-10 lg:p-12">
          <AuthForm />
        </section>
      </div>
    </main>
  );
}
