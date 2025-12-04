
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const ZaloIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2.001 10.342C2 6.002 2.52 3.322 6.541 2.222c4.02-.9 8.281 1.26 9.721 5.221.6 1.62 1.02 4.02 1.02 8.161 0 3.72-1.2 5.4-3.66 6.12-2.16.66-5.46.3-7.8-.78-2.64-1.2-4.62-3.3-5.22-4.92-.66-1.8-.72-3.9-.6-5.76zm1.5.06c-.06 1.62.06 3.42.6 4.92.54 1.44 2.16 3.18 4.5 4.26 2.34 1.08 5.46 1.44 7.5  .84 2.04-.6 3.12-2.1 3.12-5.46 0-4.08-.42-6.42-1.02-8.04-1.2-3.24-4.8-4.98-8.1-4.2-3.54.84-4.08 3.12-4.08 6.66v1.02zm3.3.06H12v-1.5H6.801v1.5zm8.7-.9v3.96h-1.5V9.502h1.5zm-4.32.96h1.5v1.5h-1.5v-1.5zm-3.12 3.42c-.9 0-1.62-.72-1.62-1.62s.72-1.62 1.62-1.62 1.62.72 1.62 1.62-.72 1.62-1.62 1.62z"/>
    </svg>
);


type ContactCardProps = {
    phoneNumber: string;
};

export default function ContactCard({ phoneNumber }: ContactCardProps) {
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const phoneLink = `tel:${phoneNumber}`;
    const zaloLink = `https://zalo.me/${cleanPhoneNumber}`;
    const whatsappLink = `https://wa.me/${cleanPhoneNumber}`;

    return (
        <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-14 w-14 border-2 border-primary">
                        <AvatarImage src="/placeholder-avatar.jpg" alt="Quang Apartment"/>
                        <AvatarFallback>QA</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold">Quang Apartment</p>
                        <p className="text-sm text-muted-foreground">Sẵn sàng hỗ trợ</p>
                    </div>
                </div>

                {/* Mobile view: Icon buttons */}
                <div className="flex justify-around sm:hidden">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild size="icon" variant="outline" className="rounded-full h-14 w-14 bg-background">
                                    <Link href={phoneLink}>
                                        <Phone className="h-7 w-7"/>
                                        <span className="sr-only">Gọi điện</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Gọi điện</p></TooltipContent>
                        </Tooltip>
                        
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild size="icon" className="rounded-full h-14 w-14 bg-[#0068FF] hover:bg-[#0052CC] text-white">
                                    <Link href={zaloLink} target="_blank">
                                        <ZaloIcon className="h-8 w-8"/>
                                        <span className="sr-only">Zalo</span>
                                    </Link>
                                </Button>
                             </TooltipTrigger>
                            <TooltipContent><p>Chat Zalo</p></TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button asChild size="icon" className="rounded-full h-14 w-14 bg-[#25D366] hover:bg-[#1DA851] text-white">
                                    <Link href={whatsappLink} target="_blank">
                                        <MessageCircle className="h-7 w-7"/>
                                        <span className="sr-only">WhatsApp</span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Chat WhatsApp</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                
                {/* Desktop view: Full buttons */}
                <div className="hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button asChild variant="outline" className="bg-background">
                        <Link href={phoneLink}>
                            <Phone className="mr-2"/> Gọi điện
                        </Link>
                    </Button>
                    <Button asChild className="bg-[#0068FF] hover:bg-[#0052CC] text-white">
                        <Link href={zaloLink} target="_blank">
                           <ZaloIcon className="mr-2 h-5 w-5"/> Zalo
                        </Link>
                    </Button>
                    <Button asChild className="bg-[#25D366] hover:bg-[#1DA851] text-white">
                        <Link href={whatsappLink} target="_blank">
                            <MessageCircle className="mr-2"/> WhatsApp
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
