import { motion } from "framer-motion";
import { Factory, Shield, Zap } from "lucide-react";

const FactoryHeader = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl sf-gradient-bg flex items-center justify-center">
          <Factory className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Sirou Factory
          </h1>
          <p className="text-xs text-muted-foreground">
            Application Builder Expert
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sf-safe/10 text-sf-safe text-xs font-medium border border-sf-safe/20">
          <Shield className="h-3.5 w-3.5" />
          Sovereign Mode
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
          <Zap className="h-3.5 w-3.5" />
          Human Oversight Active
        </div>
      </div>
    </motion.header>
  );
};

export default FactoryHeader;
