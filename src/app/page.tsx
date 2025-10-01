import Image from "next/image";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Image
        src="/assets/images/svgs/INDEKS-dark.svg"
        alt="INDEKS Logo"
        width={700}
        height={100}
        priority
      />
    </div>
  );
}
