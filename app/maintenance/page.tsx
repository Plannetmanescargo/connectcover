import Image from "next/image";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <Image
        src="/brand/connectcoverbig.png"
        alt="Coverza"
        width={140}
        height={40}
        priority
        unoptimized
        className="mb-8 h-auto w-[140px] object-contain"
      />
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(108,76,243,0.16)] bg-[rgba(108,76,243,0.05)] px-3.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.20em] text-[rgb(108,76,243)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[rgb(108,76,243)]" />
        Back soon
      </div>
      <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[0.9] tracking-[-0.065em] text-slate-950 sm:text-[3.5rem]">
        We'll be back<br />
        <span className="text-[rgb(108,76,243)]">very shortly.</span>
      </h1>
      <p className="mt-5 max-w-[28rem] text-[0.95rem] leading-[1.85] text-slate-500">
        Coverza is temporarily unavailable while we carry out some maintenance.
        Check back soon.
      </p>
    </div>
  );
}