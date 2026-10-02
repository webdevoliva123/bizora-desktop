import { BRAND, PLATFORM } from "@/lib/constant/platfrom-details";
import Image from "next/image";

const Footer = () => {
    return (
        <footer className="border-t py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-6 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </span>
          <div className="flex items-center gap-2">
            <img
              src={PLATFORM.logo}
              alt={`${PLATFORM.name} logo`}
              width={66}
              height={66}
            />
          </div>
        </div>
      </footer>
    );
};

export default Footer;