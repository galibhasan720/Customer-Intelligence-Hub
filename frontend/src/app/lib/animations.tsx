import { motion } from "motion/react";
import type { ReactNode } from "react";

export const spring = {type:"spring" as const,stiffness:320,damping:26};
export const springFast = {type:"spring" as const,stiffness:420,damping:30};
export const listVariants = { hidden:{}, visible:{transition:{staggerChildren:0.07}} };
export const itemVariants = { hidden:{opacity:0,y:18}, visible:{opacity:1,y:0,transition:{type:"spring" as const,stiffness:280,damping:26}} };
export const modalVariants = { hidden:{opacity:0,scale:0.90,y:24}, visible:{opacity:1,scale:1,y:0,transition:spring}, exit:{opacity:0,scale:0.92,y:12,transition:{duration:0.18}} };

export function PageTransition({children,k}:{children:ReactNode;k:string}) {
  return (
    <motion.div key={k} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.26,ease:[0.25,0.46,0.45,0.94]}}>
      {children}
    </motion.div>
  );
}
