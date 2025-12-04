
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const ZaloIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.5 5.5H7.5C4.73858 5.5 2.5 7.73858 2.5 10.5V13.5C2.5 16.2614 4.73858 18.5 7.5 18.5H9.5V15.5H6.5V10.5C6.5 9.39543 7.39543 8.5 8.5 8.5H15.5C16.6046 8.5 17.5 9.39543 17.5 10.5V15.5H14.5V18.5H16.5C19.2614 18.5 21.5 16.2614 21.5 13.5V10.5C21.5 7.73858 19.2614 5.5 16.5 5.5ZM11.5 10.5H8.5V13.5H11.5V10.5ZM12.5 14.5V11.5C12.5 10.9477 12.9477 10.5 13.5 10.5H15.5V14.5H12.5Z" />
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
                                        <ZaloIcon className="h-9 w-9"/>
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

