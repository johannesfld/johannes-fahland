import { authErrorClass } from "@/components/auth/styles";

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <div className={authErrorClass}>
      <span className="mt-0.5 font-semibold" aria-hidden>
        !
      </span>
      <span>{message}</span>
    </div>
  );
}
