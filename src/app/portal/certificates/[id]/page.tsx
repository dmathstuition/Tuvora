import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getMyCertificate } from '@/services/certificates';
import { CertificateCard } from '@/components/portal/certificate';
import { PrintButton } from '@/components/portal/print-button';

export const metadata: Metadata = { title: 'Certificate' };

export default async function CertificateView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cert = await getMyCertificate(id);
  if (!cert) notFound();

  return (
    <div className="min-h-screen bg-[#f6f7fb] px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            href="/portal/certificates"
            className="inline-flex items-center gap-1 text-sm font-bold text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> My certificates
          </Link>
          <PrintButton />
        </div>
        <CertificateCard cert={cert} />
      </div>
    </div>
  );
}
