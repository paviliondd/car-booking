import { permanentRedirect } from 'next/navigation';

export default function LegacyOwnerRegistrationPage() {
  permanentRedirect('/become-owner');
}
