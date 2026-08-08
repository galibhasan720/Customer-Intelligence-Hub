import type { Booking, Seat, SeatStatus } from "./types";

export function generateSeats(): Seat[] {
  const rows = ["A","B","C","D","E","F","G","H","I","J"];
  const sold: Record<string,boolean> = {A1:true,A2:true,A5:true,A8:true,A10:true,B3:true,B4:true,B7:true,B11:true,C2:true,C6:true,C9:true,D1:true,D5:true,D8:true,D12:true,E3:true,E4:true,E7:true,F2:true,F9:true,F11:true,G1:true,G6:true,G10:true,H4:true,H5:true,H8:true,I2:true,I7:true,I11:true,J3:true,J6:true,J9:true};
  const held: Record<string,boolean> = {B5:true,B6:true,D3:true,D4:true,F6:true};
  const reserved: Record<string,boolean> = {E1:true,E2:true,E11:true,E12:true};
  const accessible: Record<string,boolean> = {J1:true,J2:true,J11:true,J12:true};
  const companion: Record<string,boolean> = {J4:true,J10:true};
  const seats: Seat[] = [];
  rows.forEach(row => {
    for (let n=1; n<=12; n++) {
      const id=`${row}${n}`, isVip=row==="A", isAcc=!!accessible[id], isCom=!!companion[id];
      let status: SeatStatus = "available";
      if(sold[id]) status="sold"; else if(held[id]) status="held"; else if(reserved[id]) status="reserved";
      else if(isCom) status="companion"; else if(isAcc) status="accessible"; else if(isVip) status="vip-available";
      const price=isVip?2500:isAcc||isCom?500:800;
      const category: Seat["category"]=isVip?"VIP":isAcc?"Accessible":isCom?"Companion":"Standard";
      seats.push({id,row,number:n,status,price,category});
    }
  });
  return seats;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function cx(...c: (string|boolean|undefined|null)[]): string { return c.filter(Boolean).join(" "); }
export function getInitials(name: string): string { return name.split(" ").map(n=>n[0]).slice(0,2).join("").toUpperCase(); }
export function statusColor(s: Booking["status"]) {
  return {
    Confirmed: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    Cancelled: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    Expired: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  }[s];
}
export function seatFill(s: SeatStatus) {
  const m: Record<SeatStatus,{fill:string;stroke:string;interactive:boolean}> = {
    available:{fill:"#DBEAFE",stroke:"#60A5FA",interactive:true}, selected:{fill:"#22C55E",stroke:"#16A34A",interactive:true},
    held:{fill:"#FCD34D",stroke:"#F59E0B",interactive:false}, reserved:{fill:"#FECDD3",stroke:"#FB7185",interactive:false},
    sold:{fill:"#E2E8F0",stroke:"#CBD5E1",interactive:false}, "vip-available":{fill:"#EDE9FE",stroke:"#A78BFA",interactive:true},
    accessible:{fill:"#CCFBF1",stroke:"#2DD4BF",interactive:true}, companion:{fill:"#CFFAFE",stroke:"#22D3EE",interactive:true},
    blocked:{fill:"#F1F5F9",stroke:"#E2E8F0",interactive:false},
  };
  return m[s];
}
