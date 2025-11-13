import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-secondary/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 text-left md:grid-cols-3">
          <div>
            <h2 className="font-headline text-xl font-semibold">
              Quang Apartment
            </h2>
            <p className="mt-2 text-muted-foreground">
              Your trusted partner in finding the perfect high-end apartment in
              Hanoi.
            </p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-headline text-lg font-semibold">
              Contact Information
            </h3>
            <div className="mt-4 space-y-3">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+84 355 885 851</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>quangluxury6886@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>173B Truong Chinh, Dong Da, Hanoi, Vietnam</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Quang Apartment. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
